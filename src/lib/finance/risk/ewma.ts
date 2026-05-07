import type { DatedRiskPoint, EwmaVolatilityResult } from "@/lib/finance/risk/types";

const DEFAULT_EWMA_LAMBDA = 0.94;

export function calculateEwmaVolatilitySeries(input: {
  returns: number[];
  dates: string[];
  lambda?: number;
}): EwmaVolatilityResult {
  const lambda = input.lambda ?? DEFAULT_EWMA_LAMBDA;

  validateEwmaLambda(lambda);

  const cleanRows = input.returns
    .map((dailyReturn, index) => ({
      date: input.dates[index],
      dailyReturn,
    }))
    .filter((row) => row.date && Number.isFinite(row.dailyReturn));

  if (cleanRows.length === 0) {
    return {
      lambda,
      variance: [],
      volatility: [],
    };
  }

  const variances: DatedRiskPoint[] = [];

  cleanRows.forEach((row, index) => {
    const previousVariance = variances[index - 1]?.value;
    const previousReturn = cleanRows[index - 1]?.dailyReturn;
    const variance =
      index === 0 || previousVariance === undefined || previousReturn === undefined
        ? row.dailyReturn ** 2
        : lambda * previousVariance + (1 - lambda) * previousReturn ** 2;

    variances.push({
      date: row.date,
      value: Math.max(variance, 0),
    });
  });

  return {
    lambda,
    variance: variances,
    volatility: variances.map((point) => ({
      date: point.date,
      value: Math.sqrt(point.value),
    })),
  };
}

export function validateEwmaLambda(lambda: number): void {
  if (!Number.isFinite(lambda) || lambda <= 0 || lambda >= 1) {
    throw new Error("EWMA lambda must be between 0 and 1.");
  }
}
