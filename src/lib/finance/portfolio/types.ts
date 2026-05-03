import type { MarketDataPeriod } from "@/lib/market-data/types";

export type PortfolioAssetInput = {
  ticker: string;
  assetClass: string;
  weight: number;
};

export type PortfolioPreset = {
  name: string;
  initialCapital: number;
  period: MarketDataPeriod;
  assets: PortfolioAssetInput[];
};

export type PortfolioValidationResult =
  | {
      isValid: true;
      totalWeight: number;
      assets: PortfolioAssetInput[];
    }
  | {
      isValid: false;
      totalWeight: number;
      error: string;
    };

export type PortfolioPerformancePoint = {
  date: string;
  balance: number;
  cumulativeReturn: number;
};

export type PortfolioDrawdownPoint = {
  date: string;
  drawdown: number;
};

export type PortfolioAssetAnalytics = PortfolioAssetInput & {
  startDate: string;
  endDate: string;
  cumulativeReturn: number;
  annualizedVolatility: number;
};

export type PortfolioMetrics = {
  initialBalance: number;
  finalBalance: number;
  cumulativeReturn: number;
  cagr: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  bestYear: {
    year: string;
    return: number;
  } | null;
  worstYear: {
    year: string;
    return: number;
  } | null;
};

export type PortfolioAnalysis = {
  name: string;
  period: MarketDataPeriod;
  provider: string;
  commonStartDate: string;
  commonEndDate: string;
  observations: number;
  assets: PortfolioAssetAnalytics[];
  performancePoints: PortfolioPerformancePoint[];
  drawdownPoints: PortfolioDrawdownPoint[];
  dailyReturns: number[];
  metrics: PortfolioMetrics;
};
