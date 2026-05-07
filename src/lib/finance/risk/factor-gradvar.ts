import { calculateDailyReturns } from "@/lib/finance/returns";
import {
  TRADING_DAYS_PER_YEAR,
  type FactorDefinition,
  type FactorGradVarAnalysis,
  type FactorGradVarAnalysisInput,
  type FactorGradVarAttributionRow,
  type FactorRegressionRow,
  type InstrumentGradVarAttributionRow,
} from "@/lib/finance/risk/types";
import type { MarketDataExplorerPayload } from "@/lib/market-data/types";

const DEFAULT_CONFIDENCE_LEVEL = 0.95;
const MINIMUM_FACTOR_OBSERVATIONS = 20;
const SINGULAR_TOLERANCE = 1e-12;
const RIDGE_PENALTIES = [0, 1e-10, 1e-8, 1e-6, 1e-4];

export const DEFAULT_FACTOR_DEFINITIONS: FactorDefinition[] = [
  {
    id: "us-equity-market",
    name: "US Equity Market",
    proxyTicker: "SPY",
    description: "Broad US equity beta proxy.",
  },
  {
    id: "growth-technology",
    name: "Growth / Technology",
    proxyTicker: "QQQ",
    description: "Large-cap growth and technology proxy.",
  },
  {
    id: "long-duration-rates",
    name: "Long Duration / Rates",
    proxyTicker: "TLT",
    description: "Long-duration Treasury rate sensitivity proxy.",
  },
  {
    id: "credit-risk-appetite",
    name: "Credit / Risk Appetite",
    proxyTicker: "HYG",
    description: "High-yield credit and risk appetite proxy.",
  },
  {
    id: "gold-real-asset",
    name: "Gold / Real Asset",
    proxyTicker: "GLD",
    description: "Gold and real-asset proxy.",
  },
];

type DatedReturnRow = {
  date: string;
  values: Record<string, number>;
};

type AlignedFactorRows = {
  dates: string[];
  assetReturns: Record<string, number[]>;
  factorReturns: Record<string, number[]>;
  portfolioReturns: number[];
  droppedObservations: number;
  assetReturnObservationCount: number;
  factorReturnObservationCount: number;
};

