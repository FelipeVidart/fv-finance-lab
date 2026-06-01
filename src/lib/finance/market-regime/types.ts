import type {
  MarketDataProviderMode,
  MarketDataWarning,
} from "@/lib/market-data/types";

export const MARKET_REGIME_TICKER_CONFIG = [
  { ticker: "SPY", fetchSymbol: "SPY", label: "S&P 500 ETF" },
  { ticker: "QQQ", fetchSymbol: "QQQ", label: "Nasdaq 100 ETF" },
  { ticker: "VIX", fetchSymbol: "^VIX", label: "CBOE Volatility Index" },
  { ticker: "HYG", fetchSymbol: "HYG", label: "High Yield Credit ETF" },
  { ticker: "LQD", fetchSymbol: "LQD", label: "Investment Grade Credit ETF" },
  { ticker: "TLT", fetchSymbol: "TLT", label: "Long Duration Treasury ETF" },
  { ticker: "IEF", fetchSymbol: "IEF", label: "Intermediate Treasury ETF" },
] as const;

export type MarketRegimeTicker =
  (typeof MARKET_REGIME_TICKER_CONFIG)[number]["ticker"];

export type MarketRegimeSource = "real" | "mock";

export type MarketRegimeName =
  | "Strong Risk On"
  | "Risk On"
  | "Neutral / Mixed"
  | "Risk Off"
  | "Strong Risk Off";

export type MarketRegimeBlockId =
  | "equityTrend"
  | "riskMomentum"
  | "volatility"
  | "creditConditions"
  | "ratesDuration";

export type MarketRegimeConfidenceLevel = "High" | "Medium" | "Low";

export type MarketRegimePricePoint = {
  date: string;
  close: number;
};

export type MarketRegimePriceSeries = {
  ticker: MarketRegimeTicker;
  sourceSymbol: string;
  points: MarketRegimePricePoint[];
};

export type MarketRegimeAlignedPoint = {
  date: string;
  prices: Record<MarketRegimeTicker, number>;
};

export type MarketRegimeIndicator = {
  id: string;
  label: string;
  source: string;
  blockId: MarketRegimeBlockId;
  blockLabel: string;
  metricLabel: string;
  value: number;
  valueDisplay: string;
  score: number;
  contribution: number;
  explanation: string;
};

export type MarketRegimeBlock = {
  id: MarketRegimeBlockId;
  label: string;
  weight: number;
  score: number;
  contribution: number;
  indicators: MarketRegimeIndicator[];
};

export type MarketRegimeConfidence = {
  level: MarketRegimeConfidenceLevel;
  score: number;
  explanation: string;
};

export type MarketRegimeResult = {
  regime: MarketRegimeName;
  score: number;
  confidence: MarketRegimeConfidence;
  tags: string[];
  blocks: MarketRegimeBlock[];
  indicators: MarketRegimeIndicator[];
  explanation: string;
  source: MarketRegimeSource;
  provider: string;
  requestedProvider: MarketDataProviderMode;
  lastUpdated: string;
  lastMarketDate: string;
  observationCount: number;
  warnings: string[];
  providerWarnings?: MarketDataWarning[];
};

export type MarketRegimeRouteResponse =
  | {
      ok: true;
      data: MarketRegimeResult;
    }
  | {
      ok: false;
      error: string;
    };

