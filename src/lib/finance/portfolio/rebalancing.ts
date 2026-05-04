import type {
  PortfolioAssetInput,
  PortfolioDriftPoint,
  PortfolioPerformancePoint,
  PortfolioSimulationResult,
  PortfolioWeightMap,
  RebalanceEvent,
  RebalanceReason,
  RebalancingStrategyConfig,
  RebalancingStrategyId,
} from "@/lib/finance/portfolio/types";
import type { MarketDataExplorerPayload } from "@/lib/market-data/types";

export const DEFAULT_REBALANCING_STRATEGY: RebalancingStrategyId = "quarterly";
export const DEFAULT_REBALANCING_THRESHOLD = 0.05;

export const REBALANCING_STRATEGY_OPTIONS: Array<{
  id: RebalancingStrategyId;
  label: string;
  description: string;
}> = [
  {
    id: "none",
    label: "Buy & Hold",
    description: "Set initial weights once and allow the allocation to drift.",
  },
  {
    id: "monthly",
    label: "Monthly",
    description: "Reset to target weights at each month-end observation.",
  },
  {
    id: "quarterly",
    label: "Quarterly",
    description: "Reset to target weights at each quarter-end observation.",
  },
  {
    id: "annual",
    label: "Annual",
    description: "Reset to target weights at each year-end observation.",
  },
  {
    id: "threshold",
    label: "Threshold",
    description: "Reset when any holding drifts beyond the selected band.",
  },
];

export const REBALANCING_THRESHOLD_OPTIONS = [0.025, 0.05, 0.1] as const;

const EPSILON = 1e-10;

export function simulatePortfolioRebalancing(input: {
  data: MarketDataExplorerPayload;
  assets: PortfolioAssetInput[];
  initialCapital: number;
  strategy: RebalancingStrategyConfig;
}): PortfolioSimulationResult {
  const dates = input.data.points.map((point) => point.date);
  const targetWeights = buildTargetWeights(input.assets);
  const tickers = input.assets.map((asset) => asset.ticker);

  if (dates.length < 2) {
    throw new Error(
      "Not enough overlapping daily history was found across the selected ETFs.",
    );
  }

  if (!Number.isFinite(input.initialCapital) || input.initialCapital <= 0) {
    throw new Error("Initial capital must be greater than zero.");
  }

  const pricesByTicker = buildPriceSeries({
    data: input.data,
    tickers,
  });
  const strategy = normalizeStrategy(input.strategy);
  const periodicRebalanceDates = buildPeriodicRebalanceDateSet({
    dates,
    strategyId: strategy.id,
  });
  let assetValues = Object.fromEntries(
    tickers.map((ticker) => [
      ticker,
      input.initialCapital * (targetWeights[ticker] ?? 0),
    ]),
  );
  let previousBalance = input.initialCapital;
  const performancePoints: PortfolioPerformancePoint[] = [
    {
      date: dates[0],
      balance: input.initialCapital,
      cumulativeReturn: 0,
    },
  ];
  const dailyReturns: number[] = [];
  const driftPoints: PortfolioDriftPoint[] = [
    buildDriftPoint({
      date: dates[0],
      weights: targetWeights,
      targetWeights,
    }),
  ];
  const rebalanceEvents: RebalanceEvent[] = [];

  for (let index = 1; index < dates.length; index += 1) {
    const date = dates[index];

    assetValues = applyPriceMove({
      tickers,
      assetValues,
      pricesByTicker,
      index,
    });

    const balanceBeforeRebalance = sumValues(assetValues);

    if (!Number.isFinite(balanceBeforeRebalance) || balanceBeforeRebalance <= 0) {
      throw new Error(
        "Portfolio simulation produced an invalid balance. Check the aligned price history.",
      );
    }

    const dailyReturn = balanceBeforeRebalance / previousBalance - 1;

    if (!Number.isFinite(dailyReturn)) {
      throw new Error(
        "Portfolio simulation produced an invalid daily return. Check the aligned price history.",
      );
    }

    dailyReturns.push(dailyReturn);

    const beforeWeights = calculateWeights(assetValues, balanceBeforeRebalance);
    const driftPoint = buildDriftPoint({
      date,
      weights: beforeWeights,
      targetWeights,
    });
    const rebalanceReason = getRebalanceReason({
      date,
      driftPoint,
      periodicRebalanceDates,
      strategy,
    });

    driftPoints.push(driftPoint);
    performancePoints.push({
      date,
      balance: balanceBeforeRebalance,
      cumulativeReturn: balanceBeforeRebalance / input.initialCapital - 1,
    });

    if (rebalanceReason) {
      const turnover = calculateTurnover(beforeWeights, targetWeights);

      if (turnover > EPSILON) {
        rebalanceEvents.push({
          date,
          reason: rebalanceReason,
          turnover,
          beforeWeights,
          afterWeights: targetWeights,
          maxDriftBeforeRebalance: driftPoint.maxDrift,
        });

        assetValues = rebalanceToTargets({
          balance: balanceBeforeRebalance,
          targetWeights,
        });
      }
    }

    previousBalance = balanceBeforeRebalance;
  }

  const finalBalance = sumValues(assetValues);
  const finalWeights = calculateWeights(assetValues, finalBalance);
  const finalDrift = calculateDriftStats(finalWeights, targetWeights).maxDrift;
  const totalTurnover = rebalanceEvents.reduce(
    (sum, event) => sum + event.turnover,
    0,
  );

  return {
    strategy,
    performancePoints,
    dailyReturns,
    driftPoints,
    rebalanceEvents,
    finalWeights,
    totalTurnover,
    rebalanceCount: rebalanceEvents.length,
    averageDrift: calculateAverageDrift(driftPoints),
    maxDrift: Math.max(...driftPoints.map((point) => point.maxDrift)),
    finalDrift,
  };
}

