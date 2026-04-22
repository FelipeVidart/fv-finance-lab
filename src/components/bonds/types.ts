import type { FormEvent } from "react";
import type {
  BondExplorerRecord,
  BondMarketExplorerPayload,
  BondYieldSpreadRow,
} from "@/lib/bonds/types";
import type {
  BondTradingStatus,
  FixedRateBondAnalytics,
} from "@/lib/finance/bonds";
import type { MarketDataPeriod } from "@/lib/market-data/types";
import type { LineChartSeries } from "@/components/line-chart-panel";

export type BondsSectionId = "pricing" | "analytics" | "market-monitor";

export type BondFormState = {
  faceValue: string;
  couponRate: string;
  yieldToMaturity: string;
  yearsToMaturity: string;
  paymentsPerYear: string;
};

export type BondFormErrors = Partial<Record<keyof BondFormState, string>>;

export type BondMetricItem = {
  label: string;
  value: string;
  tone?: "default" | "positive" | "warning" | "muted";
};

export type BondStatusItem = {
  label: string;
  value: string;
};

export type BondChartModel = {
  title: string;
  description: string;
  dates: string[];
  series: LineChartSeries[];
  valueFormatter: (value: number) => string;
};

export type BondPricingSectionProps = {
  analytics: FixedRateBondAnalytics;
  calculationError: string | null;
  errors: BondFormErrors;
  form: BondFormState;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateField: (name: keyof BondFormState, value: string) => void;
};

export type BondAnalyticsSectionProps = {
  analytics: FixedRateBondAnalytics;
  cashFlowRows: FixedRateBondAnalytics["cashFlows"];
};

export type BondMarketMonitorSectionProps = {
  benchmarkAvailableInSelection: boolean;
  benchmarkSymbol: string;
  data: BondMarketExplorerPayload | null;
  inputHint: string;
  isLoading: boolean;
  marketCharts: BondChartModel[];
  marketMetricRows: Array<{
    symbol: string;
    observations: number;
    displayName: string;
    totalReturn: string;
    annualizedReturn: string;
    annualizedVolatility: string;
    maxDrawdown: string;
  }>;
  period: MarketDataPeriod;
  registryCards: BondExplorerRecord[];
  requestError: string | null;
  selectedRegistryEntries: BondExplorerRecord[];
  statusItems: BondStatusItem[];
  symbolInput: string;
  validationError: string | null;
  yieldSpreadRows: BondYieldSpreadRow[];
  onBenchmarkChange: (value: string) => void;
  onPeriodChange: (period: MarketDataPeriod) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSymbolInputChange: (value: string) => void;
};

export type TradingStateToneMap = Record<BondTradingStatus, BondMetricItem["tone"]>;