export function buildFactorGradVarAnalysis(
  input: FactorGradVarAnalysisInput,
): FactorGradVarAnalysis {
  const confidenceLevel = input.confidenceLevel ?? DEFAULT_CONFIDENCE_LEVEL;
  const factorDefinitions =
    input.factorDefinitions ?? DEFAULT_FACTOR_DEFINITIONS;

  validateFactorDefinitions(factorDefinitions);
  validateConfidenceLevel(confidenceLevel);

  const aligned = buildAlignedReturnSeries({
    assetData: input.assetData,
    factorData: input.factorData,
    tickers: input.tickers,
    portfolioDailyReturns: input.portfolioDailyReturns,
    factorDefinitions,
  });
  const minimumObservations = Math.max(
    MINIMUM_FACTOR_OBSERVATIONS,
    factorDefinitions.length + 2,
  );

  if (aligned.dates.length < minimumObservations) {
    throw new Error("Not enough aligned observations for factor regression.");
  }

  const factorMatrix = aligned.dates.map((_, rowIndex) =>
    factorDefinitions.map(
      (factor) => aligned.factorReturns[factor.id][rowIndex],
    ),
  );
  const assetRegressions = input.tickers.map((ticker) =>
    estimateRegression({
      ticker,
      yValues: aligned.assetReturns[ticker],
      xRows: factorMatrix,
      factorDefinitions,
    }),
  );
  const portfolioRegression = estimateRegression({
    ticker: "Portfolio",
    yValues: aligned.portfolioReturns,
    xRows: factorMatrix,
    factorDefinitions,
  });
  const portfolioFactorExposure = calculatePortfolioFactorExposure({
    tickers: input.tickers,
    weights: input.weights,
    assetRegressions,
    factorDefinitions,
  });
  const factorCovarianceDaily = calculateCovarianceMatrix({
    factorDefinitions,
    factorReturns: aligned.factorReturns,
  });
  const factorCovarianceAnnualized = factorCovarianceDaily.map((row) =>
    row.map((value) => value * TRADING_DAYS_PER_YEAR),
  );
  const exposureVector = factorDefinitions.map(
    (factor) => portfolioFactorExposure[factor.id] ?? 0,
  );
  const covarianceTimesExposure = multiplyMatrixVector(
    factorCovarianceDaily,
    exposureVector,
  );
  const portfolioVariance = dotProduct(
    exposureVector,
    covarianceTimesExposure,
  );

  if (!Number.isFinite(portfolioVariance) || portfolioVariance <= 0) {
    throw new Error("Factor-model portfolio variance must be positive.");
  }

  const dailyVolatility = Math.sqrt(portfolioVariance);
  const annualizedVolatility =
    dailyVolatility * Math.sqrt(TRADING_DAYS_PER_YEAR);
  const zScore = -inverseStandardNormal(1 - confidenceLevel);
  const valueAtRisk = zScore * dailyVolatility;
  const marginalVaR = covarianceTimesExposure.map(
    (value) => (zScore * value) / dailyVolatility,
  );
  const componentVaR = exposureVector.map(
    (exposure, index) => exposure * marginalVaR[index],
  );
  const factorAttribution = buildFactorAttribution({
    factorDefinitions,
    exposureVector,
    marginalVaR,
    componentVaR,
    valueAtRisk,
  });
  const instrumentAttribution = buildInstrumentAttribution({
    tickers: input.tickers,
    weights: input.weights,
    assetRegressions,
    factorDefinitions,
    marginalVaR,
    valueAtRisk,
  });
  const warnings = buildMethodologyWarnings({
    aligned,
    factorDefinitions,
    assetRegressions,
    portfolioRegression,
  });

  return {
    confidenceLevel,
    observations: aligned.dates.length,
    startDate: aligned.dates[0] ?? null,
    endDate: aligned.dates[aligned.dates.length - 1] ?? null,
    zScore,
    factorDefinitions,
    assetRegressions,
    portfolioRegression,
    portfolioFactorExposure,
    factorCovarianceDaily,
    factorCovarianceAnnualized,
    dailyVolatility,
    annualizedVolatility,
    valueAtRisk,
    factorAttribution,
    instrumentAttribution,
    methodology: {
      confidenceLevel,
      observations: aligned.dates.length,
      startDate: aligned.dates[0] ?? null,
      endDate: aligned.dates[aligned.dates.length - 1] ?? null,
      factors: factorDefinitions,
      warnings,
    },
  };
}