export function getRebalancingStrategyLabel(
  strategy: RebalancingStrategyConfig,
): string {
  const option = REBALANCING_STRATEGY_OPTIONS.find(
    (entry) => entry.id === strategy.id,
  );

  if (strategy.id === "threshold") {
    return `${option?.label ?? "Threshold"} ${formatThreshold(
      strategy.threshold,
    )}`;
  }

  return option?.label ?? "Buy & Hold";
}

function normalizeStrategy(
  strategy: RebalancingStrategyConfig,
): RebalancingStrategyConfig {
  if (strategy.id !== "threshold") {
    return { id: strategy.id };
  }

  return {
    id: "threshold",
    threshold:
      Number.isFinite(strategy.threshold) && (strategy.threshold ?? 0) > 0
        ? strategy.threshold
        : DEFAULT_REBALANCING_THRESHOLD,
  };
}

function buildTargetWeights(assets: PortfolioAssetInput[]): PortfolioWeightMap {
  const weights = Object.fromEntries(
    assets.map((asset) => [asset.ticker, asset.weight / 100]),
  );
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    throw new Error("Portfolio weights must be positive.");
  }

  return Object.fromEntries(
    Object.entries(weights).map(([ticker, weight]) => [ticker, weight / totalWeight]),
  );
}

function buildPriceSeries(input: {
  data: MarketDataExplorerPayload;
  tickers: string[];
}): Record<string, number[]> {
  return Object.fromEntries(
    input.tickers.map((ticker) => {
      const prices = input.data.points.map((point) => point.prices[ticker]);

      if (prices.some((price) => !Number.isFinite(price) || price <= 0)) {
        throw new Error(
          `Missing aligned price history for ${ticker}. Try a different ticker or lookback window.`,
        );
      }

      return [ticker, prices];
    }),
  );
}

function buildPeriodicRebalanceDateSet(input: {
  dates: string[];
  strategyId: RebalancingStrategyId;
}): Set<string> {
  if (
    input.strategyId !== "monthly" &&
    input.strategyId !== "quarterly" &&
    input.strategyId !== "annual"
  ) {
    return new Set();
  }

  const rebalanceDates = new Set<string>();

  for (let index = 1; index < input.dates.length - 1; index += 1) {
    const currentKey = getPeriodKey(input.dates[index], input.strategyId);
    const nextKey = getPeriodKey(input.dates[index + 1], input.strategyId);

    if (currentKey !== nextKey) {
      rebalanceDates.add(input.dates[index]);
    }
  }

  return rebalanceDates;
}

function getPeriodKey(date: string, strategyId: RebalancingStrategyId): string {
  const year = date.slice(0, 4);
  const month = Number(date.slice(5, 7));

  if (strategyId === "monthly") {
    return `${year}-${date.slice(5, 7)}`;
  }

  if (strategyId === "quarterly") {
    return `${year}-Q${Math.ceil(month / 3)}`;
  }

  return year;
}

