export function calculateDailyReturns(prices: number[]): number[] {
  return prices.slice(1).map((price, index) => price / prices[index] - 1);
}

export function calculateNormalizedSeries(
  prices: number[],
  baseValue: number = 100,
): number[] {
  if (prices.length === 0 || prices[0] <= 0) {
    return [];
  }

  return prices.map((price) => (price / prices[0]) * baseValue);
}

export function calculateCumulativeReturns(prices: number[]): number[] {
  if (prices.length === 0 || prices[0] <= 0) {
    return [];
  }

  return prices.map((price) => price / prices[0] - 1);
}

export function calculateTotalReturn(prices: number[]): number {
  if (prices.length < 2 || prices[0] <= 0) {
    return 0;
  }

  return prices[prices.length - 1] / prices[0] - 1;
}

export function calculateAnnualizedReturn(
  prices: number[],
  tradingDaysPerYear: number = 252,
): number {
  if (prices.length < 2 || prices[0] <= 0) {
    return 0;
  }

  const totalReturn = prices[prices.length - 1] / prices[0];
  const periods = prices.length - 1;

  if (totalReturn <= 0 || periods <= 0) {
    return 0;
  }

  return totalReturn ** (tradingDaysPerYear / periods) - 1;
}
