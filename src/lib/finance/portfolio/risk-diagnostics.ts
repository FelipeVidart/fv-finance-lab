import { calculateAnnualizedVolatility } from "@/lib/finance/metrics";
import { calculateDailyReturns } from "@/lib/finance/returns";
import type {
  PortfolioComparisonDefinition,
  PortfolioComparisonPortfolioResult,
} from "@/lib/finance/portfolio/comparison";
import type { PortfolioAssetInput } from "@/lib/finance/portfolio/types";
import type { MarketDataExplorerPayload } from "@/lib/market-data/types";

const TRADING_DAYS_PER_YEAR = 252;

export type AssetVolatilityDiagnostic = {
  ticker: string;
  assetClass: string;
  annualizedVolatility: number;
  bestDailyReturn: number;
  worstDailyReturn: number;
  positiveDayRatio: number;
};

export type CorrelationMatrix = {
  tickers: string[];
  rows: Array<{
    ticker: string;
    correlations: Record<string, number>;
  }>;
};

export type PortfolioRiskContributionRow = {
  ticker: string;
  assetClass: string;
  weight: number;
  annualizedVolatility: number;
  marginalContributionToVolatility: number;
  contributionToVolatility: number;
  percentContributionToVolatility: number;
};

export type PortfolioRiskDiagnostic = {
  portfolioId: string;
  portfolioLabel: string;
  bestDailyReturn: number;
  worstDailyReturn: number;
  positiveDayRatio: number;
  downsideVolatility: number;
  riskContributions: PortfolioRiskContributionRow[];
};

export type PortfolioRiskDiagnostics = {
  assetVolatilities: AssetVolatilityDiagnostic[];
  correlationMatrix: CorrelationMatrix;
  portfolioDiagnostics: PortfolioRiskDiagnostic[];
};

export function buildPortfolioRiskDiagnostics(input: {
  data: MarketDataExplorerPayload;
  portfolios: PortfolioComparisonPortfolioResult[];
}): PortfolioRiskDiagnostics {
  const returnsByTicker = buildReturnsByTicker(input.data);
  const assetClassByTicker = buildAssetClassByTicker(input.portfolios);
  const assetVolatilities = input.data.tickers.map((ticker) => {
    const returns = returnsByTicker[ticker] ?? [];

    return {
      ticker,
      assetClass: assetClassByTicker[ticker] ?? "Other",
      annualizedVolatility: calculateAnnualizedVolatility(returns),
      bestDailyReturn: returns.length > 0 ? Math.max(...returns) : 0,
      worstDailyReturn: returns.length > 0 ? Math.min(...returns) : 0,
      positiveDayRatio: calculatePositiveDayRatio(returns),
    };
  });

  return {
    assetVolatilities,
    correlationMatrix: buildCorrelationMatrix(input.data.tickers, returnsByTicker),
    portfolioDiagnostics: input.portfolios.map((portfolio) => ({
      portfolioId: portfolio.id,
      portfolioLabel: portfolio.label,
      bestDailyReturn:
        portfolio.dailyReturns.length > 0 ? Math.max(...portfolio.dailyReturns) : 0,
      worstDailyReturn:
        portfolio.dailyReturns.length > 0 ? Math.min(...portfolio.dailyReturns) : 0,
      positiveDayRatio: calculatePositiveDayRatio(portfolio.dailyReturns),
      downsideVolatility: calculateDownsideVolatility(portfolio.dailyReturns),
      riskContributions: calculatePortfolioRiskContributions({
        holdings: portfolio.holdings,
        returnsByTicker,
      }),
    })),
  };
}

export function calculateHistoricalTailRisk95(dailyReturns: number[]): {
  var95: number;
  expectedShortfall95: number;
} {
  const sortedReturns = dailyReturns.filter((value) => Number.isFinite(value));

  sortedReturns.sort((a, b) => a - b);

  if (sortedReturns.length === 0) {
    return {
      var95: 0,
      expectedShortfall95: 0,
    };
  }

  const tailCount = Math.max(1, Math.ceil(sortedReturns.length * 0.05));
  const tailReturns = sortedReturns.slice(0, tailCount);
  const varReturn = tailReturns[tailReturns.length - 1] ?? 0;
  const expectedShortfallReturn =
    tailReturns.reduce((sum, value) => sum + value, 0) / tailReturns.length;

  return {
    var95: Math.max(0, -varReturn),
    expectedShortfall95: Math.max(0, -expectedShortfallReturn),
  };
}

