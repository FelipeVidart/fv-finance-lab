import { calculateDrawdownSeries } from "@/lib/finance/drawdown";
import { calculateAnnualizedVolatility } from "@/lib/finance/metrics";
import { calculateDailyReturns } from "@/lib/finance/returns";
import type {
  BenchmarkComparison,
  BenchmarkDefinition,
  BenchmarkSelectionId,
  PortfolioPerformancePoint,
} from "@/lib/finance/portfolio/types";
import type { MarketDataExplorerPayload } from "@/lib/market-data/types";

const TRADING_DAYS_PER_YEAR = 252;
const MIN_COMPARISON_RETURNS = 2;

export const BENCHMARK_DEFINITIONS: BenchmarkDefinition[] = [
  {
    id: "none",
    label: "None",
    type: "none",
    description: "Run portfolio analysis without a benchmark comparison.",
  },
  {
    id: "spy",
    label: "SPY - S&P 500 ETF",
    type: "singleTicker",
    ticker: "SPY",
    description: "US large-cap equity market reference.",
  },
  {
    id: "acwi",
    label: "ACWI - Global Equity ETF",
    type: "singleTicker",
    ticker: "ACWI",
    description: "Global equity market reference.",
  },
  {
    id: "agg",
    label: "AGG - US Aggregate Bond ETF",
    type: "singleTicker",
    ticker: "AGG",
    description: "US investment-grade bond market reference.",
  },
  {
    id: "sixtyForty",
    label: "60/40 Portfolio - 60% IVV + 40% GOVT",
    type: "weightedPortfolio",
    holdings: [
      { ticker: "IVV", weight: 0.6 },
      { ticker: "GOVT", weight: 0.4 },
    ],
    description: "Simple balanced reference portfolio using equity and Treasury ETFs.",
  },
  {
    id: "custom",
    label: "Custom ticker",
    type: "customTicker",
    ticker: "",
    description: "Use a single custom ETF or market ticker as the benchmark.",
  },
];

export function resolveBenchmarkDefinition(input: {
  selectionId: BenchmarkSelectionId;
  customTicker: string;
}): BenchmarkDefinition {
  if (input.selectionId === "custom") {
    return {
      id: "custom",
      label: "Custom ticker",
      type: "customTicker",
      ticker: input.customTicker.trim().toUpperCase(),
      description: "Use a single custom ETF or market ticker as the benchmark.",
    };
  }

  const definition = BENCHMARK_DEFINITIONS.find(
    (entry) => entry.id === input.selectionId,
  );

  if (!definition) {
    return BENCHMARK_DEFINITIONS[0];
  }

  return definition;
}

export function validateBenchmarkDefinition(
  definition: BenchmarkDefinition,
): { isValid: true } | { isValid: false; error: string } {
  if (definition.type !== "customTicker") {
    return { isValid: true };
  }

  if (definition.ticker.trim() === "") {
    return {
      isValid: false,
      error: "Enter a custom benchmark ticker to run benchmark comparison.",
    };
  }

  return { isValid: true };
}

export function getBenchmarkTickers(
  definition: BenchmarkDefinition,
): string[] {
  if (definition.type === "none") {
    return [];
  }

  if (
    definition.type === "singleTicker" ||
    definition.type === "customTicker"
  ) {
    return [definition.ticker];
  }

  if (definition.type === "weightedPortfolio") {
    return definition.holdings.map((holding) => holding.ticker);
  }

  return [];
}

