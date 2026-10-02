import type { FormEvent } from "react";
import type { PortfolioAnalytics } from "@/lib/finance/portfolio";
import type {
  ArgentineInstrumentContextAnalysis,
  ArgentineInstrumentFamilyId,
  CurrentVsProposedRiskComparison,
  FactorGradVarAnalysis,
  PortfolioScenarioAnalysis,
  PortfolioRiskAnalysis,
} from "@/lib/finance/risk/types";
import type {
  PortfolioConfidenceLevel,
  PortfolioValueCurrency,
  PortfolioValueValidation,
} from "@/lib/finance/risk/portfolio-risk-analyzer";
import type {
  MarketDataExplorerPayload,
  MarketDataPeriod,
  MarketDataProviderMode,
} from "@/lib/market-data/types";
import type {
  ProviderSelectorOption,
  SafeProviderConfig,
} from "@/lib/market-data/provider-config";
import type { LineChartSeries } from "@/components/line-chart-panel";

export type RiskSectionId = "setup" | "asset-analytics" | "portfolio-analytics";

export type WeightState = Record<string, string>;

export type ArgentineInstrumentFamilyState = Record<
  string,
  ArgentineInstrumentFamilyId
>;

export type WeightValidationState = {
  isValid: boolean;
  error: string | null;
  totalPercent: number;
  weights: Record<string, number> | null;
};

export type DatasetStatusItem = {
  label: string;
  value: string;
};

export type RiskChartModel = {
  title: string;
  description: string;
  dates: string[];
  series: LineChartSeries[];
  valueFormatter: (value: number) => string;
};

export type AssetMetricRow = {
  ticker: string;
  observations: number;
  totalReturnDisplay: string;
  annualizedReturnDisplay: string;
  annualizedVolatilityDisplay: string;
  maxDrawdownDisplay: string;
};

export type PortfolioHoldingRow = {
  ticker: string;
  observations: number;
  latestPriceDisplay: string;
  totalReturnDisplay: string;
  weightDisplay: string;
};

export type RiskSetupSectionProps = {
  confidenceLevel: PortfolioConfidenceLevel;
  currency: PortfolioValueCurrency;
  data: MarketDataExplorerPayload | null;
  inputHint: string;
  isLoading: boolean;
  period: MarketDataPeriod;
  provider: MarketDataProviderMode;
  providerConfigs: SafeProviderConfig[];
  providerSelectorOptions: ProviderSelectorOption[];
  proposedWeightInputs: WeightState;
  proposedWeightValidation: WeightValidationState | null;
  requestError: string | null;
  statusItems: DatasetStatusItem[];
  tickerInput: string;
  validationError: string | null;
  portfolioValueInput: string;
  portfolioValueValidation: PortfolioValueValidation;
  argentineInstrumentFamilies: ArgentineInstrumentFamilyState;
  weightInputs: WeightState;
  weightValidation: WeightValidationState | null;
  onApplyEqualWeights: () => void;
  onArgentineInstrumentFamilyChange: (
    ticker: string,
    familyId: ArgentineInstrumentFamilyId,
  ) => void;
  onConfidenceLevelChange: (confidenceLevel: PortfolioConfidenceLevel) => void;
  onCurrencyChange: (currency: PortfolioValueCurrency) => void;
  onPeriodChange: (period: MarketDataPeriod) => void;
  onPortfolioValueInputChange: (value: string) => void;
  onProviderChange: (provider: MarketDataProviderMode) => void;
  onProposedWeightInputChange: (ticker: string, value: string) => void;
  onApplyCurrentWeightsToProposed: () => void;
  onApplyEqualProposedWeights: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTickerInputChange: (value: string) => void;
  onWeightInputChange: (ticker: string, value: string) => void;
};

export type RiskAssetAnalyticsSectionProps = {
  data: MarketDataExplorerPayload | null;
  charts: RiskChartModel[];
  metricRows: AssetMetricRow[];
};

export type RiskPortfolioAnalyticsSectionProps = {
  data: MarketDataExplorerPayload | null;
  factorGradVarAnalysis: FactorGradVarAnalysis | null;
  factorGradVarError: string | null;
  factorGradVarLoading: boolean;
  currentVsProposedComparison: CurrentVsProposedRiskComparison | null;
  argentineInstrumentContext: ArgentineInstrumentContextAnalysis | null;
  holdings: PortfolioHoldingRow[];
  portfolioAnalytics: PortfolioAnalytics | null;
  portfolioCharts: RiskChartModel[];
  portfolioKpis: DatasetStatusItem[];
  portfolioRiskAnalysis: PortfolioRiskAnalysis | null;
  scenarioAnalysis: PortfolioScenarioAnalysis | null;
  portfolioValue: number | null;
  presentationCurrency: PortfolioValueCurrency;
  riskKpis: DatasetStatusItem[];
  weightValidation: WeightValidationState | null;
};
