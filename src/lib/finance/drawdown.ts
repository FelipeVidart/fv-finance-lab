export function calculateDrawdownSeries(prices: number[]): number[] {
  if (prices.length === 0) {
    return [];
  }

  let runningPeak = prices[0];

  return prices.map((price) => {
    runningPeak = Math.max(runningPeak, price);

    if (runningPeak <= 0) {
      return 0;
    }

    return price / runningPeak - 1;
  });
}

export function calculateMaxDrawdown(prices: number[]): number {
  const drawdowns = calculateDrawdownSeries(prices);

  if (drawdowns.length === 0) {
    return 0;
  }

  return Math.min(...drawdowns);
}
