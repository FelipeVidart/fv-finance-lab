import type { PortfolioPoint } from "@/lib/finance/portfolio";
import type { MarketDataExplorerPayload } from "@/lib/market-data/types";

export const TRADING_DAYS_PER_YEAR = 252;

export type DescriptiveStatistics = {
  observations: number;
  mean: number;
  sampleStandardDeviation: number;
  min: number;
  max: number;
  skewness: number | null;
  excessKurtosis: number | null;
  positiveDayRatio: number;
  bestDailyReturn: number;
  worstDailyReturn: number;
};

export type TailRiskMetrics = {
  confidenceLevel: number;
  historicalVaR: number;
  historicalExpectedShortfall: number;
  parametricVaR: number;
};

export type DatedRiskPoint = {
  date: string;
  value: number;
};

export type EwmaVolatilityResult = {
  lambda: number;
  variance: DatedRiskPoint[];
  volatility: DatedRiskPoint[];
};

export type DrawdownSummary = {
  maxDrawdown: number;
  startDate: string | null;
  troughDate: string | null;
  endDate: string | null;
  currentDrawdown: number;
};

export type RiskContributionRow = {
  ticker: string;
  weight: number;
  annualizedVolatility: number;
  marginalContributionToVolatility: number;
  contributionToVolatility: number;
  percentContributionToVolatility: number;
};

export type PortfolioRiskAnalysisMethodology = {
  confidenceLevel: number;
  ewmaLambda: number;
  observations: number;
  startDate: string | null;
  endDate: string | null;
  rollingWindowDays: number;
  warnings: string[];
};

export type PortfolioRiskAnalysis = {
  descriptiveStats: DescriptiveStatistics;
  tailRisk: TailRiskMetrics;
  ewmaVolatilitySeries: DatedRiskPoint[];
  rollingVolatilitySeries: DatedRiskPoint[];
  drawdownSummary: DrawdownSummary;
  riskContribution: RiskContributionRow[];
  methodology: PortfolioRiskAnalysisMethodology;
};

export type PortfolioRiskAnalysisInput = {
  data: MarketDataExplorerPayload;
  tickers: string[];
  weights: Record<string, number>;
  portfolioDailyReturns: number[];
  portfolioNavPoints: PortfolioPoint[];
  confidenceLevel?: number;
  ewmaLambda?: number;
  rollingWindowDays?: number;
};

export type FactorDefinition = {
  id: string;
  name: string;
  proxyTicker: string;
  description: string;
};

export type FactorRegressionRow = {
  ticker: string;
  alpha: number;
  betas: Record<string, number>;
  rSquared: number | null;
  observations: number;
  ridgePenalty: number;
};

export type FactorGradVarAttributionRow = {
  factorId: string;
  factorName: string;
  proxyTicker: string;
  exposure: number;
  marginalVaR: number;
  componentVaR: number;
  contributionShare: number;
  rankByAbsComponentVaR: number;
};

export type InstrumentFactorContributionRow = {
  ticker: string;
  factorId: string;
  factorName: string;
  proxyTicker: string;
  weightedBeta: number;
  contribution: number;
};

export type InstrumentGradVarAttributionRow = {
  ticker: string;
  weight: number;
  componentVaR: number;
  contributionShare: number;
  dominantFactorId: string | null;
  dominantFactorName: string | null;
  factorContributions: InstrumentFactorContributionRow[];
  rankByAbsComponentVaR: number;
};

export type FactorGradVarMethodology = {
  confidenceLevel: number;
  observations: number;
  startDate: string | null;
  endDate: string | null;
  factors: FactorDefinition[];
  warnings: string[];
};

export type FactorGradVarAnalysis = {
  confidenceLevel: number;
  observations: number;
  startDate: string | null;
  endDate: string | null;
  zScore: number;
  factorDefinitions: FactorDefinition[];
  assetRegressions: FactorRegressionRow[];
  portfolioRegression: FactorRegressionRow | null;
  portfolioFactorExposure: Record<string, number>;
  factorCovarianceDaily: number[][];
  factorCovarianceAnnualized: number[][];
  dailyVolatility: number;
  annualizedVolatility: number;
  valueAtRisk: number;
  factorAttribution: FactorGradVarAttributionRow[];
  instrumentAttribution: InstrumentGradVarAttributionRow[];
  methodology: FactorGradVarMethodology;
};

export type FactorGradVarAnalysisInput = {
  assetData: MarketDataExplorerPayload;
  factorData: MarketDataExplorerPayload;
  tickers: string[];
  weights: Record<string, number>;
  portfolioDailyReturns: number[];
  confidenceLevel?: number;
  factorDefinitions?: FactorDefinition[];
};
