"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/card";
import { RiskAssetAnalyticsSection } from "@/components/risk/risk-asset-analytics-section";
import { RiskPortfolioAnalyticsSection } from "@/components/risk/risk-portfolio-analytics-section";
import { RiskSectionTabs } from "@/components/risk/risk-section-tabs";
import { RiskSetupSection } from "@/components/risk/risk-setup-section";
import type {
  RiskChartModel,
  RiskSectionId,
  WeightState,
  WeightValidationState,
} from "@/components/risk/types";
import { buildPortfolioAnalytics } from "@/lib/finance/portfolio";
import { parseTickerInput } from "@/lib/market-data/request";
import type {
  MarketDataExplorerPayload,
  MarketDataPeriod,
  MarketDataRouteResponse,
} from "@/lib/market-data/types";

const SERIES_COLORS = ["#7dd3fc", "#38bdf8", "#22d3ee", "#a78bfa", "#f59e0b"];
const PORTFOLIO_COLOR = "#f59e0b";
const DEFAULT_TICKER_INPUT = "AAPL, MSFT, NVDA";
const DEFAULT_PERIOD: MarketDataPeriod = "6M";

export function RiskModuleShell() {
  const [tickerInput, setTickerInput] = useState(DEFAULT_TICKER_INPUT);
  const [period, setPeriod] = useState<MarketDataPeriod>(DEFAULT_PERIOD);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<MarketDataExplorerPayload | null>(null);
  const [weightInputs, setWeightInputs] = useState<WeightState>({});
  const [activeSection, setActiveSection] = useState<RiskSectionId>("setup");

  useEffect(() => {
    void loadMarketData(DEFAULT_TICKER_INPUT, DEFAULT_PERIOD);
  }, []);

  async function loadMarketData(
    nextTickerInput: string,
    nextPeriod: MarketDataPeriod,
  ) {
    const parsed = parseTickerInput(nextTickerInput);

    if (!parsed.tickers) {
      setValidationError(parsed.error ?? "Enter valid tickers.");
      setRequestError(null);
      setData(null);
      setWeightInputs({});
      setIsLoading(false);
      return;
    }

    setValidationError(null);
    setRequestError(null);
    setIsLoading(true);

    try {
      const url = new URL("/api/market-data", window.location.origin);

      url.searchParams.set("tickers", parsed.tickers.join(","));
      url.searchParams.set("period", nextPeriod);

      const response = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as MarketDataRouteResponse;

      if (!payload.ok) {
        throw new Error(payload.error);
      }

      setData(payload.data);
      setWeightInputs(createEqualWeightInputs(payload.data.tickers));
      setActiveSection("setup");
    } catch (error) {
      setData(null);
      setWeightInputs({});
      setRequestError(
        error instanceof Error
          ? error.message
          : "Unable to load market data right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadMarketData(tickerInput, period);
  }

  function handleTickerInputChange(value: string) {
    setTickerInput(value);
    setValidationError(null);
  }

  function handleWeightInputChange(ticker: string, value: string) {
    setWeightInputs((current) => ({ ...current, [ticker]: value }));
  }

  function handleApplyEqualWeights() {
    if (!data) {
      return;
    }

    setWeightInputs(createEqualWeightInputs(data.tickers));
  }

  const inputHint = useMemo(() => {
    const parsed = parseTickerInput(tickerInput);

    if (!parsed.tickers) {
      return "Enter 1 to 5 comma-separated tickers.";
    }

    return `Tracking ${parsed.tickers.length} unique ticker${
      parsed.tickers.length === 1 ? "" : "s"
    }: ${parsed.tickers.join(", ")}`;
  }, [tickerInput]);

  const weightValidation = useMemo<WeightValidationState | null>(() => {
    if (!data) {
      return null;
    }

    let totalPercent = 0;
    const parsedWeights: Record<string, number> = {};

    for (const ticker of data.tickers) {
      const rawValue = weightInputs[ticker];

      if (rawValue === undefined || rawValue.trim() === "") {
        return {
          isValid: false,
          error: "Enter a numeric weight for each selected ticker.",
          totalPercent,
          weights: null,
        };
      }

      const parsed = Number(rawValue);

      if (!Number.isFinite(parsed)) {
        return {
          isValid: false,
          error: "Weights must be numeric.",
          totalPercent,
          weights: null,
        };
      }

      if (parsed < 0) {
        return {
          isValid: false,
          error: "Weights cannot be negative.",
          totalPercent,
          weights: null,
        };
      }

      totalPercent += parsed;
      parsedWeights[ticker] = parsed / 100;
    }

    if (Math.abs(totalPercent - 100) > 0.05) {
      return {
        isValid: false,
        error: `Portfolio weights must sum to 100%. Current total: ${totalPercent.toFixed(
          2,
        )}%.`,
        totalPercent,
        weights: null,
      };
    }

    return {
      isValid: true,
      error: null,
      totalPercent,
      weights: parsedWeights,
    };
  }, [data, weightInputs]);

  const portfolioAnalytics = useMemo(() => {
    if (!data || !weightValidation?.isValid || !weightValidation.weights) {
      return null;
    }

    try {
      return buildPortfolioAnalytics({
        data,
        weights: weightValidation.weights,
      });
    } catch {
      return null;
    }
  }, [data, weightValidation]);

  const datasetStatusItems = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        label: "Common start",
        value: formatDateLabel(data.meta.commonStartDate),
      },
      {
        label: "Common end",
        value: formatDateLabel(data.meta.commonEndDate),
      },
      {
        label: "Observations",
        value: data.meta.observations.toString(),
      },
      {
        label: "Loaded tickers",
        value: data.tickers.length.toString(),
      },
    ];
  }, [data]);

  const assetCharts = useMemo<RiskChartModel[]>(() => {
    if (!data) {
      return [];
    }

    const dates = data.points.map((point) => point.date);
    const buildSeries = (
      key: "normalized" | "cumulativeReturns" | "drawdowns",
    ) =>
      data.tickers.map((ticker, index) => ({
        label: ticker,
        values: data.points.map((point) => point[key][ticker]),
        color: SERIES_COLORS[index % SERIES_COLORS.length],
      }));

    return [
      {
        title: "Normalized Price",
        description: "Each line starts at 100 on the first shared trading day.",
        dates,
        series: buildSeries("normalized"),
        valueFormatter: (value) => value.toFixed(1),
      },
      {
        title: "Cumulative Return",
        description: "Total return since the shared start date.",
        dates,
        series: buildSeries("cumulativeReturns"),
        valueFormatter: formatPercent,
      },
      {
        title: "Drawdown",
        description: "Peak-to-trough decline from each ticker's running high.",
        dates,
        series: buildSeries("drawdowns"),
        valueFormatter: formatPercent,
      },
    ];
  }, [data]);

  const assetMetricRows = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.metrics.map((metric) => ({
      ticker: metric.ticker,
      observations: metric.observations,
      totalReturnDisplay: formatPercent(metric.totalReturn),
      annualizedReturnDisplay: formatPercent(metric.annualizedReturn),
      annualizedVolatilityDisplay: formatPercent(metric.annualizedVolatility),
      maxDrawdownDisplay: formatPercent(metric.maxDrawdown),
    }));
  }, [data]);

  const portfolioKpis = useMemo(() => {
    if (!portfolioAnalytics) {
      return [];
    }

    return [
      {
        label: "Portfolio return",
        value: formatPercent(portfolioAnalytics.metrics.totalReturn),
      },
      {
        label: "Annualized return",
        value: formatPercent(portfolioAnalytics.metrics.annualizedReturn),
      },
      {
        label: "Annualized vol",
        value: formatPercent(portfolioAnalytics.metrics.annualizedVolatility),
      },
      {
        label: "Max drawdown",
        value: formatPercent(portfolioAnalytics.metrics.maxDrawdown),
      },
    ];
  }, [portfolioAnalytics]);

  const portfolioCharts = useMemo<RiskChartModel[]>(() => {
    if (!data || !portfolioAnalytics) {
      return [];
    }

    const portfolioDates = portfolioAnalytics.points.map((point) => point.date);
    const comparisonSeries = [
      {
        label: "Portfolio",
        values: portfolioAnalytics.points.map((point) => point.cumulativeReturn),
        color: PORTFOLIO_COLOR,
      },
      ...data.tickers.map((ticker, index) => ({
        label: ticker,
        values: data.points.map((point) => point.cumulativeReturns[ticker]),
        color: SERIES_COLORS[index % SERIES_COLORS.length],
      })),
    ];

    return [
      {
        title: "Portfolio NAV",
        description: "Normalized portfolio NAV built from the weighted daily return series.",
        dates: portfolioDates,
        series: [
          {
            label: "Portfolio",
            values: portfolioAnalytics.points.map((point) => point.nav),
            color: PORTFOLIO_COLOR,
          },
        ],
        valueFormatter: (value) => value.toFixed(1),
      },
      {
        title: "Portfolio Drawdown",
        description: "Running drawdown of the portfolio NAV.",
        dates: portfolioDates,
        series: [
          {
            label: "Portfolio",
            values: portfolioAnalytics.points.map((point) => point.drawdown),
            color: PORTFOLIO_COLOR,
          },
        ],
        valueFormatter: formatPercent,
      },
      {
        title: "Portfolio vs Assets",
        description: "Portfolio cumulative return compared with the currently selected assets.",
        dates: portfolioDates,
        series: comparisonSeries,
        valueFormatter: formatPercent,
      },
    ];
  }, [data, portfolioAnalytics]);

  const holdings = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.metrics.map((metric) => ({
      ticker: metric.ticker,
      observations: metric.observations,
      latestPriceDisplay: formatNumber(metric.endPrice),
      totalReturnDisplay: formatPercent(metric.totalReturn),
      weightDisplay: weightValidation?.weights
        ? `${(weightValidation.weights[metric.ticker] * 100).toFixed(2)}%`
        : "Pending validation",
    }));
  }, [data, weightValidation]);

  return (
    <section className="space-y-4">
      <Card
        eyebrow="Risk Workspace"
        title="Separate setup, asset review, and portfolio review into a clearer workflow"
        description="Load a shared market dataset first, inspect asset-level behavior second, and move into weighted portfolio analytics only when the sandbox is ready."
      />

      <RiskSectionTabs
        activeSection={activeSection}
        onChange={setActiveSection}
      />

      {activeSection === "setup" ? (
        <RiskSetupSection
          data={data}
          inputHint={inputHint}
          isLoading={isLoading}
          period={period}
          requestError={requestError}
          statusItems={datasetStatusItems}
          tickerInput={tickerInput}
          validationError={validationError}
          weightInputs={weightInputs}
          weightValidation={weightValidation}
          onApplyEqualWeights={handleApplyEqualWeights}
          onPeriodChange={setPeriod}
          onSubmit={handleSubmit}
          onTickerInputChange={handleTickerInputChange}
          onWeightInputChange={handleWeightInputChange}
        />
      ) : null}

      {activeSection === "asset-analytics" ? (
        <RiskAssetAnalyticsSection
          data={data}
          charts={assetCharts}
          metricRows={assetMetricRows}
        />
      ) : null}

      {activeSection === "portfolio-analytics" ? (
        <RiskPortfolioAnalyticsSection
          data={data}
          holdings={holdings}
          portfolioAnalytics={portfolioAnalytics}
          portfolioCharts={portfolioCharts}
          portfolioKpis={portfolioKpis}
          weightValidation={weightValidation}
        />
      ) : null}
    </section>
  );
}

function createEqualWeightInputs(tickers: string[]): WeightState {
  if (tickers.length === 0) {
    return {};
  }

  const baseWeight = Math.floor((100 / tickers.length) * 100) / 100;
  const weights = tickers.map((_, index) =>
    index === tickers.length - 1
      ? Number((100 - baseWeight * (tickers.length - 1)).toFixed(2))
      : baseWeight,
  );

  return Object.fromEntries(
    tickers.map((ticker, index) => [ticker, weights[index].toFixed(2)]),
  );
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