function buildAlignedReturnSeries(input: {
  assetData: MarketDataExplorerPayload;
  factorData: MarketDataExplorerPayload;
  tickers: string[];
  portfolioDailyReturns: number[];
  factorDefinitions: FactorDefinition[];
}): AlignedFactorRows {
  const assetReturnDates = input.assetData.points
    .slice(1)
    .map((point) => point.date);

  if (input.portfolioDailyReturns.length !== assetReturnDates.length) {
    throw new Error(
      "Portfolio return dates do not match the selected asset dataset.",
    );
  }

  const assetReturnRows = buildDatedReturnRows({
    data: input.assetData,
    keys: input.tickers,
    aliases: Object.fromEntries(input.tickers.map((ticker) => [ticker, ticker])),
  });
  const factorReturnRows = buildDatedReturnRows({
    data: input.factorData,
    keys: input.factorDefinitions.map((factor) => factor.id),
    aliases: Object.fromEntries(
      input.factorDefinitions.map((factor) => [
        factor.id,
        factor.proxyTicker,
      ]),
    ),
  });
  const assetReturnMap = rowsToDateMap(assetReturnRows);
  const factorReturnMap = rowsToDateMap(factorReturnRows);
  const portfolioReturnMap = new Map(
    assetReturnDates.map((date, index) => [
      date,
      input.portfolioDailyReturns[index],
    ]),
  );
  const assetReturns = Object.fromEntries(
    input.tickers.map((ticker) => [ticker, [] as number[]]),
  );
  const factorReturns = Object.fromEntries(
    input.factorDefinitions.map((factor) => [factor.id, [] as number[]]),
  );
  const portfolioReturns: number[] = [];
  const dates: string[] = [];

  for (const date of assetReturnDates) {
    const assetRow = assetReturnMap.get(date);
    const factorRow = factorReturnMap.get(date);
    const portfolioReturn = portfolioReturnMap.get(date);

    if (
      !assetRow ||
      !factorRow ||
      typeof portfolioReturn !== "number" ||
      !Number.isFinite(portfolioReturn) ||
      !hasFiniteValues(assetRow.values, input.tickers) ||
      !hasFiniteValues(
        factorRow.values,
        input.factorDefinitions.map((factor) => factor.id),
      )
    ) {
      continue;
    }

    dates.push(date);
    portfolioReturns.push(portfolioReturn);

    input.tickers.forEach((ticker) => {
      assetReturns[ticker].push(assetRow.values[ticker]);
    });
    input.factorDefinitions.forEach((factor) => {
      factorReturns[factor.id].push(factorRow.values[factor.id]);
    });
  }

  return {
    dates,
    assetReturns,
    factorReturns,
    portfolioReturns,
    droppedObservations: assetReturnDates.length - dates.length,
    assetReturnObservationCount: assetReturnRows.length,
    factorReturnObservationCount: factorReturnRows.length,
  };
}

function buildDatedReturnRows(input: {
  data: MarketDataExplorerPayload;
  keys: string[];
  aliases: Record<string, string>;
}): DatedReturnRow[] {
  const returnSeries = Object.fromEntries(
    input.keys.map((key) => [
      key,
      calculateDailyReturns(
        input.data.points.map((point) => point.prices[input.aliases[key]]),
      ),
    ]),
  );

  return input.data.points.slice(1).map((point, index) => ({
    date: point.date,
    values: Object.fromEntries(
      input.keys.map((key) => [key, returnSeries[key][index]]),
    ),
  }));
}

function rowsToDateMap(rows: DatedReturnRow[]): Map<string, DatedReturnRow> {
  return new Map(rows.map((row) => [row.date, row]));
}

function hasFiniteValues(
  values: Record<string, number>,
  keys: string[],
): boolean {
  return keys.every((key) => Number.isFinite(values[key]));
}

function estimateRegression(input: {
  ticker: string;
  yValues: number[];
  xRows: number[][];
  factorDefinitions: FactorDefinition[];
}): FactorRegressionRow {
  if (input.yValues.length !== input.xRows.length) {
    throw new Error(`Regression input length mismatch for ${input.ticker}.`);
  }

  const observationCount = input.yValues.length;
  const predictorCount = input.factorDefinitions.length + 1;

  if (observationCount <= predictorCount) {
    throw new Error(
      `Not enough observations to estimate factor betas for ${input.ticker}.`,
    );
  }

  const designMatrix = input.xRows.map((row) => [1, ...row]);
  const { coefficients, ridgePenalty } = solveLeastSquares(
    designMatrix,
    input.yValues,
  );
  const fittedValues = designMatrix.map((row) => dotProduct(row, coefficients));
  const yMean =
    input.yValues.reduce((sum, value) => sum + value, 0) / input.yValues.length;
  const residualSumSquares = input.yValues.reduce(
    (sum, value, index) => sum + (value - fittedValues[index]) ** 2,
    0,
  );
  const totalSumSquares = input.yValues.reduce(
    (sum, value) => sum + (value - yMean) ** 2,
    0,
  );
  const rSquared =
    totalSumSquares > SINGULAR_TOLERANCE
      ? 1 - residualSumSquares / totalSumSquares
      : null;

  return {
    ticker: input.ticker,
    alpha: coefficients[0],
    betas: Object.fromEntries(
      input.factorDefinitions.map((factor, index) => [
        factor.id,
        coefficients[index + 1],
      ]),
    ),
    rSquared,
    observations: observationCount,
    ridgePenalty,
  };
}