export function buildBenchmarkComparison(input: {
  benchmark: BenchmarkDefinition;
  benchmarkData: MarketDataExplorerPayload;
  portfolioDates: string[];
  portfolioDailyReturns: number[];
  initialCapital: number;
}): BenchmarkComparison {
  const benchmarkDailyReturns = calculateBenchmarkDailyReturns({
    benchmark: input.benchmark,
    data: input.benchmarkData,
  });
  const portfolioReturnByDate = buildReturnMap(
    input.portfolioDates,
    input.portfolioDailyReturns,
  );
  const benchmarkReturnByDate = buildReturnMap(
    input.benchmarkData.points.map((point) => point.date),
    benchmarkDailyReturns,
  );
  const sharedDates = [...portfolioReturnByDate.keys()]
    .filter((date) => benchmarkReturnByDate.has(date))
    .sort((left, right) => left.localeCompare(right));

  if (sharedDates.length < MIN_COMPARISON_RETURNS) {
    throw new Error(
      "Not enough overlapping benchmark data was found for comparison. Portfolio-only results are still available.",
    );
  }

  const portfolioReturns = sharedDates.map(
    (date) => portfolioReturnByDate.get(date) ?? 0,
  );
  const benchmarkReturns = sharedDates.map(
    (date) => benchmarkReturnByDate.get(date) ?? 0,
  );
  const portfolioGrowthPoints = buildGrowthPoints({
    dates: sharedDates,
    dailyReturns: portfolioReturns,
    initialCapital: input.initialCapital,
  });
  const benchmarkGrowthPoints = buildGrowthPoints({
    dates: sharedDates,
    dailyReturns: benchmarkReturns,
    initialCapital: input.initialCapital,
  });
  const portfolioDrawdownPoints = buildDrawdownPoints(portfolioGrowthPoints);
  const benchmarkDrawdownPoints = buildDrawdownPoints(benchmarkGrowthPoints);
  const portfolioCagr = calculateAnnualizedReturnFromReturns(portfolioReturns);
  const benchmarkCagr = calculateAnnualizedReturnFromReturns(benchmarkReturns);
  const activeReturn = portfolioCagr - benchmarkCagr;
  const trackingError = calculateTrackingError(portfolioReturns, benchmarkReturns);
  const correlation = calculateCorrelation(portfolioReturns, benchmarkReturns);
  const beta = calculateBeta(portfolioReturns, benchmarkReturns);

  return {
    benchmark: input.benchmark,
    comparisonStartDate: sharedDates[0],
    comparisonEndDate: sharedDates[sharedDates.length - 1],
    observations: sharedDates.length,
    portfolioGrowthPoints,
    benchmarkGrowthPoints,
    portfolioDrawdownPoints,
    benchmarkDrawdownPoints,
    metrics: {
      portfolioCagr,
      benchmarkCagr,
      activeReturn,
      portfolioAnnualizedVolatility:
        calculateAnnualizedVolatility(portfolioReturns),
      benchmarkAnnualizedVolatility:
        calculateAnnualizedVolatility(benchmarkReturns),
      portfolioMaxDrawdown: Math.min(
        ...portfolioDrawdownPoints.map((point) => point.drawdown),
      ),
      benchmarkMaxDrawdown: Math.min(
        ...benchmarkDrawdownPoints.map((point) => point.drawdown),
      ),
      trackingError,
      informationRatio:
        trackingError !== null && trackingError !== 0
          ? activeReturn / trackingError
          : null,
      correlation,
      beta,
      alpha: beta !== null ? portfolioCagr - beta * benchmarkCagr : null,
    },
  };
}

function calculateBenchmarkDailyReturns(input: {
  benchmark: BenchmarkDefinition;
  data: MarketDataExplorerPayload;
}): number[] {
  const benchmark = input.benchmark;

  if (benchmark.type === "singleTicker" || benchmark.type === "customTicker") {
    const prices = input.data.points.map(
      (point) => point.prices[benchmark.ticker],
    );

    return calculateDailyReturns(prices);
  }

  if (benchmark.type === "weightedPortfolio") {
    const componentReturns = benchmark.holdings.map((holding) => {
      const prices = input.data.points.map((point) => point.prices[holding.ticker]);

      return calculateDailyReturns(prices);
    });

    return componentReturns[0].map((_, dayIndex) =>
      benchmark.holdings.reduce(
        (sum, holding, holdingIndex) =>
          sum + holding.weight * componentReturns[holdingIndex][dayIndex],
        0,
      ),
    );
  }

  return [];
}

