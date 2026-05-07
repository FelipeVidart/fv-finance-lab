import type { DescriptiveStatistics } from "@/lib/finance/risk/types";

export function mean(values: number[]): number {
  const cleanValues = finiteValues(values);

  if (cleanValues.length === 0) {
    return 0;
  }

  return cleanValues.reduce((sum, value) => sum + value, 0) / cleanValues.length;
}

export function sampleStandardDeviation(values: number[]): number {
  const cleanValues = finiteValues(values);

  if (cleanValues.length < 2) {
    return 0;
  }

  const average = mean(cleanValues);
  const variance =
    cleanValues.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    (cleanValues.length - 1);

  return Math.sqrt(Math.max(variance, 0));
}

export function min(values: number[]): number {
  const cleanValues = finiteValues(values);

  return cleanValues.length > 0 ? Math.min(...cleanValues) : 0;
}

export function max(values: number[]): number {
  const cleanValues = finiteValues(values);

  return cleanValues.length > 0 ? Math.max(...cleanValues) : 0;
}

export function skewness(values: number[]): number | null {
  const cleanValues = finiteValues(values);

  if (cleanValues.length < 3) {
    return null;
  }

  const average = mean(cleanValues);
  const standardDeviation = sampleStandardDeviation(cleanValues);

  if (standardDeviation === 0) {
    return 0;
  }

  const n = cleanValues.length;
  const thirdMoment = cleanValues.reduce(
    (sum, value) => sum + ((value - average) / standardDeviation) ** 3,
    0,
  );

  return (n / ((n - 1) * (n - 2))) * thirdMoment;
}

export function excessKurtosis(values: number[]): number | null {
  const cleanValues = finiteValues(values);

  if (cleanValues.length < 4) {
    return null;
  }

  const average = mean(cleanValues);
  const standardDeviation = sampleStandardDeviation(cleanValues);

  if (standardDeviation === 0) {
    return 0;
  }

  const n = cleanValues.length;
  const fourthMoment = cleanValues.reduce(
    (sum, value) => sum + ((value - average) / standardDeviation) ** 4,
    0,
  );

  return (
    ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * fourthMoment -
    (3 * (n - 1) ** 2) / ((n - 2) * (n - 3))
  );
}

export function positiveDayRatio(values: number[]): number {
  const cleanValues = finiteValues(values);

  if (cleanValues.length === 0) {
    return 0;
  }

  return cleanValues.filter((value) => value > 0).length / cleanValues.length;
}

export function bestDailyReturn(values: number[]): number {
  return max(values);
}

export function worstDailyReturn(values: number[]): number {
  return min(values);
}

export function calculateDescriptiveStatistics(
  values: number[],
): DescriptiveStatistics {
  const cleanValues = finiteValues(values);

  return {
    observations: cleanValues.length,
    mean: mean(cleanValues),
    sampleStandardDeviation: sampleStandardDeviation(cleanValues),
    min: min(cleanValues),
    max: max(cleanValues),
    skewness: skewness(cleanValues),
    excessKurtosis: excessKurtosis(cleanValues),
    positiveDayRatio: positiveDayRatio(cleanValues),
    bestDailyReturn: bestDailyReturn(cleanValues),
    worstDailyReturn: worstDailyReturn(cleanValues),
  };
}

function finiteValues(values: number[]): number[] {
  return values.filter((value) => Number.isFinite(value));
}
