import { calculateDrawdownSeries } from "@/lib/finance/drawdown";
import { calculateAnnualizedVolatility } from "@/lib/finance/metrics";
import {
  calculateAnnualizedReturn,
  calculateDailyReturns,
  calculateTotalReturn,
} from "@/lib/finance/returns";
import type { ExplorerTickerMetrics, MarketDataExplorerPayload } from "@/lib/market-data/types";

export type PortfolioPoint = {
  date: string;
  nav: number;
  cumulativeReturn: number;
  drawdown: number;
};

export type PortfolioAnalytics = {
  tickers: string[];
  weights: Record<string, number>;
  points: PortfolioPoint[];
  dailyReturns: number[];
  metrics: ExplorerTickerMetrics;
};

export function buildPortfolioAnalytics(input: {
  data: MarketDataExplorerPayload;
  weights: Record<string, number>;
}): PortfolioAnalytics {
  const { data, weights } = input;

  if (data.points.length < 2) {
    throw new Error(
      "At least two aligned observations are required to build the portfolio.",
    );
  }

  const totalWeight = data.tickers.reduce(
    (sum, ticker) => sum + (weights[ticker] ?? 0),
    0,
  );

  if (Math.abs(totalWeight - 1) > 1e-6) {
    throw new Error("Portfolio weights must sum to 100%.");
  }

  const priceMatrix = data.tickers.map((ticker) =>
    data.points.map((point) => point.prices[ticker]),
  );

  if (priceMatrix.some((prices) => prices.some((price) => price <= 0))) {
    throw new Error(
      "Portfolio construction requires positive aligned prices for all selected assets.",
    );
  }

  const componentDailyReturns = priceMatrix.map((prices) =>
    calculateDailyReturns(prices),
  );
  const dailyReturns = componentDailyReturns[0].map((_, dayIndex) =>
    data.tickers.reduce(
      (sum, ticker, tickerIndex) =>
        sum + (weights[ticker] ?? 0) * componentDailyReturns[tickerIndex][dayIndex],
      0,
    ),
  );

  const navSeries = [100];

  dailyReturns.forEach((dailyReturn) => {
    navSeries.push(navSeries[navSeries.length - 1] * (1 + dailyReturn));
  });

  const drawdowns = calculateDrawdownSeries(navSeries);
  const points = data.points.map((point, index) => ({
    date: point.date,
    nav: navSeries[index],
    cumulativeReturn: navSeries[index] / navSeries[0] - 1,
    drawdown: drawdowns[index],
  }));

  return {
    tickers: data.tickers,
    weights,
    points,
    dailyReturns,
    metrics: {
      ticker: "Portfolio",
      totalReturn: calculateTotalReturn(navSeries),
      annualizedReturn: calculateAnnualizedReturn(navSeries),
      annualizedVolatility: calculateAnnualizedVolatility(dailyReturns),
      maxDrawdown: Math.min(...drawdowns),
      observations: navSeries.length,
      startDate: data.meta.commonStartDate,
      endDate: data.meta.commonEndDate,
      startPrice: navSeries[0],
      endPrice: navSeries[navSeries.length - 1],
    },
  };
}
