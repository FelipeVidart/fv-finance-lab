import type { FormEvent } from "react";
import type { PortfolioAnalytics } from "@/lib/finance/portfolio";
import type {
  MarketDataExplorerPayload,
  MarketDataPeriod,
} from "@/lib/market-data/types";
import type { LineChartSeries } from "@/components/line-chart-panel";

export type RiskSectionId = "setup" | "asset-analytics" | "portfolio-analytics";

export type WeightState = Record<string, string>;

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
  data: MarketDataExplorerPayload | null;
  inputHint: string;
  isLoading: boolean;
  period: MarketDataPeriod;
  requestError: string | null;
  statusItems: DatasetStatusItem[];
  tickerInput: string;
  validationError: string | null;
  weightInputs: WeightState;
  weightValidation: WeightValidationState | null;
  onApplyEqualWeights: () => void;
  onPeriodChange: (period: MarketDataPeriod) => void;
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
  holdings: PortfolioHoldingRow[];
  portfolioAnalytics: PortfolioAnalytics | null;
  portfolioCharts: RiskChartModel[];
  portfolioKpis: DatasetStatusItem[];
  weightValidation: WeightValidationState | null;
};