function solveLeastSquares(
  designMatrix: number[][],
  yValues: number[],
): { coefficients: number[]; ridgePenalty: number } {
  const columnCount = designMatrix[0]?.length ?? 0;
  const normalMatrix = Array.from({ length: columnCount }, (_, rowIndex) =>
    Array.from({ length: columnCount }, (_, columnIndex) =>
      designMatrix.reduce(
        (sum, row) => sum + row[rowIndex] * row[columnIndex],
        0,
      ),
    ),
  );
  const normalVector = Array.from({ length: columnCount }, (_, rowIndex) =>
    designMatrix.reduce((sum, row, index) => sum + row[rowIndex] * yValues[index], 0),
  );

  for (const ridgePenalty of RIDGE_PENALTIES) {
    const regularizedMatrix = normalMatrix.map((row, rowIndex) =>
      row.map((value, columnIndex) =>
        rowIndex === columnIndex && rowIndex > 0
          ? value + ridgePenalty
          : value,
      ),
    );
    const solution = solveLinearSystem(regularizedMatrix, normalVector);

    if (solution && solution.every((value) => Number.isFinite(value))) {
      return { coefficients: solution, ridgePenalty };
    }
  }

  throw new Error("Factor regression matrix is singular.");
}

function solveLinearSystem(
  matrix: number[][],
  vector: number[],
): number[] | null {
  const size = vector.length;
  const augmented = matrix.map((row, index) => [...row, vector[index]]);

  for (let pivotIndex = 0; pivotIndex < size; pivotIndex += 1) {
    let maxRow = pivotIndex;

    for (let rowIndex = pivotIndex + 1; rowIndex < size; rowIndex += 1) {
      if (
        Math.abs(augmented[rowIndex][pivotIndex]) >
        Math.abs(augmented[maxRow][pivotIndex])
      ) {
        maxRow = rowIndex;
      }
    }

    if (Math.abs(augmented[maxRow][pivotIndex]) <= SINGULAR_TOLERANCE) {
      return null;
    }

    [augmented[pivotIndex], augmented[maxRow]] = [
      augmented[maxRow],
      augmented[pivotIndex],
    ];

    for (let rowIndex = pivotIndex + 1; rowIndex < size; rowIndex += 1) {
      const factor =
        augmented[rowIndex][pivotIndex] / augmented[pivotIndex][pivotIndex];

      for (
        let columnIndex = pivotIndex;
        columnIndex <= size;
        columnIndex += 1
      ) {
        augmented[rowIndex][columnIndex] -=
          factor * augmented[pivotIndex][columnIndex];
      }
    }
  }

  const solution = Array.from({ length: size }, () => 0);

  for (let rowIndex = size - 1; rowIndex >= 0; rowIndex -= 1) {
    const knownSum = solution.reduce(
      (sum, value, columnIndex) =>
        columnIndex > rowIndex
          ? sum + augmented[rowIndex][columnIndex] * value
          : sum,
      0,
    );

    solution[rowIndex] =
      (augmented[rowIndex][size] - knownSum) / augmented[rowIndex][rowIndex];
  }

  return solution;
}

function calculatePortfolioFactorExposure(input: {
  tickers: string[];
  weights: Record<string, number>;
  assetRegressions: FactorRegressionRow[];
  factorDefinitions: FactorDefinition[];
}): Record<string, number> {
  return Object.fromEntries(
    input.factorDefinitions.map((factor) => [
      factor.id,
      input.tickers.reduce((sum, ticker) => {
        const regression = input.assetRegressions.find(
          (row) => row.ticker === ticker,
        );

        return sum + (input.weights[ticker] ?? 0) * (regression?.betas[factor.id] ?? 0);
      }, 0),
    ]),
  );
}

