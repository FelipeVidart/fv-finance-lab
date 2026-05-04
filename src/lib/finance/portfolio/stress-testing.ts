import { calculateDrawdownSeries } from "@/lib/finance/drawdown";
import { calculateDailyReturns } from "@/lib/finance/returns";
import type {
  BenchmarkDefinition,
  PortfolioAssetInput,
  StressCoverageStatus,
  StressMarketDataPayload,
  StressPeriodDefinition,
  StressTestAnalysis,
  StressTestResult,
} from "@/lib/finance/portfolio/types";
import type { HistoricalPriceSeries } from "@/lib/market-data/types";

type StressDataBundle = {
  stressPeriod: StressPeriodDefinition;
  portfolioData: StressMarketDataPayload | null;
  portfolioError?: string;
  benchmarkData?: StressMarketDataPayload | null;
  benchmarkError?: string;
};

export function buildStressTestAnalysis(input: {
  holdings: PortfolioAssetInput[];
  benchmarkDefinition?: BenchmarkDefinition;
  stressData: StressDataBundle[];
}): StressTestAnalysis {
  return {
    results: input.stressData.map((bundle) =>
      evaluateStressPeriod({
        holdings: input.holdings,
        benchmarkDefinition: input.benchmarkDefinition,
        ...bundle,
      }),
    ),
  };
}

function evaluateStressPeriod(input: {
  holdings: PortfolioAssetInput[];
  benchmarkDefinition?: BenchmarkDefinition;
  stressPeriod: StressPeriodDefinition;
  portfolioData: StressMarketDataPayload | null;
  portfolioError?: string;
  benchmarkData?: StressMarketDataPayload | null;
  benchmarkError?: string;
}): StressTestResult {
  const holdingTickers = input.holdings.map((holding) => holding.ticker);
  const portfolioSeriesByTicker = buildSeriesMap(input.portfolioData?.series ?? []);
  const routeMissingTickers = input.portfolioData?.missing.map((entry) => entry.ticker) ?? [];
  const availableAssets = holdingTickers.filter((ticker) =>
    portfolioSeriesByTicker.has(ticker),
  );
  const missingAssets = [
    ...new Set([
      ...routeMissingTickers,
      ...holdingTickers.filter((ticker) => !portfolioSeriesByTicker.has(ticker)),
    ]),
  ];
  const sharedDates = findSharedDates(
    input.holdings
      .map((holding) => portfolioSeriesByTicker.get(holding.ticker))
      .filter((series): series is HistoricalPriceSeries => series !== undefined),
  );
  const coverageStatus = resolveCoverageStatus({
    stressPeriod: input.stressPeriod,
    sharedDates,
    availableAssets,
    missingAssets,
    portfolioError: input.portfolioError,
  });
  const periodStartUsed = sharedDates[0] ?? null;
  const periodEndUsed = sharedDates[sharedDates.length - 1] ?? null;
  const benchmarkMetrics = calculateBenchmarkStressMetrics({
    benchmarkDefinition: input.benchmarkDefinition,
    benchmarkData: input.benchmarkData ?? null,
    benchmarkError: input.benchmarkError,
  });

  if (
    coverageStatus === "Outside available history" ||
    coverageStatus === "Insufficient observations" ||
    coverageStatus === "Missing required assets"
  ) {
    return {
      stressPeriod: input.stressPeriod,
      coverageStatus,
      coverageNote: buildCoverageNote({
        coverageStatus,
        stressPeriod: input.stressPeriod,
        periodStartUsed,
        periodEndUsed,
        observations: sharedDates.length,
        missingAssets,
        portfolioError: input.portfolioError,
      }),
      periodStartUsed,
      periodEndUsed,
      observations: sharedDates.length,
      portfolioReturn: null,
      portfolioMaxDrawdown: null,
      benchmarkReturn: benchmarkMetrics.benchmarkReturn,
      benchmarkMaxDrawdown: benchmarkMetrics.benchmarkMaxDrawdown,
      activeReturn: null,
      bestAssetTicker: null,
      bestAssetReturn: null,
      worstAssetTicker: null,
      worstAssetReturn: null,
      availableAssets,
      missingAssets,
    };
  }

  const assetReturns = calculateAssetReturns({
    sharedDates,
    holdings: input.holdings,
    seriesByTicker: portfolioSeriesByTicker,
  });
  const portfolioDailyReturns = calculateStressPortfolioReturns({
    sharedDates,
    holdings: input.holdings,
    seriesByTicker: portfolioSeriesByTicker,
  });
  const portfolioReturn = calculateCumulativeReturn(portfolioDailyReturns);
  const portfolioMaxDrawdown = calculateMaxDrawdownFromReturns(portfolioDailyReturns);
  const bestAsset = findExtremeAsset(assetReturns, "best");
  const worstAsset = findExtremeAsset(assetReturns, "worst");
  const activeReturn =
    benchmarkMetrics.benchmarkReturn === null
      ? null
      : portfolioReturn - benchmarkMetrics.benchmarkReturn;

  return {
    stressPeriod: input.stressPeriod,
    coverageStatus,
    coverageNote: buildCoverageNote({
      coverageStatus,
      stressPeriod: input.stressPeriod,
      periodStartUsed,
      periodEndUsed,
      observations: sharedDates.length,
      missingAssets,
      portfolioError: input.portfolioError,
    }),
    periodStartUsed,
    periodEndUsed,
    observations: sharedDates.length,
    portfolioReturn,
    portfolioMaxDrawdown,
    benchmarkReturn: benchmarkMetrics.benchmarkReturn,
    benchmarkMaxDrawdown: benchmarkMetrics.benchmarkMaxDrawdown,
    activeReturn,
    bestAssetTicker: bestAsset?.ticker ?? null,
    bestAssetReturn: bestAsset?.return ?? null,
    worstAssetTicker: worstAsset?.ticker ?? null,
    worstAssetReturn: worstAsset?.return ?? null,
    availableAssets,
    missingAssets,
  };
}

