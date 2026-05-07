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
