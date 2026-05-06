import { buildPortfolioDrawdownPoints } from "@/lib/finance/portfolio/drawdowns";
import { calculatePortfolioMetrics } from "@/lib/finance/portfolio/metrics";
import { PORTFOLIO_PRESETS } from "@/lib/finance/portfolio/presets";
import {
  DEFAULT_REBALANCING_STRATEGY,
  simulatePortfolioRebalancing,
} from "@/lib/finance/portfolio/rebalancing";
import { validatePortfolioInputs } from "@/lib/finance/portfolio/returns";
import { calculateHistoricalTailRisk95 } from "@/lib/finance/portfolio/risk-diagnostics";
import type {
  PortfolioAssetInput,
  PortfolioDrawdownPoint,
  PortfolioPerformancePoint,
  RebalancingStrategyConfig,
} from "@/lib/finance/portfolio/types";
import type { MarketDataExplorerPayload, MarketDataPeriod } from "@/lib/market-data/types";

export type PortfolioComparisonPresetId =
  | "conservative"
  | "balanced"
  | "growth"
  | "aggressive";

export type PortfolioComparisonDefinition = {
  id: string;
  kind: "predefined" | "custom";
  name: string;
  label: string;
  description: string;
  sourcePresetId?: string;
  sourcePresetName?: string;
  holdings: PortfolioAssetInput[];
};

export type PredefinedPortfolioComparisonPreset = {
  id: PortfolioComparisonPresetId;
  label: string;
  sourcePresetId: string;
  sourcePresetName: string;
  name: string;
  description: string;
  holdings: PortfolioAssetInput[];
  validation: {
    isValid: boolean;
    totalWeight: number;
    error?: string;
  };
};

export type PortfolioComparisonMetrics = {
  cumulativeReturn: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  historicalVar95: number;
  historicalExpectedShortfall95: number;
};

export type PortfolioComparisonPortfolioResult = PortfolioComparisonDefinition & {
  metrics: PortfolioComparisonMetrics;
  performancePoints: PortfolioPerformancePoint[];
  drawdownPoints: PortfolioDrawdownPoint[];
  dailyReturns: number[];
};

export type PortfolioComparisonSeries = {
  dates: string[];
  series: Array<{
    portfolioId: string;
    label: string;
    values: number[];
  }>;
};

export type PortfolioComparisonResult = {
  period: MarketDataPeriod;
  provider: string;
  commonStartDate: string;
  commonEndDate: string;
  observations: number;
  tickers: string[];
  strategy: RebalancingStrategyConfig;
  portfolios: PortfolioComparisonPortfolioResult[];
  cumulativePerformance: PortfolioComparisonSeries;
  drawdowns: PortfolioComparisonSeries;
  rollingVolatility: PortfolioComparisonSeries;
  providerWarnings: MarketDataExplorerPayload["meta"]["warnings"];
  providerCache: MarketDataExplorerPayload["meta"]["cache"];
};

export const DEFAULT_PORTFOLIO_COMPARISON_PERIOD: MarketDataPeriod = "1Y";
export const DEFAULT_PORTFOLIO_COMPARISON_INITIAL_CAPITAL = 100000;
export const DEFAULT_PORTFOLIO_COMPARISON_STRATEGY: RebalancingStrategyConfig = {
  id: DEFAULT_REBALANCING_STRATEGY,
};
export const MIN_PORTFOLIO_COMPARISON_COUNT = 2;
export const MAX_PORTFOLIO_COMPARISON_COUNT = 5;
export const MAX_PORTFOLIO_COMPARISON_TICKERS = 10;
export const ROLLING_VOLATILITY_WINDOW_DAYS = 21;

export const DEFAULT_PORTFOLIO_COMPARISON_PRESET_IDS = [
  "conservative",
  "balanced",
  "aggressive",
] satisfies PortfolioComparisonPresetId[];

const COMPARISON_PRESET_MAPPINGS: Array<{
  id: PortfolioComparisonPresetId;
  label: string;
  sourcePresetId: string;
}> = [
  {
    id: "conservative",
    label: "Conservative",
    sourcePresetId: "conservative-income",
  },
  {
    id: "balanced",
    label: "Balanced",
    sourcePresetId: "balanced-60-40",
  },
  {
    id: "growth",
    label: "Growth",
    sourcePresetId: "growth",
  },
  {
    id: "aggressive",
    label: "Aggressive",
    sourcePresetId: "aggressive-growth",
  },
];