function resolveCoverageStatus(input: {
  stressPeriod: StressPeriodDefinition;
  sharedDates: string[];
  availableAssets: string[];
  missingAssets: string[];
  portfolioError?: string;
}): StressCoverageStatus {
  if (input.availableAssets.length === 0 || input.portfolioError) {
    return "Outside available history";
  }

  if (input.missingAssets.length > 0) {
    return "Missing required assets";
  }

  if (input.sharedDates.length < 2) {
    return "Insufficient observations";
  }

  if (
    input.sharedDates[0] <= input.stressPeriod.startDate &&
    input.sharedDates[input.sharedDates.length - 1] >= input.stressPeriod.endDate
  ) {
    return "Full coverage";
  }

  return "Partial coverage";
}

function calculateAssetReturns(input: {
  sharedDates: string[];
  holdings: PortfolioAssetInput[];
  seriesByTicker: Map<string, HistoricalPriceSeries>;
}): Array<{ ticker: string; return: number }> {
  return input.holdings
    .map((holding) => {
      const prices = getPricesForDates({
        series: input.seriesByTicker.get(holding.ticker),
        dates: input.sharedDates,
      });
      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];

      if (
        !Number.isFinite(firstPrice) ||
        !Number.isFinite(lastPrice) ||
        firstPrice <= 0
      ) {
        return null;
      }

      return {
        ticker: holding.ticker,
        return: lastPrice / firstPrice - 1,
      };
    })
    .filter(
      (value): value is { ticker: string; return: number } =>
        value !== null && Number.isFinite(value.return),
    );
}

function calculateStressPortfolioReturns(input: {
  sharedDates: string[];
  holdings: PortfolioAssetInput[];
  seriesByTicker: Map<string, HistoricalPriceSeries>;
}): number[] {
  const componentReturns = input.holdings.map((holding) => {
    const prices = getPricesForDates({
      series: input.seriesByTicker.get(holding.ticker),
      dates: input.sharedDates,
    });

    return calculateDailyReturns(prices);
  });

  return componentReturns[0].map((_, dayIndex) =>
    input.holdings.reduce(
      (sum, holding, holdingIndex) =>
        sum + (holding.weight / 100) * componentReturns[holdingIndex][dayIndex],
      0,
    ),
  );
}

function calculateBenchmarkStressMetrics(input: {
  benchmarkDefinition?: BenchmarkDefinition;
  benchmarkData: StressMarketDataPayload | null;
  benchmarkError?: string;
}): {
  benchmarkReturn: number | null;
  benchmarkMaxDrawdown: number | null;
} {
  if (
    !input.benchmarkDefinition ||
    input.benchmarkDefinition.type === "none" ||
    input.benchmarkError ||
    !input.benchmarkData
  ) {
    return {
      benchmarkReturn: null,
      benchmarkMaxDrawdown: null,
    };
  }

  const seriesByTicker = buildSeriesMap(input.benchmarkData.series);
  const benchmarkTickers =
    input.benchmarkDefinition.type === "weightedPortfolio"
      ? input.benchmarkDefinition.holdings.map((holding) => holding.ticker)
      : [input.benchmarkDefinition.ticker];
  const sharedDates = findSharedDates(
    benchmarkTickers
      .map((ticker) => seriesByTicker.get(ticker))
      .filter((series): series is HistoricalPriceSeries => series !== undefined),
  );

  if (
    benchmarkTickers.some((ticker) => !seriesByTicker.has(ticker)) ||
    sharedDates.length < 2
  ) {
    return {
      benchmarkReturn: null,
      benchmarkMaxDrawdown: null,
    };
  }

  const benchmarkDailyReturns =
    input.benchmarkDefinition.type === "weightedPortfolio"
      ? input.benchmarkDefinition.holdings[0]
        ? calculateWeightedBenchmarkReturns({
            holdings: input.benchmarkDefinition.holdings,
            sharedDates,
            seriesByTicker,
          })
        : []
      : calculateDailyReturns(
          getPricesForDates({
            series: seriesByTicker.get(input.benchmarkDefinition.ticker),
            dates: sharedDates,
          }),
        );

  if (benchmarkDailyReturns.length === 0) {
    return {
      benchmarkReturn: null,
      benchmarkMaxDrawdown: null,
    };
  }

  return {
    benchmarkReturn: calculateCumulativeReturn(benchmarkDailyReturns),
    benchmarkMaxDrawdown: calculateMaxDrawdownFromReturns(benchmarkDailyReturns),
  };
}