function calculateCovarianceMatrix(input: {
  factorDefinitions: FactorDefinition[];
  factorReturns: Record<string, number[]>;
}): number[][] {
  return input.factorDefinitions.map((rowFactor) =>
    input.factorDefinitions.map((columnFactor) =>
      calculateCovariance(
        input.factorReturns[rowFactor.id],
        input.factorReturns[columnFactor.id],
      ),
    ),
  );
}

function calculateCovariance(left: number[], right: number[]): number {
  if (left.length !== right.length || left.length < 2) {
    throw new Error("Aligned factor return series must have matching lengths.");
  }

  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;

  return (
    left.reduce(
      (sum, value, index) =>
        sum + (value - leftMean) * (right[index] - rightMean),
      0,
    ) /
    (left.length - 1)
  );
}

function buildFactorAttribution(input: {
  factorDefinitions: FactorDefinition[];
  exposureVector: number[];
  marginalVaR: number[];
  componentVaR: number[];
  valueAtRisk: number;
}): FactorGradVarAttributionRow[] {
  const componentTotal = input.componentVaR.reduce(
    (sum, value) => sum + value,
    0,
  );
  const denominator =
    Math.abs(componentTotal) > SINGULAR_TOLERANCE
      ? componentTotal
      : input.valueAtRisk;

  return input.factorDefinitions
    .map((factor, index) => ({
      factorId: factor.id,
      factorName: factor.name,
      proxyTicker: factor.proxyTicker,
      exposure: input.exposureVector[index],
      marginalVaR: input.marginalVaR[index],
      componentVaR: input.componentVaR[index],
      contributionShare:
        Math.abs(denominator) > SINGULAR_TOLERANCE
          ? input.componentVaR[index] / denominator
          : 0,
      rankByAbsComponentVaR: 0,
    }))
    .sort((left, right) => Math.abs(right.componentVaR) - Math.abs(left.componentVaR))
    .map((row, index) => ({
      ...row,
      rankByAbsComponentVaR: index + 1,
    }));
}

function buildInstrumentAttribution(input: {
  tickers: string[];
  weights: Record<string, number>;
  assetRegressions: FactorRegressionRow[];
  factorDefinitions: FactorDefinition[];
  marginalVaR: number[];
  valueAtRisk: number;
}): InstrumentGradVarAttributionRow[] {
  const rows = input.tickers.map((ticker) => {
    const regression = input.assetRegressions.find((row) => row.ticker === ticker);
    const factorContributions = input.factorDefinitions.map((factor, index) => {
      const weightedBeta =
        (input.weights[ticker] ?? 0) * (regression?.betas[factor.id] ?? 0);

      return {
        ticker,
        factorId: factor.id,
        factorName: factor.name,
        proxyTicker: factor.proxyTicker,
        weightedBeta,
        contribution: weightedBeta * input.marginalVaR[index],
      };
    });
    const componentVaR = factorContributions.reduce(
      (sum, row) => sum + row.contribution,
      0,
    );
    const dominantFactor =
      factorContributions.length > 0
        ? factorContributions.reduce((current, next) =>
            Math.abs(next.contribution) > Math.abs(current.contribution)
              ? next
              : current,
          )
        : null;

    return {
      ticker,
      weight: input.weights[ticker] ?? 0,
      componentVaR,
      contributionShare: 0,
      dominantFactorId: dominantFactor?.factorId ?? null,
      dominantFactorName: dominantFactor?.factorName ?? null,
      factorContributions,
      rankByAbsComponentVaR: 0,
    };
  });
  const componentTotal = rows.reduce((sum, row) => sum + row.componentVaR, 0);
  const denominator =
    Math.abs(componentTotal) > SINGULAR_TOLERANCE
      ? componentTotal
      : input.valueAtRisk;

  return rows
    .map((row) => ({
      ...row,
      contributionShare:
        Math.abs(denominator) > SINGULAR_TOLERANCE
          ? row.componentVaR / denominator
          : 0,
    }))
    .sort((left, right) => Math.abs(right.componentVaR) - Math.abs(left.componentVaR))
    .map((row, index) => ({
      ...row,
      rankByAbsComponentVaR: index + 1,
    }));
}