export function getPredefinedPortfolioComparisonPresets(): PredefinedPortfolioComparisonPreset[] {
  return COMPARISON_PRESET_MAPPINGS.map((mapping) => {
    const sourcePreset = resolveSourcePreset(mapping.sourcePresetId);
    const validation = validatePortfolioInputs({
      initialCapital: sourcePreset.initialCapital,
      assets: sourcePreset.holdings,
    });

    return {
      id: mapping.id,
      label: mapping.label,
      sourcePresetId: sourcePreset.id,
      sourcePresetName: sourcePreset.name,
      name: sourcePreset.name,
      description: sourcePreset.description,
      holdings: sourcePreset.holdings,
      validation: validation.isValid
        ? {
            isValid: true,
            totalWeight: validation.totalWeight,
          }
        : {
            isValid: false,
            totalWeight: validation.totalWeight,
            error: validation.error,
          },
    };
  });
}

export function getDefaultPortfolioComparisonDefinitions(): PortfolioComparisonDefinition[] {
  return DEFAULT_PORTFOLIO_COMPARISON_PRESET_IDS.map((presetId) =>
    createPortfolioComparisonDefinitionFromPreset(presetId),
  );
}

export function createPortfolioComparisonDefinitionFromPreset(
  presetId: PortfolioComparisonPresetId,
  instanceId = `preset-${presetId}`,
): PortfolioComparisonDefinition {
  const preset = getPredefinedPortfolioComparisonPresets().find(
    (entry) => entry.id === presetId,
  );

  if (!preset) {
    throw new Error(`Unknown comparison preset: ${presetId}.`);
  }

  return {
    id: instanceId,
    kind: "predefined",
    name: preset.name,
    label: preset.label,
    description: preset.description,
    sourcePresetId: preset.sourcePresetId,
    sourcePresetName: preset.sourcePresetName,
    holdings: cloneHoldings(preset.holdings),
  };
}

export function createCustomPortfolioComparisonDefinition(
  instanceId: string,
  index: number,
): PortfolioComparisonDefinition {
  return {
    id: instanceId,
    kind: "custom",
    name: `Custom Portfolio ${index}`,
    label: `Custom ${index}`,
    description: "User-defined allocation for side-by-side comparison.",
    holdings: [
      { ticker: "IVV", assetClass: "US Large Cap Equity", weight: 60 },
      { ticker: "AGG", assetClass: "US Aggregate Bonds", weight: 40 },
    ],
  };
}

export function getPortfolioComparisonTickers(
  portfolios: PortfolioComparisonDefinition[],
): string[] {
  return [
    ...new Set(
      portfolios.flatMap((portfolio) =>
        portfolio.holdings
          .map((holding) => holding.ticker.trim().toUpperCase())
          .filter(Boolean),
      ),
    ),
  ];
}

