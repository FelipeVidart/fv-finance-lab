"use client";

import { useEffect, useMemo, useState } from "react";
import { RiskAssetAnalyticsSection } from "@/components/risk/risk-asset-analytics-section";
import { RiskPortfolioAnalyticsSection } from "@/components/risk/risk-portfolio-analytics-section";
import { RiskSectionTabs } from "@/components/risk/risk-section-tabs";
import { FundLookThroughSection } from "@/components/risk/fund-look-through-section";
import { RiskSetupSection } from "@/components/risk/risk-setup-section";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
import {
  buildArgentineInstrumentContextAnalysis,
  buildDefaultArgentineInstrumentFamilyMap,
} from "@/lib/finance/risk/argentina-instruments";
import type {
  ArgentineInstrumentFamilyState,
  RiskChartModel,
  RiskSectionId,
  WeightState,
  WeightValidationState,
} from "@/components/risk/types";
import { buildPortfolioAnalytics } from "@/lib/finance/portfolio";
import {
  DEFAULT_FACTOR_DEFINITIONS,
  buildFactorGradVarAnalysis,
} from "@/lib/finance/risk/factor-gradvar";
import { buildCurrentVsProposedRiskComparison } from "@/lib/finance/risk/current-vs-proposed";
import { buildPortfolioRiskAnalysis } from "@/lib/finance/risk/portfolio-risk-analysis";
import { buildPortfolioScenarioAnalysis } from "@/lib/finance/risk/scenario-analysis";
import {
  calculateMoneyAtRisk,
  validateConfidenceLevel,
  validatePortfolioValueInput,
  validateWeightPercentInputs,
  type PortfolioConfidenceLevel,
  type PortfolioValueCurrency,
} from "@/lib/finance/risk/portfolio-risk-analyzer";
import type { ArgentineInstrumentFamilyId } from "@/lib/finance/risk/types";
import { loadMarketDataExplorer } from "@/lib/market-data/client";
import { parseTickerInput } from "@/lib/market-data/request";
import type {
  MarketDataExplorerPayload,
  MarketDataPeriod,
  MarketDataProviderMode,
  MarketDataRouteResponse,
} from "@/lib/market-data/types";
import type {
  ProviderSelectorOption,
  SafeProviderConfig,
} from "@/lib/market-data/provider-config";

const SERIES_COLORS = ["#d2ab67", "#7f95b3", "#608aa7", "#7f709d", "#5f8b7e"];
const PORTFOLIO_COLOR = "#e2b86b";
const FACTOR_PROXY_TICKERS = DEFAULT_FACTOR_DEFINITIONS.map(
  (factor) => factor.proxyTicker,
);
const DEFAULT_TICKER_INPUT = "AAPL, MSFT, NVDA";
const DEFAULT_PERIOD: MarketDataPeriod = "6M";
const DEFAULT_PROVIDER: MarketDataProviderMode = "auto";
const DEFAULT_PORTFOLIO_VALUE = "100000";
const DEFAULT_CURRENCY: PortfolioValueCurrency = "USD";
const DEFAULT_CONFIDENCE_LEVEL: PortfolioConfidenceLevel = 0.95;

type FactorDataState = {
  data: MarketDataExplorerPayload | null;
  error: string | null;
  requestKey: string | null;
};