function buildMethodologyWarnings(input: {
  aligned: AlignedFactorRows;
  factorDefinitions: FactorDefinition[];
  assetRegressions: FactorRegressionRow[];
  portfolioRegression: FactorRegressionRow | null;
}): string[] {
  const warnings: string[] = [];

  if (input.aligned.droppedObservations > 0) {
    warnings.push(
      `${input.aligned.droppedObservations} asset return date(s) were not used because complete factor or portfolio returns were unavailable.`,
    );
  }

  if (
    input.aligned.assetReturnObservationCount !==
    input.aligned.factorReturnObservationCount
  ) {
    warnings.push(
      "Asset and factor datasets have different return counts; attribution uses date-aligned overlap only.",
    );
  }

  const ridgeRows = [
    ...input.assetRegressions,
    ...(input.portfolioRegression ? [input.portfolioRegression] : []),
  ].filter((row) => row.ridgePenalty > 0);

  if (ridgeRows.length > 0) {
    warnings.push(
      "A small ridge fallback was used for one or more regressions because the factor matrix was near-singular.",
    );
  }

  if (input.factorDefinitions.length > 4) {
    warnings.push(
      "Several ETF proxies are correlated, so factor contributions can offset one another.",
    );
  }

  return warnings;
}

function validateFactorDefinitions(factorDefinitions: FactorDefinition[]): void {
  if (factorDefinitions.length === 0) {
    throw new Error("At least one factor definition is required.");
  }

  const ids = new Set<string>();
  const proxies = new Set<string>();

  factorDefinitions.forEach((factor) => {
    if (!factor.id || !factor.name || !factor.proxyTicker) {
      throw new Error("Each factor definition requires an id, name, and proxy.");
    }

    if (ids.has(factor.id)) {
      throw new Error(`Duplicate factor id: ${factor.id}.`);
    }

    if (proxies.has(factor.proxyTicker)) {
      throw new Error(`Duplicate factor proxy: ${factor.proxyTicker}.`);
    }

    ids.add(factor.id);
    proxies.add(factor.proxyTicker);
  });
}

function validateConfidenceLevel(confidenceLevel: number): void {
  if (
    !Number.isFinite(confidenceLevel) ||
    confidenceLevel <= 0 ||
    confidenceLevel >= 1
  ) {
    throw new Error("Confidence level must be between 0 and 1.");
  }
}

function multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
  return matrix.map((row) => dotProduct(row, vector));
}

function dotProduct(left: number[], right: number[]): number {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

function inverseStandardNormal(probability: number): number {
  if (probability <= 0 || probability >= 1) {
    throw new Error("Probability must be between 0 and 1.");
  }

  const a = [
    -39.69683028665376, 220.9460984245205, -275.9285104469687,
    138.357751867269, -30.66479806614716, 2.506628277459239,
  ];
  const b = [
    -54.47609879822406, 161.5858368580409, -155.6989798598866,
    66.80131188771972, -13.28068155288572,
  ];
  const c = [
    -0.007784894002430293, -0.3223964580411365, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    0.007784695709041462, 0.3224671290700398, 2.445134137142996,
    3.754408661907416,
  ];
  const lowerBreakpoint = 0.02425;
  const upperBreakpoint = 1 - lowerBreakpoint;

  if (probability < lowerBreakpoint) {
    const q = Math.sqrt(-2 * Math.log(probability));

    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q +
        c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  if (probability > upperBreakpoint) {
    const q = Math.sqrt(-2 * Math.log(1 - probability));

    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q +
        c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  const q = probability - 0.5;
  const r = q * q;

  return (
    (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r +
      a[5]) *
    q
  ) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