export function buildPortfolioComparison(input: {
  data: MarketDataExplorerPayload;
  portfolios: PortfolioComparisonDefinition[];
  initialCapital?: number;
  strategy?: RebalancingStrategyConfig;
  riskFreeRate?: number;
}): PortfolioComparisonResult {
  validateComparisonPortfolioCount(input.portfolios);

  const initialCapital =
    input.initialCapital ?? DEFAULT_PORTFOLIO_COMPARISON_INITIAL_CAPITAL;
  const strategy = input.strategy ?? DEFAULT_PORTFOLIO_COMPARISON_STRATEGY;
  const riskFreeRate = input.riskFreeRate ?? 0;
  const dates = input.data.points.map((point) => point.date);

  if (input.data.points.length < 3) {
    throw new Error(
      "Not enough overlapping market data was found for portfolio comparison.",
    );
  }

  const portfolios = input.portfolios.map((portfolio) => {
    const validation = validatePortfolioInputs({
      initialCapital,
      assets: portfolio.holdings,
    });

    if (!validation.isValid) {
      throw new Error(`${portfolio.name} is invalid: ${validation.error}`);
    }

    const simulation = simulatePortfolioRebalancing({
      data: input.data,
      assets: validation.assets,
      initialCapital,
      strategy,
    });
    const drawdownPoints = buildPortfolioDrawdownPoints(
      simulation.performancePoints,
    );
    const maxDrawdown = drawdownPoints.reduce(
      (minimum, point) => Math.min(minimum, point.drawdown),
      0,
    );
    const metrics = calculatePortfolioMetrics({
      performancePoints: simulation.performancePoints,
      dailyReturns: simulation.dailyReturns,
      maxDrawdown,
      riskFreeRate,
    });
    const tailRisk = calculateHistoricalTailRisk95(simulation.dailyReturns);

    return {
      ...portfolio,
      label: portfolio.label.trim() || portfolio.name.trim() || "Portfolio",
      name: portfolio.name.trim() || "Portfolio",
      holdings: validation.assets,
      metrics: {
        cumulativeReturn: metrics.cumulativeReturn,
        annualizedReturn: metrics.cagr,
        annualizedVolatility: metrics.annualizedVolatility,
        sharpeRatio: metrics.sharpeRatio,
        maxDrawdown: metrics.maxDrawdown,
        historicalVar95: tailRisk.var95,
        historicalExpectedShortfall95: tailRisk.expectedShortfall95,
      },
      performancePoints: simulation.performancePoints,
      drawdownPoints,
      dailyReturns: simulation.dailyReturns,
    };
  });
  const rollingVolatility = buildRollingVolatilityComparisonSeries(portfolios);

  return {
    period: input.data.period,
    provider: input.data.meta.provider,
    commonStartDate: input.data.meta.commonStartDate,
    commonEndDate: input.data.meta.commonEndDate,
    observations: input.data.meta.observations,
    tickers: getPortfolioComparisonTickers(input.portfolios),
    strategy,
    portfolios,
    cumulativePerformance: {
      dates,
      series: portfolios.map((portfolio) => ({
        portfolioId: portfolio.id,
        label: portfolio.label,
        values: portfolio.performancePoints.map((point) => point.cumulativeReturn),
      })),
    },
    drawdowns: {
      dates,
      series: portfolios.map((portfolio) => ({
        portfolioId: portfolio.id,
        label: portfolio.label,
        values: portfolio.drawdownPoints.map((point) => point.drawdown),
      })),
    },
    rollingVolatility,
    providerWarnings: input.data.meta.warnings,
    providerCache: input.data.meta.cache,
  };
}

function validateComparisonPortfolioCount(
  portfolios: PortfolioComparisonDefinition[],
) {
  if (portfolios.length < MIN_PORTFOLIO_COMPARISON_COUNT) {
    throw new Error(
      `Select at least ${MIN_PORTFOLIO_COMPARISON_COUNT} portfolios for comparison.`,
    );
  }

  if (portfolios.length > MAX_PORTFOLIO_COMPARISON_COUNT) {
    throw new Error(
      `This lab supports up to ${MAX_PORTFOLIO_COMPARISON_COUNT} portfolios at once.`,
    );
  }
}

function buildRollingVolatilityComparisonSeries(
  portfolios: PortfolioComparisonPortfolioResult[],
): PortfolioComparisonSeries {
  const firstPortfolio = portfolios[0];
  const dates =
    firstPortfolio?.performancePoints
      .slice(ROLLING_VOLATILITY_WINDOW_DAYS)
      .map((point) => point.date) ?? [];

  return {
    dates,
    series: portfolios.map((portfolio) => ({
      portfolioId: portfolio.id,
      label: portfolio.label,
      values: calculateRollingAnnualizedVolatility(
        portfolio.dailyReturns,
        ROLLING_VOLATILITY_WINDOW_DAYS,
      ),
    })),
  };
}

function calculateRollingAnnualizedVolatility(
  dailyReturns: number[],
  windowDays: number,
): number[] {
  if (dailyReturns.length < windowDays) {
    return [];
  }

  const values: number[] = [];

  for (let endIndex = windowDays; endIndex <= dailyReturns.length; endIndex += 1) {
    const windowReturns = dailyReturns.slice(endIndex - windowDays, endIndex);
    values.push(calculateSampleVolatility(windowReturns) * Math.sqrt(252));
  }

  return values;
}

function calculateSampleVolatility(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (values.length - 1);

  return Math.sqrt(Math.max(variance, 0));
}

function resolveSourcePreset(sourcePresetId: string) {
  const preset = PORTFOLIO_PRESETS.find((entry) => entry.id === sourcePresetId);

  if (!preset) {
    throw new Error(`Missing source portfolio preset: ${sourcePresetId}.`);
  }

  return preset;
}

function cloneHoldings(holdings: PortfolioAssetInput[]): PortfolioAssetInput[] {
  return holdings.map((holding) => ({ ...holding }));
}
