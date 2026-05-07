import type { RiskContributionRow } from "@/lib/finance/risk/types";
import { TRADING_DAYS_PER_YEAR } from "@/lib/finance/risk/types";

export function calculateCovarianceMatrix(input: {
  tickers: string[];
  returnSeries: Record<string, number[]>;
  annualize?: boolean;
}): number[][] {
  const multiplier = input.annualize === false ? 1 : TRADING_DAYS_PER_YEAR;

  return input.tickers.map((rowTicker) =>
    input.tickers.map(
      (columnTicker) =>
        calculateCovariance(
          input.returnSeries[rowTicker] ?? [],
          input.returnSeries[columnTicker] ?? [],
        ) * multiplier,
    ),
  );
}

export function calculatePortfolioVariance(input: {
  weights: number[];
  covarianceMatrix: number[][];
}): number {
  return input.weights.reduce(
    (outerSum, weight, rowIndex) =>
      outerSum +
      input.weights.reduce(
        (innerSum, otherWeight, columnIndex) =>
          innerSum +
          weight *
            otherWeight *
            (input.covarianceMatrix[rowIndex]?.[columnIndex] ?? 0),
        0,
      ),
    0,
  );
}

export function calculateRiskContribution(input: {
  tickers: string[];
  weights: Record<string, number>;
  returnSeries: Record<string, number[]>;
}): RiskContributionRow[] {
  const weights = input.tickers.map((ticker) => input.weights[ticker] ?? 0);
  const covarianceMatrix = calculateCovarianceMatrix({
    tickers: input.tickers,
    returnSeries: input.returnSeries,
  });
  const portfolioVariance = calculatePortfolioVariance({
    weights,
    covarianceMatrix,
  });
  const portfolioVolatility = Math.sqrt(Math.max(portfolioVariance, 0));
  const covarianceTimesWeights = covarianceMatrix.map((row) =>
    row.reduce((sum, covariance, index) => sum + covariance * weights[index], 0),
  );

  return input.tickers.map((ticker, index) => {
    const marginalContributionToVolatility =
      portfolioVolatility > 0
        ? covarianceTimesWeights[index] / portfolioVolatility
        : 0;
    const contributionToVolatility =
      weights[index] * marginalContributionToVolatility;

    return {
      ticker,
      weight: weights[index],
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

function calculateCovariance(left: number[], right: number[]): number {
  const alignedLength = Math.min(left.length, right.length);

  if (alignedLength < 2) {
    return 0;
  }

  const pairs = Array.from({ length: alignedLength }, (_, index) => ({
    left: left[index],
    right: right[index],
  })).filter(
    (pair) => Number.isFinite(pair.left) && Number.isFinite(pair.right),
  );
  const length = pairs.length;

  if (length < 2) {
    return 0;
  }

  const leftMean =
    pairs.reduce((sum, pair) => sum + pair.left, 0) / length;
  const rightMean =
    pairs.reduce((sum, pair) => sum + pair.right, 0) / length;

  return (
    pairs.reduce(
      (sum, pair) =>
        sum + (pair.left - leftMean) * (pair.right - rightMean),
      0,
    ) /
    (length - 1)
  );
}
