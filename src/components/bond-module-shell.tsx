"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/card";
import { BondAnalyticsSection } from "@/components/bonds/bond-analytics-section";
import { BondMarketMonitorSection } from "@/components/bonds/bond-market-monitor-section";
import { BondPricingSection } from "@/components/bonds/bond-pricing-section";
import { BondSectionTabs } from "@/components/bonds/bond-section-tabs";
import type {
  BondChartModel,
  BondFormErrors,
  BondFormState,
  BondsSectionId,
} from "@/components/bonds/types";
import { buildBondYieldSpreadRows } from "@/lib/bonds/analytics";
import { getBondRegistry } from "@/lib/bonds/registry";
import type {
  BondExplorerRecord,
  BondMarketDataRouteResponse,
  BondMarketExplorerPayload,
} from "@/lib/bonds/types";
import {
  calculateFixedRateBondAnalytics,
  type FixedRateBondAnalytics,
  type FixedRateBondInput,
} from "@/lib/finance/bonds";
import { parseTickerInput } from "@/lib/market-data/request";
import type { MarketDataPeriod } from "@/lib/market-data/types";

const DEFAULT_FORM: BondFormState = {
  faceValue: "1000",
  couponRate: "0.05",
  yieldToMaturity: "0.045",
  yearsToMaturity: "5",
  paymentsPerYear: "2",
};

const SERIES_COLORS = ["#7dd3fc", "#38bdf8", "#22d3ee", "#a78bfa", "#f59e0b"];
const DEFAULT_SYMBOL_INPUT = "US2Y, US5Y, US10Y";
const DEFAULT_BENCHMARK_SYMBOL = "US10Y";
const DEFAULT_PERIOD: MarketDataPeriod = "6M";
const REGISTRY_OPTIONS = getBondRegistry();