function calculateWeightedBenchmarkReturns(input: {
  holdings: Array<{ ticker: string; weight: number }>;
  sharedDates: string[];
  seriesByTicker: Map<string, HistoricalPriceSeries>;
}): number[] {
  const componentReturns = input.holdings.map((holding) =>
    calculateDailyReturns(
      getPricesForDates({
        series: input.seriesByTicker.get(holding.ticker),
        dates: input.sharedDates,
      }),
    ),
  );

  return componentReturns[0].map((_, dayIndex) =>
    input.holdings.reduce(
      (sum, holding, holdingIndex) =>
        sum + holding.weight * componentReturns[holdingIndex][dayIndex],
      0,
    ),
  );
}

function buildSeriesMap(
  series: HistoricalPriceSeries[],
): Map<string, HistoricalPriceSeries> {
  return new Map(series.map((entry) => [entry.ticker, entry]));
}

function findSharedDates(series: HistoricalPriceSeries[]): string[] {
  if (series.length === 0) {
    return [];
  }

  const sharedDates = series.reduce<Set<string> | null>((current, entry) => {
    const nextDates = new Set(entry.points.map((point) => point.date));

    if (current === null) {
      return nextDates;
    }

    return new Set([...current].filter((date) => nextDates.has(date)));
  }, null);

  return [...(sharedDates ?? new Set<string>())].sort((left, right) =>
    left.localeCompare(right),
  );
}

function getPricesForDates(input: {
  series: HistoricalPriceSeries | undefined;
  dates: string[];
}): number[] {
  if (!input.series) {
    return [];
  }

  const priceByDate = new Map(
    input.series.points.map((point) => [point.date, point.close] as const),
  );

  return input.dates.map((date) => priceByDate.get(date) ?? 0);
}

function calculateCumulativeReturn(dailyReturns: number[]): number {
  const growth = dailyReturns.reduce(
    (currentGrowth, dailyReturn) => currentGrowth * (1 + dailyReturn),
    1,
  );

  return Number.isFinite(growth) ? growth - 1 : 0;
}

function calculateMaxDrawdownFromReturns(dailyReturns: number[]): number {
  const balances = [100];

  for (const dailyReturn of dailyReturns) {
    balances.push(balances[balances.length - 1] * (1 + dailyReturn));
  }

  return Math.min(...calculateDrawdownSeries(balances));
}

function findExtremeAsset(
  assetReturns: Array<{ ticker: string; return: number }>,
  mode: "best" | "worst",
): { ticker: string; return: number } | null {
  if (assetReturns.length === 0) {
    return null;
  }

  return assetReturns.reduce((selected, asset) => {
    if (mode === "best") {
      return asset.return > selected.return ? asset : selected;
    }

    return asset.return < selected.return ? asset : selected;
  }, assetReturns[0]);
}

function buildCoverageNote(input: {
  coverageStatus: StressCoverageStatus;
  stressPeriod: StressPeriodDefinition;
  periodStartUsed: string | null;
  periodEndUsed: string | null;
  observations: number;
  missingAssets: string[];
  portfolioError?: string;
}): string {
  if (input.portfolioError) {
    return input.portfolioError;
  }

  if (input.coverageStatus === "Missing required assets") {
    return `Missing required assets for this historical period: ${input.missingAssets.join(
      ", ",
    )}. Portfolio-level stress results are not computed because the full allocation cannot be represented.`;
  }

  if (input.coverageStatus === "Full coverage") {
    return "Available provider data spans the full historical stress period for all current holdings.";
  }

  if (input.coverageStatus === "Partial coverage") {
    return `Available data covers ${input.periodStartUsed ?? "N/A"} through ${
      input.periodEndUsed ?? "N/A"
    }, which does not span the full ${input.stressPeriod.label} window.`;
  }

  if (input.coverageStatus === "Insufficient observations") {
    return `Only ${input.observations} observation${
      input.observations === 1 ? "" : "s"
    } available; at least two are required.`;
  }

  return "This period is outside available provider history for the selected holdings.";
}
