import {
  calculateAnnualizedReturn,
  calculateDailyReturns,
  calculateTotalReturn,
} from "@/lib/finance/returns";
import { calculateMaxDrawdown } from "@/lib/finance/drawdown";
import type { ExplorerTickerMetrics } from "@/lib/market-data/types";

export function calculateAnnualizedVolatility(
  dailyReturns: number[],
  tradingDaysPerYear: number = 252,
): number {
  if (dailyReturns.length < 2) {
    return 0;
  }

  const mean =
    dailyReturns.reduce((sum, value) => sum + value, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (dailyReturns.length - 1);

  return Math.sqrt(variance) * Math.sqrt(tradingDaysPerYear);
}

export function calculateTickerMetrics(input: {
  ticker: string;
  prices: number[];
  dates: string[];
}): ExplorerTickerMetrics {
  const dailyReturns = calculateDailyReturns(input.prices);

  return {
    ticker: input.ticker,
    totalReturn: calculateTotalReturn(input.prices),
    annualizedReturn: calculateAnnualizedReturn(input.prices),
    annualizedVolatility: calculateAnnualizedVolatility(dailyReturns),
    maxDrawdown: calculateMaxDrawdown(input.prices),
    observations: input.prices.length,
    startDate: input.dates[0],
    endDate: input.dates[input.dates.length - 1],
    startPrice: input.prices[0],
    endPrice: input.prices[input.prices.length - 1],
  };
}