function calculatePortfolioRiskContributions(input: {
  holdings: PortfolioAssetInput[];
  returnsByTicker: Record<string, number[]>;
}): PortfolioRiskContributionRow[] {
  const tickers = input.holdings.map((holding) => holding.ticker);
  const weights = input.holdings.map((holding) => holding.weight / 100);
  const covarianceMatrix = buildAnnualizedCovarianceMatrix(
    tickers,
    input.returnsByTicker,
  );
  const portfolioVariance = weights.reduce(
    (outerSum, weight, rowIndex) =>
      outerSum +
      weights.reduce(
        (innerSum, otherWeight, columnIndex) =>
          innerSum +
          weight * otherWeight * (covarianceMatrix[rowIndex]?.[columnIndex] ?? 0),
        0,
      ),
    0,
  );
  const portfolioVolatility = Math.sqrt(Math.max(portfolioVariance, 0));
  const covarianceTimesWeights = covarianceMatrix.map((row) =>
    row.reduce((sum, covariance, index) => sum + covariance * weights[index], 0),
  );

  return input.holdings.map((holding, index) => {
    const marginalContributionToVolatility =
      portfolioVolatility > 0
        ? covarianceTimesWeights[index] / portfolioVolatility
        : 0;
    const contributionToVolatility =
      weights[index] * marginalContributionToVolatility;

    return {
      ticker: holding.ticker,
      assetClass: holding.assetClass,
      weight: holding.weight,
      annualizedVolatility: Math.sqrt(
        Math.max(covarianceMatrix[index]?.[index] ?? 0, 0),
      ),
      marginalContributionToVolatility,
      contributionToVolatility,
      percentContributionToVolatility:
        portfolioVolatility > 0 ? contributionToVolatility / portfolioVolatility : 0,
    };
  });
}

function buildReturnsByTicker(
  data: MarketDataExplorerPayload,
): Record<string, number[]> {
  return Object.fromEntries(
    data.tickers.map((ticker) => [
      ticker,
      calculateDailyReturns(data.points.map((point) => point.prices[ticker])),
    ]),
  );
}

function buildAssetClassByTicker(
  portfolios: PortfolioComparisonDefinition[],
): Record<string, string> {
  const entries = portfolios.flatMap((portfolio) =>
    portfolio.holdings.map((holding) => [
      holding.ticker.trim().toUpperCase(),
      holding.assetClass,
    ]),
  );

  return Object.fromEntries(entries);
}

function buildCorrelationMatrix(
  tickers: string[],
  returnsByTicker: Record<string, number[]>,
): CorrelationMatrix {
  return {
    tickers,
    rows: tickers.map((rowTicker) => ({
      ticker: rowTicker,
      correlations: Object.fromEntries(
        tickers.map((columnTicker) => [
          columnTicker,
          calculateCorrelation(
            returnsByTicker[rowTicker] ?? [],
            returnsByTicker[columnTicker] ?? [],
          ),
        ]),
      ),
    })),
  };
}

function buildAnnualizedCovarianceMatrix(
  tickers: string[],
  returnsByTicker: Record<string, number[]>,
): number[][] {
  return tickers.map((rowTicker) =>
    tickers.map(
      (columnTicker) =>
        calculateCovariance(
          returnsByTicker[rowTicker] ?? [],
          returnsByTicker[columnTicker] ?? [],
        ) * TRADING_DAYS_PER_YEAR,
    ),
  );
}

function calculateCorrelation(left: number[], right: number[]): number {
  const covariance = calculateCovariance(left, right);
  const leftVolatility = calculateSampleVolatility(left);
  const rightVolatility = calculateSampleVolatility(right);

  if (leftVolatility === 0 || rightVolatility === 0) {
    return left === right ? 1 : 0;
  }

  return covariance / (leftVolatility * rightVolatility);
}

function calculateCovariance(left: number[], right: number[]): number {
  const length = Math.min(left.length, right.length);

  if (length < 2) {
    return 0;
  }

  const leftSlice = left.slice(0, length);
  const rightSlice = right.slice(0, length);
  const leftMean = leftSlice.reduce((sum, value) => sum + value, 0) / length;
  const rightMean = rightSlice.reduce((sum, value) => sum + value, 0) / length;

  return (
    leftSlice.reduce(
      (sum, value, index) =>
        sum + (value - leftMean) * (rightSlice[index] - rightMean),
      0,
    ) /
    (length - 1)
  );
}

function calculateDownsideVolatility(dailyReturns: number[]): number {
  const downsideReturns = dailyReturns.filter((value) => value < 0);

  if (downsideReturns.length < 2) {
    return 0;
  }

  const downsideDeviation = Math.sqrt(
    downsideReturns.reduce((sum, value) => sum + value ** 2, 0) /
      (downsideReturns.length - 1),
  );

  return downsideDeviation * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

function calculatePositiveDayRatio(dailyReturns: number[]): number {
  if (dailyReturns.length === 0) {
    return 0;
  }

  return (
    dailyReturns.filter((dailyReturn) => dailyReturn > 0).length /
    dailyReturns.length
  );
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
