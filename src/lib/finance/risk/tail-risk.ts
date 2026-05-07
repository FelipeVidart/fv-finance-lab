import { mean, sampleStandardDeviation } from "@/lib/finance/risk/statistics";
import type { TailRiskMetrics } from "@/lib/finance/risk/types";

const DEFAULT_CONFIDENCE_LEVEL = 0.95;

export function calculateTailRiskMetrics(input: {
  returns: number[];
  confidenceLevel?: number;
  volatility?: number;
}): TailRiskMetrics {
  const confidenceLevel = input.confidenceLevel ?? DEFAULT_CONFIDENCE_LEVEL;
  const cleanReturns = finiteValues(input.returns);

  validateConfidenceLevel(confidenceLevel);

  return {
    confidenceLevel,
    historicalVaR: calculateHistoricalVaR(cleanReturns, confidenceLevel),
    historicalExpectedShortfall: calculateHistoricalExpectedShortfall(
      cleanReturns,
      confidenceLevel,
    ),
    parametricVaR: calculateParametricVaR({
      mean: mean(cleanReturns),
      volatility: input.volatility ?? sampleStandardDeviation(cleanReturns),
      confidenceLevel,
    }),
  };
}

export function calculateHistoricalVaR(
  returns: number[],
  confidenceLevel: number = DEFAULT_CONFIDENCE_LEVEL,
): number {
  validateConfidenceLevel(confidenceLevel);

  const cleanReturns = finiteValues(returns).sort((left, right) => left - right);

  if (cleanReturns.length === 0) {
    return 0;
  }

  const thresholdReturn = quantile(cleanReturns, 1 - confidenceLevel);

  return Math.max(0, -thresholdReturn);
}

export function calculateHistoricalExpectedShortfall(
  returns: number[],
  confidenceLevel: number = DEFAULT_CONFIDENCE_LEVEL,
): number {
  validateConfidenceLevel(confidenceLevel);

  const cleanReturns = finiteValues(returns).sort((left, right) => left - right);

  if (cleanReturns.length === 0) {
    return 0;
  }

  const thresholdReturn = quantile(cleanReturns, 1 - confidenceLevel);
  const tailReturns = cleanReturns.filter((value) => value <= thresholdReturn);

  if (tailReturns.length === 0) {
    return 0;
  }

  return Math.max(0, -mean(tailReturns));
}

export function calculateParametricVaR(input: {
  mean: number;
  volatility: number;
  confidenceLevel?: number;
}): number {
  const confidenceLevel = input.confidenceLevel ?? DEFAULT_CONFIDENCE_LEVEL;

  validateConfidenceLevel(confidenceLevel);

  if (!Number.isFinite(input.volatility) || input.volatility <= 0) {
    return 0;
  }

  const lowerTailZScore = inverseStandardNormal(1 - confidenceLevel);
  const thresholdReturn = input.mean + lowerTailZScore * input.volatility;

  return Math.max(0, -thresholdReturn);
}

export function validateConfidenceLevel(confidenceLevel: number): void {
  if (
    !Number.isFinite(confidenceLevel) ||
    confidenceLevel <= 0 ||
    confidenceLevel >= 1
  ) {
    throw new Error("Confidence level must be between 0 and 1.");
  }
}

function quantile(sortedValues: number[], probability: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }

  if (probability <= 0) {
    return sortedValues[0];
  }

  if (probability >= 1) {
    return sortedValues[sortedValues.length - 1];
  }

  const position = (sortedValues.length - 1) * probability;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);

  if (lowerIndex === upperIndex) {
    return sortedValues[lowerIndex];
  }

  const lowerValue = sortedValues[lowerIndex];
  const upperValue = sortedValues[upperIndex];
  const weight = position - lowerIndex;

  return lowerValue + (upperValue - lowerValue) * weight;
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

function finiteValues(values: number[]): number[] {
  return values.filter((value) => Number.isFinite(value));
}