export function RiskModuleShell({
  providerConfigs,
  providerSelectorOptions,
}: {
  providerConfigs: SafeProviderConfig[];
  providerSelectorOptions: ProviderSelectorOption[];
}) {
  const [tickerInput, setTickerInput] = useState(DEFAULT_TICKER_INPUT);
  const [period, setPeriod] = useState<MarketDataPeriod>(DEFAULT_PERIOD);
  const [provider, setProvider] =
    useState<MarketDataProviderMode>(DEFAULT_PROVIDER);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<MarketDataExplorerPayload | null>(null);
  const [loadedProvider, setLoadedProvider] =
    useState<MarketDataProviderMode | null>(null);
  const [factorDataState, setFactorDataState] = useState<FactorDataState>({
    data: null,
    error: null,
    requestKey: null,
  });
  const [weightInputs, setWeightInputs] = useState<WeightState>({});
  const [proposedWeightInputs, setProposedWeightInputs] = useState<WeightState>(
    {},
  );
  const [argentineInstrumentFamilies, setArgentineInstrumentFamilies] =
    useState<ArgentineInstrumentFamilyState>({});
  const [portfolioValueInput, setPortfolioValueInput] = useState(
    DEFAULT_PORTFOLIO_VALUE,
  );
  const [currency, setCurrency] =
    useState<PortfolioValueCurrency>(DEFAULT_CURRENCY);
  const [confidenceLevel, setConfidenceLevel] =
    useState<PortfolioConfidenceLevel>(DEFAULT_CONFIDENCE_LEVEL);
  const [activeSection, setActiveSection] = useState<RiskSectionId>("setup");

  useEffect(() => {
    void loadMarketData(DEFAULT_TICKER_INPUT, DEFAULT_PERIOD, DEFAULT_PROVIDER);
  }, []);

  async function loadMarketData(
    nextTickerInput: string,
    nextPeriod: MarketDataPeriod,
    nextProvider: MarketDataProviderMode,
  ) {
    const parsed = parseTickerInput(nextTickerInput);

    if (!parsed.tickers) {
      setValidationError(parsed.error ?? "Enter valid tickers.");
      setRequestError(null);
      setData(null);
      setLoadedProvider(null);
      setFactorDataState({ data: null, error: null, requestKey: null });
      setWeightInputs({});
      setProposedWeightInputs({});
      setArgentineInstrumentFamilies({});
      setIsLoading(false);
      return;
    }

    setValidationError(null);
    setRequestError(null);
    setIsLoading(true);
    setFactorDataState({ data: null, error: null, requestKey: null });

    try {
      const url = new URL("/api/market-data", window.location.origin);

      url.searchParams.set("tickers", parsed.tickers.join(","));
      url.searchParams.set("period", nextPeriod);
      url.searchParams.set("provider", nextProvider);

      const response = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as MarketDataRouteResponse;

      if (!payload.ok) {
        throw new Error(payload.error);
      }

      setData(payload.data);
      setLoadedProvider(nextProvider);
      const equalWeights = createEqualWeightInputs(payload.data.tickers);
      setWeightInputs(equalWeights);
      setProposedWeightInputs(equalWeights);
      setArgentineInstrumentFamilies(
        buildDefaultArgentineInstrumentFamilyMap(payload.data.tickers),
      );
      setActiveSection("setup");
    } catch (error) {
      setData(null);
      setLoadedProvider(null);
      setWeightInputs({});
      setProposedWeightInputs({});
      setArgentineInstrumentFamilies({});
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
    void loadMarketData(tickerInput, period, provider);
  }

  function handleTickerInputChange(value: string) {
    setTickerInput(value);
    setValidationError(null);
  }

  function handleWeightInputChange(ticker: string, value: string) {
    setWeightInputs((current) => ({ ...current, [ticker]: value }));
  }

  function handleProposedWeightInputChange(ticker: string, value: string) {
    setProposedWeightInputs((current) => ({ ...current, [ticker]: value }));
  }

  function handleApplyEqualWeights() {
    if (!data) {
      return;
    }

    setWeightInputs(createEqualWeightInputs(data.tickers));
  }

  function handleApplyEqualProposedWeights() {
    if (!data) {
      return;
    }

    setProposedWeightInputs(createEqualWeightInputs(data.tickers));
  }

  function handleApplyCurrentWeightsToProposed() {
    setProposedWeightInputs(weightInputs);
  }

  function handleArgentineInstrumentFamilyChange(
    ticker: string,
    familyId: ArgentineInstrumentFamilyId,
  ) {
    setArgentineInstrumentFamilies((current) => ({
      ...current,
      [ticker]: familyId,
    }));
  }

  function handleConfidenceLevelChange(
    nextConfidenceLevel: PortfolioConfidenceLevel,
  ) {
    setConfidenceLevel(validateConfidenceLevel(nextConfidenceLevel));
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

    return validateWeightPercentInputs({
      tickers: data.tickers,
      weightInputs,
    });
  }, [data, weightInputs]);

  const proposedWeightValidation = useMemo<WeightValidationState | null>(() => {
    if (!data) {
      return null;
    }

    return validateWeightPercentInputs({
      tickers: data.tickers,
      weightInputs: proposedWeightInputs,
    });
  }, [data, proposedWeightInputs]);

  const portfolioValueValidation = useMemo(
    () => validatePortfolioValueInput(portfolioValueInput),
    [portfolioValueInput],
  );

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

  const portfolioRiskAnalysis = useMemo(() => {
    if (
      !data ||
      !portfolioAnalytics ||
      !weightValidation?.isValid ||
      !weightValidation.weights
    ) {
      return null;
    }

    try {
      return buildPortfolioRiskAnalysis({
        data,
        tickers: data.tickers,
        weights: weightValidation.weights,
        portfolioDailyReturns: portfolioAnalytics.dailyReturns,
        portfolioNavPoints: portfolioAnalytics.points,
        portfolioValue: portfolioValueValidation.value,
        confidenceLevel,
      });
    } catch {
      return null;
    }
  }, [
    confidenceLevel,
    data,
    portfolioAnalytics,
    portfolioValueValidation.value,
    weightValidation,
  ]);

  const proposedPortfolioAnalytics = useMemo(() => {
    if (
      !data ||
      !proposedWeightValidation?.isValid ||
      !proposedWeightValidation.weights
    ) {
      return null;
    }

    try {
      return buildPortfolioAnalytics({
        data,
        weights: proposedWeightValidation.weights,
      });
    } catch {
      return null;
    }
  }, [data, proposedWeightValidation]);

  const proposedPortfolioRiskAnalysis = useMemo(() => {
    if (
      !data ||
      !proposedPortfolioAnalytics ||
      !proposedWeightValidation?.isValid ||
      !proposedWeightValidation.weights
    ) {
      return null;
    }

    try {
      return buildPortfolioRiskAnalysis({
        data,
        tickers: data.tickers,
        weights: proposedWeightValidation.weights,
        portfolioDailyReturns: proposedPortfolioAnalytics.dailyReturns,
        portfolioNavPoints: proposedPortfolioAnalytics.points,
        portfolioValue: portfolioValueValidation.value,
        confidenceLevel,
      });
    } catch {
      return null;
    }
  }, [
    confidenceLevel,
    data,
    portfolioValueValidation.value,
    proposedPortfolioAnalytics,
    proposedWeightValidation,
  ]);

  const factorRequestKey =
    data && loadedProvider && weightValidation?.isValid
      ? `${data.period}|${loadedProvider}`
      : null;

  useEffect(() => {
    if (!data || !loadedProvider || !factorRequestKey) {
      return;
    }

    let cancelled = false;

    loadMarketDataExplorer({
      tickers: FACTOR_PROXY_TICKERS,
      period: data.period,
      provider: loadedProvider,
      maxTickers: FACTOR_PROXY_TICKERS.length,
    })
      .then((payload) => {
        if (!cancelled) {
          setFactorDataState({
            data: payload,
            error: null,
            requestKey: factorRequestKey,
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setFactorDataState({
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load factor proxy data.",
            requestKey: factorRequestKey,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [data, factorRequestKey, loadedProvider]);

  const factorData =
    factorDataState.requestKey === factorRequestKey
      ? factorDataState.data
      : null;
  const factorDataError =
    factorDataState.requestKey === factorRequestKey
      ? factorDataState.error
      : null;

  const factorGradVarResult = useMemo<{
    analysis: ReturnType<typeof buildFactorGradVarAnalysis> | null;
    error: string | null;
  }>(() => {
    if (
      !data ||
      !factorData ||
      !portfolioAnalytics ||
      !weightValidation?.isValid ||
      !weightValidation.weights
    ) {
      return { analysis: null, error: null };
    }

    try {
      return {
        analysis: buildFactorGradVarAnalysis({
          assetData: data,
          factorData,
          tickers: data.tickers,
          weights: weightValidation.weights,
          portfolioDailyReturns: portfolioAnalytics.dailyReturns,
          confidenceLevel,
        }),
        error: null,
      };
    } catch (error) {
      return {
        analysis: null,
        error:
          error instanceof Error
            ? error.message
            : "Unable to compute factor attribution.",
      };
    }
  }, [confidenceLevel, data, factorData, portfolioAnalytics, weightValidation]);

  const proposedFactorGradVarResult = useMemo<{
    analysis: ReturnType<typeof buildFactorGradVarAnalysis> | null;
    error: string | null;
  }>(() => {
    if (
      !data ||
      !factorData ||
      !proposedPortfolioAnalytics ||
      !proposedWeightValidation?.isValid ||
      !proposedWeightValidation.weights
    ) {
      return { analysis: null, error: null };
    }

    try {
      return {
        analysis: buildFactorGradVarAnalysis({
          assetData: data,
          factorData,
          tickers: data.tickers,
          weights: proposedWeightValidation.weights,
          portfolioDailyReturns: proposedPortfolioAnalytics.dailyReturns,
          confidenceLevel,
        }),
        error: null,
      };
    } catch (error) {
      return {
        analysis: null,
        error:
          error instanceof Error
            ? error.message
            : "Unable to compute proposed factor attribution.",
      };
    }
  }, [
    confidenceLevel,
    data,
    factorData,
    proposedPortfolioAnalytics,
    proposedWeightValidation,
  ]);

  const factorGradVarLoading = Boolean(
    portfolioAnalytics &&
      weightValidation?.isValid &&
      factorRequestKey &&
      !factorDataError &&
      !factorGradVarResult.error &&
      factorDataState.requestKey !== factorRequestKey,
  );
  const factorGradVarError =
    factorDataError ?? factorGradVarResult.error ?? null;

  const currentVsProposedComparison = useMemo(() => {
    if (
      !portfolioAnalytics ||
      !portfolioRiskAnalysis ||
      !proposedPortfolioAnalytics ||
      !proposedPortfolioRiskAnalysis
    ) {
      return null;
    }

    return buildCurrentVsProposedRiskComparison({
      current: {
        id: "current",
        label: "Current",
        annualizedVolatility:
          portfolioAnalytics.metrics.annualizedVolatility,
        historicalVaR: portfolioRiskAnalysis.tailRisk.historicalVaR,
        historicalExpectedShortfall:
          portfolioRiskAnalysis.tailRisk.historicalExpectedShortfall,
        maxDrawdown: portfolioAnalytics.metrics.maxDrawdown,
        maxRiskContributor:
          portfolioRiskAnalysis.instrumentVaRContribution.summary
            .topContributorTicker,
        topThreeContributionShare:
          portfolioRiskAnalysis.instrumentVaRContribution.summary
            .topThreeContributionShare,
        factorAttribution: factorGradVarResult.analysis?.factorAttribution,
      },
      proposed: {
        id: "proposed",
        label: "Proposed",
        annualizedVolatility:
          proposedPortfolioAnalytics.metrics.annualizedVolatility,
        historicalVaR: proposedPortfolioRiskAnalysis.tailRisk.historicalVaR,
        historicalExpectedShortfall:
          proposedPortfolioRiskAnalysis.tailRisk.historicalExpectedShortfall,
        maxDrawdown: proposedPortfolioAnalytics.metrics.maxDrawdown,
        maxRiskContributor:
          proposedPortfolioRiskAnalysis.instrumentVaRContribution.summary
            .topContributorTicker,
        topThreeContributionShare:
          proposedPortfolioRiskAnalysis.instrumentVaRContribution.summary
            .topThreeContributionShare,
        factorAttribution:
          proposedFactorGradVarResult.analysis?.factorAttribution,
      },
    });
  }, [
    factorGradVarResult.analysis,
    portfolioAnalytics,
    portfolioRiskAnalysis,
    proposedFactorGradVarResult.analysis,
    proposedPortfolioAnalytics,
    proposedPortfolioRiskAnalysis,
  ]);

  const scenarioAnalysis = useMemo(() => {
    if (!factorGradVarResult.analysis || !weightValidation?.weights) {
      return null;
    }

    try {
      return buildPortfolioScenarioAnalysis({
        factorAnalysis: factorGradVarResult.analysis,
        weights: weightValidation.weights,
        portfolioValue: portfolioValueValidation.value,
      });
    } catch {
      return null;
    }
  }, [
    factorGradVarResult.analysis,
    portfolioValueValidation.value,
    weightValidation?.weights,
  ]);

  const argentineInstrumentContext = useMemo(() => {
    if (!data || !weightValidation?.isValid || !weightValidation.weights) {
      return null;
    }

    return buildArgentineInstrumentContextAnalysis({
      tickers: data.tickers,
      weights: weightValidation.weights,
      familyByTicker: argentineInstrumentFamilies,
    });
  }, [
    argentineInstrumentFamilies,
    data,
    weightValidation?.isValid,
    weightValidation?.weights,
  ]);

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
      {
        label: "Provider",
        value: formatProviderLabel(data.meta.provider),
      },
      {
        label: "Warnings",
        value: (data.meta.warnings?.length ?? 0).toString(),
      },
      {
        label: "Cache",
        value: data.meta.cache
          ? `${data.meta.cache.hits} hit / ${data.meta.cache.misses} miss`
          : "N/A",
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

    const portfolioValue = portfolioValueValidation.value;

    return [
      ...(portfolioValue
        ? [
            {
              label: "Portfolio value",
              value: formatCurrencyAmount(portfolioValue, currency),
            },
          ]
        : []),
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
  }, [currency, portfolioAnalytics, portfolioValueValidation.value]);

  const riskKpis = useMemo(() => {
    if (!portfolioRiskAnalysis) {
      return [];
    }

    const latestEwmaVolatility =
      portfolioRiskAnalysis.ewmaVolatilitySeries[
        portfolioRiskAnalysis.ewmaVolatilitySeries.length - 1
      ]?.value ?? 0;

    const confidenceLabel = formatPercentNoDecimals(
      portfolioRiskAnalysis.tailRisk.confidenceLevel,
    );
    const portfolioValue = portfolioValueValidation.value;
    const formatLossMetric = (lossRate: number) =>
      formatRiskPercentAndMoney({
        lossRate,
        portfolioValue,
        currency,
      });

    return [
      {
        label: `Historical VaR ${confidenceLabel}`,
        value: formatLossMetric(portfolioRiskAnalysis.tailRisk.historicalVaR),
      },
      {
        label: `Expected Shortfall ${confidenceLabel}`,
        value: formatLossMetric(
          portfolioRiskAnalysis.tailRisk.historicalExpectedShortfall,
        ),
      },
      {
        label: `Parametric VaR ${confidenceLabel}`,
        value: formatLossMetric(portfolioRiskAnalysis.tailRisk.parametricVaR),
      },
      {
        label: "Latest EWMA daily vol",
        value: formatRiskLossPercent(latestEwmaVolatility),
      },
      {
        label: "Worst daily return",
        value: formatPercent(portfolioRiskAnalysis.descriptiveStats.worstDailyReturn),
      },
      {
        label: "Positive days",
        value: formatRiskLossPercent(
          portfolioRiskAnalysis.descriptiveStats.positiveDayRatio,
        ),
      },
    ];
  }, [currency, portfolioRiskAnalysis, portfolioValueValidation.value]);

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
        description:
          "Normalized portfolio NAV built from the weighted daily return series.",
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
      ...(portfolioRiskAnalysis
        ? [
            {
              title: "Rolling Annualized Volatility",
              description:
                "Trailing 21-trading-day realized volatility, annualized for portfolio risk monitoring.",
              dates: portfolioRiskAnalysis.rollingVolatilitySeries.map(
                (point) => point.date,
              ),
              series: [
                {
                  label: "Portfolio",
                  values: portfolioRiskAnalysis.rollingVolatilitySeries.map(
                    (point) => point.value,
                  ),
                  color: "#c9a25d",
                },
              ],
              valueFormatter: formatRiskLossPercent,
            },
            {
              title: "EWMA Daily Volatility",
              description:
                "Exponentially weighted daily volatility using lambda 0.94 to emphasize recent return shocks.",
              dates: portfolioRiskAnalysis.ewmaVolatilitySeries.map(
                (point) => point.date,
              ),
              series: [
                {
                  label: "Portfolio",
                  values: portfolioRiskAnalysis.ewmaVolatilitySeries.map(
                    (point) => point.value,
                  ),
                  color: "#86a8c9",
                },
              ],
              valueFormatter: formatRiskLossPercent,
            },
          ]
        : []),
      {
        title: "Portfolio vs Assets",
        description:
          "Portfolio cumulative return compared with the currently selected assets.",
        dates: portfolioDates,
        series: comparisonSeries,
        valueFormatter: formatPercent,
      },
    ];
  }, [data, portfolioAnalytics, portfolioRiskAnalysis]);

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

  const datasetReady = Boolean(data);
  const sandboxReady = Boolean(weightValidation?.isValid);
  const activeSectionLabel =
    activeSection === "setup"
      ? "Setup"
      : activeSection === "asset-analytics"
        ? "Asset analytics"
        : activeSection === "funds" ? "Funds / Look-through" : "Portfolio analytics";

  return (
    <section className="space-y-8">
      <SurfaceCard
        tone="elevated"
        padding="md"
        className="border-border-strong/95"
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(24rem,1.08fr)] xl:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-accent-foreground">
                Risk
              </span>
              <span className="rounded-full border border-white/[0.08] bg-background-muted/75 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-foreground-subtle">
                {activeSectionLabel}
              </span>
            </div>

            <div className="space-y-3">
              <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-[2.35rem]">
                Market and portfolio risk desk
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-foreground-soft">
                Load an aligned dataset, validate weights, inspect assets, and
                review the weighted portfolio.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <WorkspaceSignal
              label="Dataset posture"
              value={
                data
                  ? `${data.tickers.length} tickers aligned across ${data.period}`
                  : isLoading
                    ? "Loading shared market history"
                    : "Awaiting dataset request"
              }
              detail={
                data
                  ? `${formatDateLabel(data.meta.commonStartDate)} through ${formatDateLabel(
                      data.meta.commonEndDate,
                    )}`
                  : "The module begins by creating a common observation window."
              }
              tone={datasetReady ? "ready" : isLoading ? "active" : "default"}
            />
            <WorkspaceSignal
              label="Sandbox posture"
              value={
                sandboxReady
                  ? "Validated for portfolio review"
                  : datasetReady
                    ? "Weights still require validation"
                    : "Portfolio sandbox locked"
              }
              detail={
                sandboxReady
                  ? "The weighted portfolio layer is unlocked."
                  : "Portfolio analytics remain gated until the sandbox totals 100%."
              }
              tone={sandboxReady ? "ready" : datasetReady ? "active" : "default"}
            />
            <WorkspaceSignal
              label="Operating rule"
              value="Load data, inspect assets, then evaluate the weighted portfolio."
              detail="The sequencing is deliberate so each section inherits a stable analytical base."
            />
          </div>
        </div>
      </SurfaceCard>

      <RiskSectionTabs
        activeSection={activeSection}
        datasetReady={datasetReady}
        sandboxReady={sandboxReady}
        onChange={setActiveSection}
      />

      <div hidden={activeSection !== "funds"}>
        <FundLookThroughSection />
      </div>

      {activeSection === "setup" ? (
        <RiskSetupSection
          confidenceLevel={confidenceLevel}
          currency={currency}
          data={data}
          inputHint={inputHint}
          isLoading={isLoading}
          period={period}
          portfolioValueInput={portfolioValueInput}
          portfolioValueValidation={portfolioValueValidation}
          argentineInstrumentFamilies={argentineInstrumentFamilies}
          proposedWeightInputs={proposedWeightInputs}
          proposedWeightValidation={proposedWeightValidation}
          provider={provider}
          providerConfigs={providerConfigs}
          providerSelectorOptions={providerSelectorOptions}
          requestError={requestError}
          statusItems={datasetStatusItems}
          tickerInput={tickerInput}
          validationError={validationError}
          weightInputs={weightInputs}
          weightValidation={weightValidation}
          onApplyEqualWeights={handleApplyEqualWeights}
          onArgentineInstrumentFamilyChange={
            handleArgentineInstrumentFamilyChange
          }
          onConfidenceLevelChange={handleConfidenceLevelChange}
          onCurrencyChange={setCurrency}
          onPeriodChange={setPeriod}
          onPortfolioValueInputChange={setPortfolioValueInput}
          onProviderChange={setProvider}
          onProposedWeightInputChange={handleProposedWeightInputChange}
          onApplyCurrentWeightsToProposed={handleApplyCurrentWeightsToProposed}
          onApplyEqualProposedWeights={handleApplyEqualProposedWeights}
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
          proposedWeights={proposedWeightValidation?.isValid ? proposedWeightValidation.weights : null}
          data={data}
          factorGradVarAnalysis={factorGradVarResult.analysis}
          factorGradVarError={factorGradVarError}
          factorGradVarLoading={factorGradVarLoading}
          currentVsProposedComparison={currentVsProposedComparison}
          argentineInstrumentContext={argentineInstrumentContext}
          holdings={holdings}
          portfolioAnalytics={portfolioAnalytics}
          portfolioCharts={portfolioCharts}
          portfolioKpis={portfolioKpis}
          portfolioRiskAnalysis={portfolioRiskAnalysis}
          portfolioValue={portfolioValueValidation.value}
          presentationCurrency={currency}
          riskKpis={riskKpis}
          scenarioAnalysis={scenarioAnalysis}
          weightValidation={weightValidation}
        />
      ) : null}
    </section>
  );
}

function WorkspaceSignal({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "active" | "ready";
}) {
  return (
    <SurfaceCard
      padding="sm"
      className={cn(
        "h-full border-white/[0.08]",
        tone === "active" && "border-accent/18",
        tone === "ready" && "border-emerald-400/18",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-3 text-sm font-semibold leading-6 text-foreground">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-foreground-soft">{detail}</p>
    </SurfaceCard>
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

function formatRiskLossPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatPercentNoDecimals(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyAmount(
  value: number,
  currency: PortfolioValueCurrency,
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRiskPercentAndMoney(input: {
  lossRate: number;
  portfolioValue: number | null;
  currency: PortfolioValueCurrency;
}): string {
  const percent = formatRiskLossPercent(input.lossRate);

  if (!input.portfolioValue) {
    return percent;
  }

  const moneyAtRisk = calculateMoneyAtRisk({
    lossRate: input.lossRate,
    portfolioValue: input.portfolioValue,
  });

  return `${percent} / ${formatCurrencyAmount(moneyAtRisk, input.currency)}`;
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatProviderLabel(value: string): string {
  return value
    .split(" + ")
    .map((provider) =>
      provider === "twelveData"
        ? "Twelve Data"
        : provider === "yahoo"
          ? "Yahoo"
        : provider.charAt(0).toUpperCase() + provider.slice(1),
    )
    .join(" + ");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