function applyPriceMove(input: {
  tickers: string[];
  assetValues: PortfolioWeightMap;
  pricesByTicker: Record<string, number[]>;
  index: number;
}): PortfolioWeightMap {
  return Object.fromEntries(
    input.tickers.map((ticker) => {
      const prices = input.pricesByTicker[ticker] ?? [];
      const previousPrice = prices[input.index - 1];
      const currentPrice = prices[input.index];

      if (
        !Number.isFinite(previousPrice) ||
        !Number.isFinite(currentPrice) ||
        previousPrice <= 0 ||
        currentPrice <= 0
      ) {
        throw new Error(
          `Missing aligned price history for ${ticker}. Try a different ticker or lookback window.`,
        );
      }

      return [
        ticker,
        (input.assetValues[ticker] ?? 0) * (currentPrice / previousPrice),
      ];
    }),
  );
}

function calculateWeights(
  assetValues: PortfolioWeightMap,
  totalValue: number,
): PortfolioWeightMap {
  if (!Number.isFinite(totalValue) || totalValue <= 0) {
    return Object.fromEntries(Object.keys(assetValues).map((ticker) => [ticker, 0]));
  }

  return Object.fromEntries(
    Object.entries(assetValues).map(([ticker, value]) => [
      ticker,
      Number.isFinite(value) ? value / totalValue : 0,
    ]),
  );
}

function buildDriftPoint(input: {
  date: string;
  weights: PortfolioWeightMap;
  targetWeights: PortfolioWeightMap;
}): PortfolioDriftPoint {
  const driftStats = calculateDriftStats(input.weights, input.targetWeights);

  return {
    date: input.date,
    weights: input.weights,
    driftByTicker: driftStats.driftByTicker,
    maxDrift: driftStats.maxDrift,
    averageDrift: driftStats.averageDrift,
  };
}

function calculateDriftStats(
  weights: PortfolioWeightMap,
  targetWeights: PortfolioWeightMap,
): {
  driftByTicker: PortfolioWeightMap;
  maxDrift: number;
  averageDrift: number;
} {
  const tickers = Object.keys(targetWeights);
  const driftByTicker = Object.fromEntries(
    tickers.map((ticker) => [
      ticker,
      Math.abs((weights[ticker] ?? 0) - (targetWeights[ticker] ?? 0)),
    ]),
  );
  const driftValues = Object.values(driftByTicker).filter(Number.isFinite);

  return {
    driftByTicker,
    maxDrift: driftValues.length > 0 ? Math.max(...driftValues) : 0,
    averageDrift:
      driftValues.length > 0
        ? driftValues.reduce((sum, value) => sum + value, 0) / driftValues.length
        : 0,
  };
}

function getRebalanceReason(input: {
  date: string;
  driftPoint: PortfolioDriftPoint;
  periodicRebalanceDates: Set<string>;
  strategy: RebalancingStrategyConfig;
}): RebalanceReason | null {
  if (input.strategy.id === "none") {
    return null;
  }

  if (input.strategy.id === "threshold") {
    const threshold = input.strategy.threshold ?? DEFAULT_REBALANCING_THRESHOLD;

    return input.driftPoint.maxDrift > threshold ? "threshold" : null;
  }

  return input.periodicRebalanceDates.has(input.date)
    ? input.strategy.id
    : null;
}

function calculateTurnover(
  beforeWeights: PortfolioWeightMap,
  targetWeights: PortfolioWeightMap,
): number {
  return (
    0.5 *
    Object.keys(targetWeights).reduce(
      (sum, ticker) =>
        sum + Math.abs((targetWeights[ticker] ?? 0) - (beforeWeights[ticker] ?? 0)),
      0,
    )
  );
}

function rebalanceToTargets(input: {
  balance: number;
  targetWeights: PortfolioWeightMap;
}): PortfolioWeightMap {
  return Object.fromEntries(
    Object.entries(input.targetWeights).map(([ticker, weight]) => [
      ticker,
      input.balance * weight,
    ]),
  );
}

function sumValues(values: PortfolioWeightMap): number {
  return Object.values(values).reduce((sum, value) => sum + value, 0);
}

function calculateAverageDrift(driftPoints: PortfolioDriftPoint[]): number {
  if (driftPoints.length === 0) {
    return 0;
  }

  return (
    driftPoints.reduce((sum, point) => sum + point.averageDrift, 0) /
    driftPoints.length
  );
}

function formatThreshold(value: number | undefined): string {
  const threshold =
    value !== undefined && Number.isFinite(value) && value > 0
      ? value
      : DEFAULT_REBALANCING_THRESHOLD;

  return `${(threshold * 100).toFixed(threshold < 0.1 ? 1 : 0)}%`;
}