export function BondModuleShell() {
  const [activeSection, setActiveSection] =
    useState<BondsSectionId>("pricing");
  const [form, setForm] = useState<BondFormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<BondFormErrors>({});
  const [analytics, setAnalytics] =
    useState<FixedRateBondAnalytics>(createInitialAnalytics);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  const [symbolInput, setSymbolInput] = useState(DEFAULT_SYMBOL_INPUT);
  const [period, setPeriod] = useState<MarketDataPeriod>(DEFAULT_PERIOD);
  const [benchmarkSymbol, setBenchmarkSymbol] = useState(DEFAULT_BENCHMARK_SYMBOL);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [marketData, setMarketData] = useState<BondMarketExplorerPayload | null>(null);

  useEffect(() => {
    void loadBondMarketData(DEFAULT_SYMBOL_INPUT, DEFAULT_PERIOD);
  }, []);

  async function loadBondMarketData(
    nextSymbolInput: string,
    nextPeriod: MarketDataPeriod,
  ) {
    const parsed = parseTickerInput(nextSymbolInput);

    if (!parsed.tickers) {
      setValidationError(parsed.error ?? "Enter valid bond symbols.");
      setRequestError(null);
      setMarketData(null);
      setIsLoading(false);
      return;
    }

    setValidationError(null);
    setRequestError(null);
    setIsLoading(true);

    try {
      const url = new URL("/api/bond-market-data", window.location.origin);

      url.searchParams.set("symbols", parsed.tickers.join(","));
      url.searchParams.set("period", nextPeriod);

      const response = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as BondMarketDataRouteResponse;

      if (!payload.ok) {
        throw new Error(payload.error);
      }

      setMarketData(payload.data);
    } catch (error) {
      setMarketData(null);
      setRequestError(
        error instanceof Error
          ? error.message
          : "Unable to load bond market data right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function updateField(name: keyof BondFormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      return { ...current, [name]: undefined };
    });
    setCalculationError(null);
  }

  function handlePricingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = parseForm(form);

    if (!parsed.values) {
      setErrors(parsed.errors);
      setCalculationError("Please correct the highlighted bond inputs.");
      return;
    }

    try {
      setErrors({});
      setAnalytics(calculateFixedRateBondAnalytics(parsed.values));
      setCalculationError(null);
    } catch (error) {
      setCalculationError(
        error instanceof Error ? error.message : "Unable to value bond.",
      );
    }
  }

  function handlePricingReset() {
    setForm(DEFAULT_FORM);
    setErrors({});
    setAnalytics(createInitialAnalytics());
    setCalculationError(null);
  }

  function handleMarketSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadBondMarketData(symbolInput, period);
  }

  const displayCashFlows = useMemo(
    () => buildDisplayCashFlows(analytics),
    [analytics],
  );

  const inputHint = useMemo(() => {
    const parsed = parseTickerInput(symbolInput);

    if (!parsed.tickers) {
      return "Enter 1 to 5 comma-separated bond symbols.";
    }

    return `Tracking ${parsed.tickers.length} unique symbol${
      parsed.tickers.length === 1 ? "" : "s"
    }: ${parsed.tickers.join(", ")}`;
  }, [symbolInput]);

  const selectedSymbols = useMemo(() => {
    const parsed = parseTickerInput(symbolInput);

    return parsed.tickers ?? [];
  }, [symbolInput]);

  const selectedRegistryEntries = useMemo(() => {
    return selectedSymbols
      .map((symbol) =>
        REGISTRY_OPTIONS.find((entry) => entry.symbol === symbol),
      )
      .filter((entry): entry is (typeof REGISTRY_OPTIONS)[number] => Boolean(entry))
      .map((entry) => ({
        symbol: entry.symbol,
        marketSymbol: entry.providerSymbol ?? entry.symbol,
        metadataStatus: "available" as const,
        metadataSource: "local-registry" as const,
        metadata: entry,
      }));
  }, [selectedSymbols]);

  const yieldSpreadRows = useMemo(() => {
    if (!marketData) {
      return [];
    }

    return buildBondYieldSpreadRows({
      bonds: marketData.bonds,
      marketData: marketData.marketData,
      benchmarkSymbol,
    });
  }, [benchmarkSymbol, marketData]);

  const benchmarkAvailableInSelection = useMemo(() => {
    return Boolean(
      marketData?.bonds.some((bond) => bond.symbol === benchmarkSymbol),
    );
  }, [benchmarkSymbol, marketData]);

  const marketStatusItems = useMemo(() => {
    if (!marketData) {
      return [];
    }

    return [
      {
        label: "Common start",
        value: formatDateLabel(marketData.marketData.meta.commonStartDate),
      },
      {
        label: "Common end",
        value: formatDateLabel(marketData.marketData.meta.commonEndDate),
      },
      {
        label: "Observations",
        value: marketData.marketData.meta.observations.toString(),
      },
      {
        label: "Metadata found",
        value: marketData.meta.metadataAvailable.toString(),
      },
    ];
  }, [marketData]);

  const marketCharts = useMemo<BondChartModel[]>(() => {
    if (!marketData) {
      return [];
    }

    const dates = marketData.marketData.points.map((point) => point.date);
    const buildSeries = (
      key: "normalized" | "cumulativeReturns" | "drawdowns",
    ) =>
      marketData.marketData.tickers.map((ticker, index) => ({
        label: ticker,
        values: marketData.marketData.points.map((point) => point[key][ticker]),
        color: SERIES_COLORS[index % SERIES_COLORS.length],
      }));

    return [
      {
        title: "Normalized Price",
        description: "Each bond series starts at 100 on the first shared day in the selected period.",
        dates,
        series: buildSeries("normalized"),
        valueFormatter: (value) => value.toFixed(1),
      },
      {
        title: "Cumulative Return",
        description: "Total return from the shared starting point of the aligned market series.",
        dates,
        series: buildSeries("cumulativeReturns"),
        valueFormatter: formatSignedPercent,
      },
      {
        title: "Drawdown",
        description: "Peak-to-trough decline from each bond series' running high.",
        dates,
        series: buildSeries("drawdowns"),
        valueFormatter: formatSignedPercent,
      },
    ];
  }, [marketData]);

  const marketMetricRows = useMemo(() => {
    if (!marketData) {
      return [];
    }

    return marketData.marketData.metrics.map((metric) => {
      const bond = marketData.bonds.find((entry) => entry.symbol === metric.ticker);

      return {
        symbol: metric.ticker,
        observations: metric.observations,
        displayName: bond?.metadata?.displayName ?? "No local metadata",
        totalReturn: formatSignedPercent(metric.totalReturn),
        annualizedReturn: formatSignedPercent(metric.annualizedReturn),
        annualizedVolatility: formatUnsignedPercent(metric.annualizedVolatility),
        maxDrawdown: formatSignedPercent(metric.maxDrawdown),
      };
    });
  }, [marketData]);

  const registryCards = useMemo<BondExplorerRecord[]>(() => {
    return marketData?.bonds ?? REGISTRY_OPTIONS.slice(0, 3).map((entry) => ({
      symbol: entry.symbol,
      marketSymbol: entry.providerSymbol ?? entry.symbol,
      metadataStatus: "available" as const,
      metadataSource: "local-registry" as const,
      metadata: entry,
    }));
  }, [marketData]);

  return (
    <section className="space-y-4">
      <Card
        eyebrow="Fixed Income Workspace"
        title="Separate manual bond pricing, analytics, and market monitoring into clearer workflows"
        description="Run the manual fixed-rate bond calculator first, review duration and cash flow analytics second, and keep fetched market monitoring as a secondary layer."
      />

      <BondSectionTabs
        activeSection={activeSection}
        onChange={setActiveSection}
      />

      {activeSection === "pricing" ? (
        <BondPricingSection
          analytics={analytics}
          calculationError={calculationError}
          errors={errors}
          form={form}
          onReset={handlePricingReset}
          onSubmit={handlePricingSubmit}
          onUpdateField={updateField}
        />
      ) : null}

      {activeSection === "analytics" ? (
        <BondAnalyticsSection
          analytics={analytics}
          cashFlowRows={displayCashFlows}
        />
      ) : null}

      {activeSection === "market-monitor" ? (
        <BondMarketMonitorSection
          benchmarkAvailableInSelection={benchmarkAvailableInSelection}
          benchmarkSymbol={benchmarkSymbol}
          data={marketData}
          inputHint={inputHint}
          isLoading={isLoading}
          marketCharts={marketCharts}
          marketMetricRows={marketMetricRows}
          period={period}
          registryCards={registryCards}
          requestError={requestError}
          selectedRegistryEntries={selectedRegistryEntries}
          statusItems={marketStatusItems}
          symbolInput={symbolInput}
          validationError={validationError}
          yieldSpreadRows={yieldSpreadRows}
          onBenchmarkChange={setBenchmarkSymbol}
          onPeriodChange={setPeriod}
          onSubmit={handleMarketSubmit}
          onSymbolInputChange={(value) => {
            setSymbolInput(value);
            setValidationError(null);
          }}
        />
      ) : null}
    </section>
  );
}

