import type { MarketDataPeriod } from "@/lib/market-data/types";

export type PortfolioAssetInput = {
  ticker: string;
  assetClass: string;
  weight: number;
};

export type PortfolioRiskLevel =
  | "Conservative"
  | "Balanced"
  | "Growth"
  | "Aggressive";

export type PortfolioPreset = {
  id: string;
  name: string;
  description: string;
  riskLevel: PortfolioRiskLevel;
  initialCapital: number;
  period: MarketDataPeriod;
  holdings: PortfolioAssetInput[];
};

export type BroadAssetCategory =
  | "Equity"
  | "Fixed Income"
  | "Alternatives"
  | "Cash"
  | "Other";

export type AssetClassAllocationRow = {
  assetClass: string;
  broadCategory: BroadAssetCategory;
  weight: number;
  holdingCount: number;
  tickers: string[];
};

export type BroadAllocationRow = {
  category: BroadAssetCategory;
  weight: number;
  holdingCount: number;
  assetClassCount: number;
};

export type AssetClassAllocationSummary = {
  assetClasses: AssetClassAllocationRow[];
  broadCategories: BroadAllocationRow[];
  totalWeight: number;
  groupedWeight: number;
  isWeightConsistent: boolean;
};

export type BenchmarkSelectionId =
  | "none"
  | "spy"
  | "acwi"
  | "agg"
  | "sixtyForty"
  | "custom";

export type BenchmarkDefinition = {
  id: BenchmarkSelectionId;
  label: string;
  description: string;
} & (
  | {
      type: "none";
    }
  | {
      type: "singleTicker";
      ticker: string;
    }
  | {
      type: "customTicker";
      ticker: string;
    }
  | {
      type: "weightedPortfolio";
      holdings: Array<{
        ticker: string;
        weight: number;
      }>;
    }
);

export type BenchmarkComparisonMetrics = {
  portfolioCagr: number;
  benchmarkCagr: number;
  activeReturn: number;
  portfolioAnnualizedVolatility: number;
  benchmarkAnnualizedVolatility: number;
  portfolioMaxDrawdown: number;
  benchmarkMaxDrawdown: number;
  trackingError: number | null;
  informationRatio: number | null;
  correlation: number | null;
  beta: number | null;
  alpha: number | null;
};

export type BenchmarkComparison = {
  benchmark: BenchmarkDefinition;
  comparisonStartDate: string;
  comparisonEndDate: string;
  observations: number;
  portfolioGrowthPoints: PortfolioPerformancePoint[];
  benchmarkGrowthPoints: PortfolioPerformancePoint[];
  portfolioDrawdownPoints: PortfolioDrawdownPoint[];
  benchmarkDrawdownPoints: PortfolioDrawdownPoint[];
  metrics: BenchmarkComparisonMetrics;
};

export type DrawdownEpisode = {
  rank: number;
  startDate: string;
  troughDate: string;
  endDate: string;
  recoveryDate: string | null;
  lengthDays: number;
  recoveryDays: number | null;
  underwaterDays: number;
  maxDrawdown: number;
  startBalance: number;
  troughBalance: number;
  recoveryBalance: number | null;
};

export type CurrentDrawdownStatus = {
  isRecovered: boolean;
  currentDrawdown: number;
  underwaterDays: number;
  startDate: string | null;
};

export type DrawdownAnalysis = {
  episodes: DrawdownEpisode[];
  worstDrawdown: DrawdownEpisode | null;
  longestUnderwater: DrawdownEpisode | null;
  currentStatus: CurrentDrawdownStatus;
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
  drawdownAnalysis: DrawdownAnalysis;
  dailyReturns: number[];
  metrics: PortfolioMetrics;
  benchmarkComparison?: BenchmarkComparison;
  benchmarkWarning?: string;
};
