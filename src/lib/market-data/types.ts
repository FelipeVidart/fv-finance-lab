export type MarketDataPeriod = "1M" | "3M" | "6M" | "1Y";

export type HistoricalPricePoint = {
  date: string;
  close: number;
};

export type HistoricalPriceSeries = {
  ticker: string;
  points: HistoricalPricePoint[];
};

export type ExplorerPoint = {
  date: string;
  prices: Record<string, number>;
  normalized: Record<string, number>;
  cumulativeReturns: Record<string, number>;
  drawdowns: Record<string, number>;
};

export type ExplorerTickerMetrics = {
  ticker: string;
  totalReturn: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  maxDrawdown: number;
  observations: number;
  startDate: string;
  endDate: string;
  startPrice: number;
  endPrice: number;
};

export type MarketDataExplorerPayload = {
  tickers: string[];
  period: MarketDataPeriod;
  points: ExplorerPoint[];
  metrics: ExplorerTickerMetrics[];
  meta: {
    provider: string;
    interval: "1day";
    adjustMode: "all";
    observations: number;
    commonStartDate: string;
    commonEndDate: string;
  };
};

export type MarketDataRouteSuccess = {
  ok: true;
  data: MarketDataExplorerPayload;
};

export type MarketDataRouteError = {
  ok: false;
  error: string;
};

export type MarketDataRouteResponse =
  | MarketDataRouteSuccess
  | MarketDataRouteError;