function parsePositiveNumber(
  value: string,
  label: string,
): { value?: number; error?: string } {
  if (value.trim() === "") {
    return { error: `${label} is required` };
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return { error: `${label} must be a valid number` };
  }

  if (parsed <= 0) {
    return { error: `${label} must be positive` };
  }

  return { value: parsed };
}

function parseNonNegativeNumber(
  value: string,
  label: string,
): { value?: number; error?: string } {
  if (value.trim() === "") {
    return { error: `${label} is required` };
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return { error: `${label} must be a valid number` };
  }

  if (parsed < 0) {
    return { error: `${label} cannot be negative` };
  }

  return { value: parsed };
}

function parsePositiveInteger(
  value: string,
  label: string,
): { value?: number; error?: string } {
  if (value.trim() === "") {
    return { error: `${label} is required` };
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return { error: `${label} must be a valid number` };
  }

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: `${label} must be a positive integer` };
  }

  return { value: parsed };
}

function parseForm(form: BondFormState): {
  errors: BondFormErrors;
  values?: FixedRateBondInput;
} {
  const errors: BondFormErrors = {};

  const faceValue = parsePositiveNumber(form.faceValue, "Face value");
  const couponRate = parseNonNegativeNumber(form.couponRate, "Coupon rate");
  const yieldToMaturity = parseNonNegativeNumber(
    form.yieldToMaturity,
    "Yield to maturity",
  );
  const yearsToMaturity = parsePositiveNumber(
    form.yearsToMaturity,
    "Years to maturity",
  );
  const paymentsPerYear = parsePositiveInteger(
    form.paymentsPerYear,
    "Payments per year",
  );

  if (faceValue.error) errors.faceValue = faceValue.error;
  if (couponRate.error) errors.couponRate = couponRate.error;
  if (yieldToMaturity.error) errors.yieldToMaturity = yieldToMaturity.error;
  if (yearsToMaturity.error) errors.yearsToMaturity = yearsToMaturity.error;
  if (paymentsPerYear.error) errors.paymentsPerYear = paymentsPerYear.error;

  if (
    yearsToMaturity.value !== undefined &&
    paymentsPerYear.value !== undefined &&
    !Number.isInteger(yearsToMaturity.value * paymentsPerYear.value)
  ) {
    errors.yearsToMaturity =
      "Years to maturity must produce a whole number of coupon periods.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors,
    values: {
      faceValue: faceValue.value as number,
      couponRate: couponRate.value as number,
      yieldToMaturity: yieldToMaturity.value as number,
      yearsToMaturity: yearsToMaturity.value as number,
      paymentsPerYear: paymentsPerYear.value as number,
    },
  };
}

function createInitialAnalytics(): FixedRateBondAnalytics {
  const parsed = parseForm(DEFAULT_FORM);

  if (!parsed.values) {
    throw new Error("Default bond values must be valid.");
  }

  return calculateFixedRateBondAnalytics(parsed.values);
}

function buildDisplayCashFlows(analytics: FixedRateBondAnalytics) {
  if (analytics.cashFlows.length <= 4) {
    return analytics.cashFlows;
  }

  return [
    analytics.cashFlows[0],
    analytics.cashFlows[1],
    analytics.cashFlows[analytics.cashFlows.length - 2],
    analytics.cashFlows[analytics.cashFlows.length - 1],
  ];
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

function formatUnsignedPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