function buildReturnMap(dates: string[], dailyReturns: number[]): Map<string, number> {
  return new Map(
    dailyReturns.map((dailyReturn, index) => [dates[index + 1], dailyReturn]),
  );
}

function buildGrowthPoints(input: {
  dates: string[];
  dailyReturns: number[];
  initialCapital: number;
}): PortfolioPerformancePoint[] {
  let balance = input.initialCapital;
  const points: PortfolioPerformancePoint[] = [
    {
      date: input.dates[0],
      balance,
      cumulativeReturn: 0,
    },
  ];

  input.dates.forEach((date, index) => {
    balance *= 1 + input.dailyReturns[index];

    points.push({
      date,
      balance,
      cumulativeReturn: balance / input.initialCapital - 1,
    });
  });

  return points;
}

function buildDrawdownPoints(points: PortfolioPerformancePoint[]) {
  const drawdowns = calculateDrawdownSeries(points.map((point) => point.balance));

  return points.map((point, index) => ({
    date: point.date,
    drawdown: drawdowns[index],
  }));
}

function calculateAnnualizedReturnFromReturns(dailyReturns: number[]): number {
  if (dailyReturns.length === 0) {
    return 0;
  }

  const cumulativeGrowth = dailyReturns.reduce(
    (growth, dailyReturn) => growth * (1 + dailyReturn),
    1,
  );

  if (cumulativeGrowth <= 0) {
    return 0;
  }

  return cumulativeGrowth ** (TRADING_DAYS_PER_YEAR / dailyReturns.length) - 1;
}

function calculateTrackingError(
  portfolioReturns: number[],
  benchmarkReturns: number[],
): number | null {
  const activeReturns = portfolioReturns.map(
    (portfolioReturn, index) => portfolioReturn - benchmarkReturns[index],
  );
  const trackingError = calculateAnnualizedVolatility(activeReturns);

  return Number.isFinite(trackingError) ? trackingError : null;
}

function calculateCorrelation(left: number[], right: number[]): number | null {
  const leftStdDev = calculateDailyStandardDeviation(left);
  const rightStdDev = calculateDailyStandardDeviation(right);
  const covariance = calculateCovariance(left, right);

  if (
    covariance === null ||
    leftStdDev === null ||
    rightStdDev === null ||
    leftStdDev === 0 ||
    rightStdDev === 0
  ) {
    return null;
  }

  return covariance / (leftStdDev * rightStdDev);
}

function calculateBeta(portfolioReturns: number[], benchmarkReturns: number[]) {
  const covariance = calculateCovariance(portfolioReturns, benchmarkReturns);
  const benchmarkVariance = calculateVariance(benchmarkReturns);

  if (
    covariance === null ||
    benchmarkVariance === null ||
    benchmarkVariance === 0
  ) {
    return null;
  }

  return covariance / benchmarkVariance;
}

function calculateCovariance(left: number[], right: number[]): number | null {
  if (left.length !== right.length || left.length < 2) {
    return null;
  }

  const leftMean = calculateMean(left);
  const rightMean = calculateMean(right);

  return (
    left.reduce(
      (sum, value, index) => sum + (value - leftMean) * (right[index] - rightMean),
      0,
    ) /
    (left.length - 1)
  );
}

function calculateVariance(values: number[]): number | null {
  if (values.length < 2) {
    return null;
  }

  const mean = calculateMean(values);

  return (
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (values.length - 1)
  );
}

function calculateDailyStandardDeviation(values: number[]): number | null {
  const variance = calculateVariance(values);

  if (variance === null) {
    return null;
  }

  return Math.sqrt(variance);
}

function calculateMean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
