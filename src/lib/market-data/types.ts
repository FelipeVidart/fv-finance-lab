export type MarketDataPeriod = "1M" | "3M" | "6M" | "1Y";

export type MarketDataProviderId = "yahoo" | "stooq" | "twelveData";

export type MarketDataProviderMode = "auto" | MarketDataProviderId;

export type MarketDataInterval = "1day";

export type PricePoint = {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  adjustedClose?: number;
  volume?: number;
};

export type HistoricalPricePoint = {
  date: string;
  close: number;
};

export type HistoricalPriceSeries = {
  ticker: string;
  points: HistoricalPricePoint[];
};

export type MarketDataWarning = {
  symbol?: string;
  provider?: MarketDataProviderId;
  code: string;
  message: string;
};

export type MarketDataProviderDiagnostic = {
  symbol: string;
  requestedProvider: MarketDataProviderMode;
  provider: MarketDataProviderId;
  sourceSymbol: string;
  status: "success" | "failure" | "cache-hit";
  message?: string;
  observations?: number;
  cacheHit?: boolean;
};

export type HistoricalPriceRequest = {
  symbol: string;
  startDate?: string;
  endDate?: string;
  interval: MarketDataInterval;
  provider: MarketDataProviderMode;
};

export type HistoricalPriceResponse = {
  symbol: string;
  provider: MarketDataProviderId;
  prices: PricePoint[];
  warnings: MarketDataWarning[];
  metadata: {
    requestedStartDate?: string;
    requestedEndDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
    observations: number;
    sourceSymbol: string;
    cacheHit?: boolean;
  };
};

export type BatchHistoricalPriceRequest = {
  symbols: string[];
  startDate?: string;
  endDate?: string;
  interval: MarketDataInterval;
  provider: MarketDataProviderMode;
};

export type BatchHistoricalPriceResponse = {
  results: Record<string, HistoricalPriceResponse>;
  missingSymbols: string[];
  warnings: MarketDataWarning[];
  providerDiagnostics: MarketDataProviderDiagnostic[];
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
    warnings?: MarketDataWarning[];
    providerDiagnostics?: MarketDataProviderDiagnostic[];
    providers?: MarketDataProviderId[];
    cache?: {
      hits: number;
      misses: number;
    };
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
