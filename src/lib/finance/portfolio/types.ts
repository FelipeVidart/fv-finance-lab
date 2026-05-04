import type {
  HistoricalPriceSeries,
  MarketDataPeriod,
  MarketDataProviderId,
  MarketDataWarning,
} from "@/lib/market-data/types";

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

export type StressCoverageStatus =
  | "Full coverage"
  | "Partial coverage"
  | "Outside available history"
  | "Insufficient observations"
  | "Missing required assets";

export type StressPeriodDefinition = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  description: string;
  category: string;
};

export type StressTestResult = {
  stressPeriod: StressPeriodDefinition;
  coverageStatus: StressCoverageStatus;
  coverageNote: string;
  periodStartUsed: string | null;
  periodEndUsed: string | null;
  observations: number;
  portfolioReturn: number | null;
  portfolioMaxDrawdown: number | null;
  benchmarkReturn: number | null;
  benchmarkMaxDrawdown: number | null;
  activeReturn: number | null;
  bestAssetTicker: string | null;
  bestAssetReturn: number | null;
  worstAssetTicker: string | null;
  worstAssetReturn: number | null;
  availableAssets: string[];
  missingAssets: string[];
};

export type StressTestAnalysis = {
  results: StressTestResult[];
};

export type StressMarketDataMissingTicker = {
  ticker: string;
  error: string;
};

export type StressMarketDataPayload = {
  provider: string;
  startDate: string;
  endDate: string;
  series: HistoricalPriceSeries[];
  missing: StressMarketDataMissingTicker[];
};

export type StressMarketDataRouteSuccess = {
  ok: true;
  data: StressMarketDataPayload;
};

export type StressMarketDataRouteError = {
  ok: false;
  error: string;
};

export type StressMarketDataRouteResponse =
  | StressMarketDataRouteSuccess
  | StressMarketDataRouteError;

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

export type RebalancingStrategyId =
  | "none"
  | "monthly"
  | "quarterly"
  | "annual"
  | "threshold";

export type RebalanceReason = Exclude<RebalancingStrategyId, "none">;

export type RebalancingStrategyConfig = {
  id: RebalancingStrategyId;
  threshold?: number;
};

export type PortfolioWeightMap = Record<string, number>;

export type RebalanceEvent = {
  date: string;
  reason: RebalanceReason;
  turnover: number;
  beforeWeights: PortfolioWeightMap;
  afterWeights: PortfolioWeightMap;
  maxDriftBeforeRebalance: number;
};

export type PortfolioDriftPoint = {
  date: string;
  weights: PortfolioWeightMap;
  driftByTicker: PortfolioWeightMap;
  maxDrift: number;
  averageDrift: number;
};

export type PortfolioSimulationResult = {
  strategy: RebalancingStrategyConfig;
  performancePoints: PortfolioPerformancePoint[];
  dailyReturns: number[];
  driftPoints: PortfolioDriftPoint[];
  rebalanceEvents: RebalanceEvent[];
  finalWeights: PortfolioWeightMap;
  totalTurnover: number;
  rebalanceCount: number;
  averageDrift: number;
  maxDrift: number;
  finalDrift: number;
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

export type PortfolioRebalancingAnalysis = {
  strategy: RebalancingStrategyConfig;
  selected: PortfolioSimulationResult;
  buyAndHold: PortfolioSimulationResult;
  buyAndHoldMetrics: PortfolioMetrics;
  buyAndHoldDrawdownPoints: PortfolioDrawdownPoint[];
};

export type PortfolioAnalysis = {
  name: string;
  period: MarketDataPeriod;
  provider: string;
  providers?: MarketDataProviderId[];
  providerWarnings?: MarketDataWarning[];
  providerCache?: {
    hits: number;
    misses: number;
  };
  commonStartDate: string;
  commonEndDate: string;
  observations: number;
  assets: PortfolioAssetAnalytics[];
  performancePoints: PortfolioPerformancePoint[];
  drawdownPoints: PortfolioDrawdownPoint[];
  drawdownAnalysis: DrawdownAnalysis;
  dailyReturns: number[];
  metrics: PortfolioMetrics;
  rebalancing: PortfolioRebalancingAnalysis;
  benchmarkComparison?: BenchmarkComparison;
  benchmarkWarning?: string;
  stressTests: StressTestAnalysis;
};
