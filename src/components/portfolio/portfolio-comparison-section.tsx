"use client";

import { useMemo, useState } from "react";
import { PortfolioComparisonCharts } from "@/components/portfolio/portfolio-comparison-charts";
import { PortfolioBuilder } from "@/components/portfolio/portfolio-builder";
import { PortfolioRiskDiagnosticsSection } from "@/components/portfolio/portfolio-risk-diagnostics-section";
import { PortfolioStressTestSection } from "@/components/portfolio/portfolio-stress-test-section";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  buildPortfolioComparison,
  createCustomPortfolioComparisonDefinition,
  createPortfolioComparisonDefinitionFromPreset,
  DEFAULT_PORTFOLIO_COMPARISON_INITIAL_CAPITAL,
  DEFAULT_PORTFOLIO_COMPARISON_PERIOD,
  DEFAULT_PORTFOLIO_COMPARISON_STRATEGY,
  getDefaultPortfolioComparisonDefinitions,
  getPortfolioComparisonTickers,
  getPredefinedPortfolioComparisonPresets,
  MAX_PORTFOLIO_COMPARISON_COUNT,
  MAX_PORTFOLIO_COMPARISON_TICKERS,
  MIN_PORTFOLIO_COMPARISON_COUNT,
  type PortfolioComparisonDefinition,
  type PortfolioComparisonMetrics,
  type PortfolioComparisonPresetId,
  type PortfolioComparisonResult,
} from "@/lib/finance/portfolio/comparison";
import { PORTFOLIO_ASSET_CLASS_BY_TICKER } from "@/lib/finance/portfolio/presets";
import { getRebalancingStrategyLabel } from "@/lib/finance/portfolio/rebalancing";
import { validatePortfolioInputs } from "@/lib/finance/portfolio/returns";
import { buildPortfolioRiskDiagnostics } from "@/lib/finance/portfolio/risk-diagnostics";
import type { PortfolioRiskDiagnostics } from "@/lib/finance/portfolio/risk-diagnostics";
import { buildPortfolioStressScenarioResults } from "@/lib/finance/portfolio/scenario-stress";
import type { PortfolioStressScenarioResult } from "@/lib/finance/portfolio/scenario-stress";
import type { PortfolioAssetInput } from "@/lib/finance/portfolio/types";
import { loadMarketDataExplorer } from "@/lib/market-data/client";
import type {
  MarketDataPeriod,
  MarketDataProviderMode,
  MarketDataWarning,
} from "@/lib/market-data/types";
import type {
  ProviderSelectorOption,
  SafeProviderConfig,
} from "@/lib/market-data/provider-config";
import { cn } from "@/lib/utils";

type PortfolioComparisonSectionProps = {
  providerConfigs: SafeProviderConfig[];
  providerSelectorOptions: ProviderSelectorOption[];
};

type PortfolioLabMode = "comparison" | "single";
type MetricFormat = "signedPercent" | "percent" | "lossPercent" | "ratio";

type PortfolioRiskLabResult = {
  comparison: PortfolioComparisonResult;
  diagnostics: PortfolioRiskDiagnostics;
  stressResults: PortfolioStressScenarioResult[];
};

const PERIOD_OPTIONS: MarketDataPeriod[] = ["1M", "3M", "6M", "1Y"];

const metricRows: Array<{
  key: keyof PortfolioComparisonMetrics;
  label: string;
  description: string;
  format: MetricFormat;
}> = [
  {
    key: "cumulativeReturn",
    label: "Cumulative return",
    description: "Total gain or loss over the shared historical window.",
    format: "signedPercent",
  },
  {
    key: "annualizedReturn",
    label: "Annualized return",
    description: "Compounded yearly pace implied by the observed return path.",
    format: "signedPercent",
  },
  {
    key: "annualizedVolatility",
    label: "Annualized volatility",
    description: "Realized variability of daily returns, scaled to one year.",
    format: "percent",
  },
  {
    key: "sharpeRatio",
    label: "Sharpe ratio",
    description: "Return per unit of volatility using a 0% cash rate.",
    format: "ratio",
  },
  {
    key: "maxDrawdown",
    label: "Max drawdown",
    description: "Deepest peak-to-trough decline in portfolio value.",
    format: "signedPercent",
  },
  {
    key: "historicalVar95",
    label: "VaR 95%",
    description:
      "Daily historical loss threshold exceeded in the worst 5% of observations.",
    format: "lossPercent",
  },
  {
    key: "historicalExpectedShortfall95",
    label: "Expected shortfall 95%",
    description: "Average daily loss inside the worst 5% of observations.",
    format: "lossPercent",
  },
];

export function PortfolioComparisonSection({
  providerConfigs,
  providerSelectorOptions,
}: PortfolioComparisonSectionProps) {
  const [activeMode, setActiveMode] = useState<PortfolioLabMode>("comparison");
  const [period, setPeriod] = useState<MarketDataPeriod>(
    DEFAULT_PORTFOLIO_COMPARISON_PERIOD,
  );
  const [provider, setProvider] = useState<MarketDataProviderMode>("auto");
  const [portfolios, setPortfolios] = useState<
    PortfolioComparisonDefinition[]
  >(() => getDefaultPortfolioComparisonDefinitions());
  const [presetToAdd, setPresetToAdd] =
    useState<PortfolioComparisonPresetId>("growth");
  const [result, setResult] = useState<PortfolioRiskLabResult | null>(null);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const availablePresets = useMemo(
    () => getPredefinedPortfolioComparisonPresets(),
    [],
  );
  const validations = useMemo(
    () =>
      portfolios.map((portfolio) => ({
        portfolioId: portfolio.id,
        result: validatePortfolioInputs({
          initialCapital: DEFAULT_PORTFOLIO_COMPARISON_INITIAL_CAPITAL,
          assets: portfolio.holdings,
        }),
      })),
    [portfolios],
  );
  const invalidPortfolio = validations.find(
    (validation) => !validation.result.isValid,
  );
  const unionTickers = useMemo(
    () => getPortfolioComparisonTickers(portfolios),
    [portfolios],
  );
  const selectedPredefinedPresetIds = new Set(
    portfolios
      .map((portfolio) => portfolio.sourcePresetId)
      .filter((id): id is string => Boolean(id)),
  );
  const presetOptions = availablePresets.filter(
    (preset) => !selectedPredefinedPresetIds.has(preset.sourcePresetId),
  );
  const strategyLabel = getRebalancingStrategyLabel(
    DEFAULT_PORTFOLIO_COMPARISON_STRATEGY,
  );
  const canAddPortfolio = portfolios.length < MAX_PORTFOLIO_COMPARISON_COUNT;
  const canRemovePortfolio = portfolios.length > MIN_PORTFOLIO_COMPARISON_COUNT;
  const tickerLimitExceeded =
    unionTickers.length > MAX_PORTFOLIO_COMPARISON_TICKERS;

  async function handleRunComparison() {
    setRequestMessage(null);

    if (portfolios.length < MIN_PORTFOLIO_COMPARISON_COUNT) {
      setResult(null);
      setRequestMessage(
        `Select at least ${MIN_PORTFOLIO_COMPARISON_COUNT} portfolios to compare.`,
      );
      return;
    }

    if (tickerLimitExceeded) {
      setResult(null);
      setRequestMessage(
        `The shared market-data API supports up to ${MAX_PORTFOLIO_COMPARISON_TICKERS} unique tickers. Current union: ${unionTickers.length}.`,
      );
      return;
    }

    if (invalidPortfolio) {
      const portfolio = portfolios.find(
        (entry) => entry.id === invalidPortfolio.portfolioId,
      );

      setResult(null);
      setRequestMessage(
        `${portfolio?.name ?? "A portfolio"} is invalid: ${
          invalidPortfolio.result.isValid
            ? "Review portfolio inputs."
            : invalidPortfolio.result.error
        }`,
      );
      return;
    }

    setIsLoading(true);

    try {
      const data = await loadMarketDataExplorer({
        tickers: unionTickers,
        period,
        provider,
        maxTickers: MAX_PORTFOLIO_COMPARISON_TICKERS,
      });
      const comparison = buildPortfolioComparison({
        data,
        portfolios,
        initialCapital: DEFAULT_PORTFOLIO_COMPARISON_INITIAL_CAPITAL,
        strategy: DEFAULT_PORTFOLIO_COMPARISON_STRATEGY,
        riskFreeRate: 0,
      });

      setResult({
        comparison,
        diagnostics: buildPortfolioRiskDiagnostics({
          data,
          portfolios: comparison.portfolios,
        }),
        stressResults: buildPortfolioStressScenarioResults(
          comparison.portfolios,
        ),
      });
    } catch (error) {
      setResult(null);
      setRequestMessage(
        error instanceof Error
          ? error.message
          : "Unable to run the Portfolio Risk Lab right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleAddPreset() {
    if (!canAddPortfolio) {
      return;
    }

    const selectedPresetId =
      presetOptions.find((preset) => preset.id === presetToAdd)?.id ??
      presetOptions[0]?.id;

    if (!selectedPresetId) {
      return;
    }

    setPortfolios((current) => [
      ...current,
      createPortfolioComparisonDefinitionFromPreset(
        selectedPresetId,
        createPortfolioId("preset"),
      ),
    ]);
    setResult(null);
    setRequestMessage(null);
  }

  function handleAddCustomPortfolio() {
    if (!canAddPortfolio) {
      return;
    }

    setPortfolios((current) => [
      ...current,
      createCustomPortfolioComparisonDefinition(
        createPortfolioId("custom"),
        current.filter((portfolio) => portfolio.kind === "custom").length + 1,
      ),
    ]);
    setResult(null);
    setRequestMessage(null);
  }

  function handleRemovePortfolio(portfolioId: string) {
    if (!canRemovePortfolio) {
      return;
    }

    setPortfolios((current) =>
      current.filter((portfolio) => portfolio.id !== portfolioId),
    );
    setResult(null);
    setRequestMessage(null);
  }

  function handlePortfolioNameChange(portfolioId: string, value: string) {
    setPortfolios((current) =>
      current.map((portfolio) =>
        portfolio.id === portfolioId
          ? {
              ...portfolio,
              name: value,
              label: value.trim() || portfolio.label,
            }
          : portfolio,
      ),
    );
    setResult(null);
  }

  function handleHoldingChange(
    portfolioId: string,
    holdingIndex: number,
    field: keyof PortfolioAssetInput,
    value: string,
  ) {
    setPortfolios((current) =>
      current.map((portfolio) => {
        if (portfolio.id !== portfolioId) {
          return portfolio;
        }

        const holdings = portfolio.holdings.map((holding, index) => {
          if (index !== holdingIndex) {
            return holding;
          }

          if (field === "weight") {
            return {
              ...holding,
              weight: value.trim() === "" ? Number.NaN : Number(value),
            };
          }

          if (field === "ticker") {
            const ticker = value.trim().toUpperCase();
            const assetClass =
              PORTFOLIO_ASSET_CLASS_BY_TICKER[ticker] ?? holding.assetClass;

            return {
              ...holding,
              ticker,
              assetClass,
            };
          }

          return {
            ...holding,
            assetClass: value,
          };
        });

        return { ...portfolio, holdings };
      }),
    );
    setResult(null);
    setRequestMessage(null);
  }

  function handleAddHolding(portfolioId: string) {
    setPortfolios((current) =>
      current.map((portfolio) =>
        portfolio.id === portfolioId
          ? {
              ...portfolio,
              holdings: [
                ...portfolio.holdings,
                { ticker: "", assetClass: "", weight: Number.NaN },
              ],
            }
          : portfolio,
      ),
    );
    setResult(null);
  }

  function handleRemoveHolding(portfolioId: string, holdingIndex: number) {
    setPortfolios((current) =>
      current.map((portfolio) =>
        portfolio.id === portfolioId && portfolio.holdings.length > 1
          ? {
              ...portfolio,
              holdings: portfolio.holdings.filter(
                (_, index) => index !== holdingIndex,
              ),
            }
          : portfolio,
      ),
    );
    setResult(null);
  }

  return (
    <div className="space-y-6">
      <SurfaceCard tone="elevated" padding="md" className="border-border-strong/90">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.72fr)] xl:items-end">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
              Portfolio
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground">
              Portfolio risk lab
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground-soft">
              Build one allocation or compare several portfolios on the same
              aligned historical data. Results are analytical outputs, not
              investment advice.
            </p>
          </div>
          <ModeSwitch activeMode={activeMode} onChange={setActiveMode} />
        </div>
      </SurfaceCard>

      {activeMode === "single" ? (
        <>
          <SurfaceCard padding="md" className="border-white/[0.08]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
              Single portfolio analysis
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">
              Backtest one allocation with benchmark and drawdown review.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground-soft">
              Choose a preset, edit holdings, set rebalancing and benchmark
              controls, then run a historical backtest.
            </p>
          </SurfaceCard>
          <PortfolioBuilder
            providerConfigs={providerConfigs}
            providerSelectorOptions={providerSelectorOptions}
          />
          <MethodologySection mode="single" />
        </>
      ) : (
        <>
      <SurfaceCard tone="elevated" padding="md" className="border-border-strong/90">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
              Comparison
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground">
              Compare portfolios on shared data
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground-soft">
              Select 2 to 5 predefined or custom portfolios, load one aligned
              historical dataset, then evaluate returns, drawdowns,
              correlations, risk contribution, and scenario shocks.
            </p>
          </div>
          <span className="w-fit rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-foreground">
            Shared data model
          </span>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,0.42fr)_auto] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
              Lookback window
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setPeriod(option);
                    setResult(null);
                    setRequestMessage(null);
                  }}
                  className={cn(
                    "rounded-[1.05rem] border px-3 py-2.5 text-sm font-semibold transition",
                    period === option
                      ? "border-accent/40 bg-accent/12 text-accent-foreground"
                      : "border-white/[0.08] bg-slate-950/55 text-slate-300 hover:border-border-strong/80 hover:bg-white/[0.04]",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
              Provider
            </span>
            <select
              value={provider}
              onChange={(event) => {
                setProvider(event.target.value as MarketDataProviderMode);
                setResult(null);
                setRequestMessage(null);
              }}
              className="mt-3 w-full rounded-[1.15rem] border border-white/10 bg-slate-950/75 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60"
            >
              {providerSelectorOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleRunComparison}
            disabled={isLoading || Boolean(invalidPortfolio) || tickerLimitExceeded}
            className="rounded-[1.15rem] bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-accent/60 lg:min-w-48"
          >
            {isLoading ? "Running lab..." : "Run risk lab"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoLine
            label="Portfolios"
            value={`${portfolios.length}/${MAX_PORTFOLIO_COMPARISON_COUNT}`}
          />
          <InfoLine
            label="Union tickers"
            value={`${unionTickers.length}/${MAX_PORTFOLIO_COMPARISON_TICKERS}`}
            tone={tickerLimitExceeded ? "warning" : "default"}
          />
          <InfoLine label="Initial capital" value="$100,000 each" />
          <InfoLine label="Rebalancing" value={strategyLabel} />
        </div>

        {requestMessage ? (
          <p className="mt-5 rounded-[1.15rem] border border-rose-400/30 bg-rose-400/[0.08] px-4 py-3 text-sm leading-6 text-rose-200">
            {requestMessage}
          </p>
        ) : null}

        {tickerLimitExceeded ? (
          <p className="mt-5 rounded-[1.15rem] border border-amber-400/25 bg-amber-400/[0.08] px-4 py-3 text-sm leading-6 text-amber-200">
            Reduce holdings or remove a portfolio before running the lab. The
            existing market-data route caps aligned requests at{" "}
            {MAX_PORTFOLIO_COMPARISON_TICKERS} tickers.
          </p>
        ) : null}
      </SurfaceCard>

      <SurfaceCard padding="md" className="border-white/[0.08]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
              Portfolio setup
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">
              Build the comparison set
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground-soft">
              Defaults start with Conservative, Balanced, and Aggressive. Add
              Growth or custom portfolios, edit holdings, and keep every
              allocation at 100%.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="block">
              <span className="sr-only">Preset to add</span>
              <select
                value={
                  presetOptions.some((preset) => preset.id === presetToAdd)
                    ? presetToAdd
                    : presetOptions[0]?.id ?? presetToAdd
                }
                onChange={(event) =>
                  setPresetToAdd(event.target.value as PortfolioComparisonPresetId)
                }
                disabled={!canAddPortfolio || presetOptions.length === 0}
                className="w-full rounded-[1.05rem] border border-white/10 bg-slate-950/75 px-3 py-2.5 text-sm text-white outline-none transition focus:border-accent/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {presetOptions.length > 0 ? (
                  presetOptions.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))
                ) : (
                  <option value={presetToAdd}>All presets selected</option>
                )}
              </select>
            </label>
            <button
              type="button"
              onClick={handleAddPreset}
              disabled={!canAddPortfolio || presetOptions.length === 0}
              className="rounded-[1.05rem] border border-accent/25 bg-accent/10 px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:border-accent/40 hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add preset
            </button>
            <button
              type="button"
              onClick={handleAddCustomPortfolio}
              disabled={!canAddPortfolio}
              className="rounded-[1.05rem] border border-white/[0.08] bg-background-muted/80 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent/25 hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add custom
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {portfolios.map((portfolio) => {
            const validation = validations.find(
              (entry) => entry.portfolioId === portfolio.id,
            )?.result;

            return (
              <PortfolioSetupCard
                key={portfolio.id}
                portfolio={portfolio}
                validation={validation}
                canRemove={canRemovePortfolio}
                onAddHolding={handleAddHolding}
                onHoldingChange={handleHoldingChange}
                onNameChange={handlePortfolioNameChange}
                onRemoveHolding={handleRemoveHolding}
                onRemovePortfolio={handleRemovePortfolio}
              />
            );
          })}
        </div>
      </SurfaceCard>

      {result ? (
        <>
          <PerformanceComparisonSection comparison={result.comparison} />
          <PortfolioComparisonCharts comparison={result.comparison} />
          <PortfolioRiskDiagnosticsSection diagnostics={result.diagnostics} />
          <PortfolioStressTestSection results={result.stressResults} />
        </>
      ) : (
        <SurfaceCard padding="md" className="border-white/[0.08]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
            Lab output
          </p>
          <p className="mt-3 text-sm leading-7 text-foreground-soft">
            Run the lab to calculate performance metrics, drawdown paths,
            rolling volatility, correlations, volatility contribution, and
            scenario impacts from one aligned market-data request.
          </p>
        </SurfaceCard>
      )}
          <MethodologySection mode="comparison" />
        </>
      )}
    </div>
  );
}

function ModeSwitch({
  activeMode,
  onChange,
}: {
  activeMode: PortfolioLabMode;
  onChange: (mode: PortfolioLabMode) => void;
}) {
  const modes: Array<{
    id: PortfolioLabMode;
    label: string;
    description: string;
  }> = [
    {
      id: "single",
      label: "Single portfolio analysis",
      description: "Build one allocation with benchmark and rebalancing controls.",
    },
    {
      id: "comparison",
      label: "Portfolio comparison",
      description: "Compare 2 to 5 portfolios on shared market data.",
    },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {modes.map((mode) => {
        const isActive = activeMode === mode.id;

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={cn(
              "rounded-[1.2rem] border px-4 py-3 text-left transition",
              isActive
                ? "border-accent/40 bg-accent/12 text-accent-foreground"
                : "border-white/[0.08] bg-background-muted/75 text-foreground hover:border-accent/25 hover:bg-accent/10",
            )}
          >
            <span className="block text-sm font-semibold">{mode.label}</span>
            <span className="mt-2 block text-xs leading-5 text-foreground-muted">
              {mode.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MethodologySection({ mode }: { mode: PortfolioLabMode }) {
  return (
    <SurfaceCard padding="md" className="border-white/[0.08]">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
        Limits
      </p>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <MethodologyNote
          title="Historical data"
          body={
            mode === "comparison"
              ? "Comparison mode evaluates every selected portfolio on one shared aligned historical price window."
              : "Single mode evaluates one selected allocation and optional benchmark over aligned historical prices."
          }
        />
        <MethodologyNote
          title="Loss measures"
          body="VaR and expected shortfall are historical daily loss measures. Drawdown is peak-to-trough decline from the simulated value path."
        />
        <MethodologyNote
          title="Scenario tests"
          body="Stress tests use simplified asset-class shocks. They are scenario assumptions, not forecasts or recommendations."
        />
      </div>
    </SurfaceCard>
  );
}

function MethodologyNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/[0.08] bg-background-muted/75 px-4 py-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-foreground-soft">{body}</p>
    </div>
  );
}

function PortfolioSetupCard({
  portfolio,
  validation,
  canRemove,
  onAddHolding,
  onHoldingChange,
  onNameChange,
  onRemoveHolding,
  onRemovePortfolio,
}: {
  portfolio: PortfolioComparisonDefinition;
  validation:
    | ReturnType<typeof validatePortfolioInputs>
    | undefined;
  canRemove: boolean;
  onAddHolding: (portfolioId: string) => void;
  onHoldingChange: (
    portfolioId: string,
    holdingIndex: number,
    field: keyof PortfolioAssetInput,
    value: string,
  ) => void;
  onNameChange: (portfolioId: string, value: string) => void;
  onRemoveHolding: (portfolioId: string, holdingIndex: number) => void;
  onRemovePortfolio: (portfolioId: string) => void;
}) {
  const totalWeight = validation?.totalWeight ?? 0;
  const isValid = Boolean(validation?.isValid);

  return (
    <div className="rounded-[1.45rem] border border-white/[0.08] bg-background-muted/75 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
            {portfolio.kind === "predefined" ? "Predefined" : "Custom"}
          </p>
          <h3 className="mt-2 text-base font-semibold text-foreground">
            {portfolio.label}
          </h3>
        </div>
        <ValidationBadge isValid={isValid} totalWeight={totalWeight} />
      </div>

      <p className="mt-3 text-sm leading-6 text-foreground-soft">
        {portfolio.description}
      </p>

      {portfolio.sourcePresetName ? (
        <p className="mt-2 text-xs leading-6 text-foreground-muted">
          Source preset: {portfolio.sourcePresetName}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {portfolio.holdings.map((holding, index) => (
          <span
            key={`${holding.ticker || "blank"}-${index}`}
            className="rounded-full border border-white/[0.08] bg-slate-950/45 px-3 py-1.5 text-xs text-foreground-soft"
          >
            {holding.ticker || "Ticker"}{" "}
            {Number.isFinite(holding.weight)
              ? `${holding.weight.toFixed(0)}%`
              : "Needs weight"}
          </span>
        ))}
      </div>

      {!isValid && validation && !validation.isValid ? (
        <p className="mt-4 rounded-[1rem] border border-amber-400/25 bg-amber-400/[0.08] px-3 py-2 text-xs leading-5 text-amber-200">
          {validation.error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onRemovePortfolio(portfolio.id)}
          disabled={!canRemove}
          className="rounded-[1rem] border border-white/[0.08] bg-background-muted/80 px-3 py-2 text-xs font-semibold text-foreground-muted transition hover:border-rose-400/30 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Remove portfolio
        </button>
      </div>

      <details className="mt-4 rounded-[1.1rem] border border-white/[0.08] bg-slate-950/35 px-3 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          Edit holdings
        </summary>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
              Portfolio name
            </span>
            <input
              type="text"
              value={portfolio.name}
              onChange={(event) => onNameChange(portfolio.id, event.target.value)}
              className="mt-2 w-full rounded-[1rem] border border-white/10 bg-slate-950/75 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/60"
            />
          </label>

          <div className="space-y-3">
            {portfolio.holdings.map((holding, index) => (
              <div
                key={`${portfolio.id}-${index}`}
                className="rounded-[1.1rem] border border-white/[0.08] bg-background-muted/70 px-3 py-3"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
                    Holding {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => onRemoveHolding(portfolio.id, index)}
                    disabled={portfolio.holdings.length <= 1}
                    className="rounded-[0.9rem] border border-white/[0.08] bg-slate-950/45 px-3 py-2 text-xs font-semibold text-foreground-muted transition hover:border-rose-400/30 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove holding
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-[minmax(5rem,0.7fr)_minmax(0,1.55fr)_minmax(7rem,0.7fr)]">
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
                      Ticker
                    </span>
                    <input
                      type="text"
                      value={holding.ticker}
                      onChange={(event) =>
                        onHoldingChange(
                          portfolio.id,
                          index,
                          "ticker",
                          event.target.value,
                        )
                      }
                      placeholder="ETF"
                      className="mt-2 w-full rounded-[0.9rem] border border-white/10 bg-slate-950/75 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/60"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
                      Asset class
                    </span>
                    <input
                      type="text"
                      value={holding.assetClass}
                      onChange={(event) =>
                        onHoldingChange(
                          portfolio.id,
                          index,
                          "assetClass",
                          event.target.value,
                        )
                      }
                      placeholder="Asset class"
                      className="mt-2 w-full rounded-[0.9rem] border border-white/10 bg-slate-950/75 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/60"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
                      Weight
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={
                        Number.isFinite(holding.weight)
                          ? holding.weight.toString()
                          : ""
                      }
                      onChange={(event) =>
                        onHoldingChange(
                          portfolio.id,
                          index,
                          "weight",
                          event.target.value,
                        )
                      }
                      placeholder="0.00"
                      className="mt-2 w-full rounded-[0.9rem] border border-white/10 bg-slate-950/75 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/60"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onAddHolding(portfolio.id)}
              className="rounded-[1rem] border border-accent/25 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent-foreground transition hover:border-accent/40 hover:bg-accent/15"
            >
              Add holding
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}

function PerformanceComparisonSection({
  comparison,
}: {
  comparison: PortfolioComparisonResult;
}) {
  return (
    <SurfaceCard tone="elevated" padding="md" className="border-white/[0.08]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
            Performance comparison
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">
            Historical returns and loss measures on one aligned window.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground-soft">
            VaR and expected shortfall are historical daily loss measures. All
            metrics are calculated from observed aligned data and are not
            forecasts.
          </p>
        </div>
        <span className="w-fit rounded-full border border-white/[0.08] bg-background-muted/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
          {comparison.portfolios.length} portfolios
        </span>
      </div>

      <ComparisonStatus comparison={comparison} />
      <ComparisonMetricsTable comparison={comparison} />
    </SurfaceCard>
  );
}

function ValidationBadge({
  isValid,
  totalWeight,
}: {
  isValid: boolean;
  totalWeight: number;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
        isValid
          ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
          : "border-amber-400/25 bg-amber-400/[0.08] text-amber-200",
      )}
    >
      {isValid ? "Valid" : "Review"} {totalWeight.toFixed(0)}%
    </span>
  );
}

function ComparisonStatus({
  comparison,
}: {
  comparison: PortfolioComparisonResult;
}) {
  const warnings = comparison.providerWarnings ?? [];

  return (
    <div className="mt-6 space-y-3">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <InfoLine label="Common start" value={formatDate(comparison.commonStartDate)} />
        <InfoLine label="Common end" value={formatDate(comparison.commonEndDate)} />
        <InfoLine label="Observations" value={comparison.observations.toString()} />
        <InfoLine label="Provider" value={formatProviderLabel(comparison.provider)} />
        <InfoLine label="Warnings" value={warnings.length.toString()} />
        <InfoLine
          label="Cache"
          value={
            comparison.providerCache
              ? `${comparison.providerCache.hits} hit / ${comparison.providerCache.misses} miss`
              : "N/A"
          }
        />
      </div>

      {warnings.length > 0 ? (
        <div className="rounded-[1.25rem] border border-amber-400/25 bg-amber-400/[0.08] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
            Provider warnings
          </p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-amber-100/90">
            {warnings.map((warning, index) => (
              <li key={`${warning.code}-${warning.symbol ?? "all"}-${index}`}>
                {formatWarning(warning)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ComparisonMetricsTable({
  comparison,
}: {
  comparison: PortfolioComparisonResult;
}) {
  return (
    <div className="mt-5 overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
      <table className="w-full min-w-[980px] text-left">
        <thead>
          <tr className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
            <th className="px-5 py-3">Metric</th>
            <th className="px-5 py-3">Portfolio-management read</th>
            {comparison.portfolios.map((portfolio) => (
              <th key={portfolio.id} className="px-5 py-3">
                {portfolio.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metricRows.map((row, index) => (
            <tr
              key={row.key}
              className={cn(
                "border-b border-white/[0.08] last:border-b-0",
                index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
              )}
            >
              <td className="px-5 py-4 align-top text-sm font-semibold text-foreground">
                {row.label}
              </td>
              <td className="px-5 py-4 align-top text-sm leading-6 text-foreground-soft">
                {row.description}
              </td>
              {comparison.portfolios.map((portfolio) => {
                const value = portfolio.metrics[row.key];
                const formatted = formatMetricValue(value, row.format);

                return (
                  <td
                    key={`${portfolio.id}-${row.key}`}
                    className={cn(
                      "px-5 py-4 align-top text-sm font-semibold text-foreground",
                      getMetricTone(value, row.format),
                    )}
                  >
                    {formatted}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoLine({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.25rem] border border-white/[0.08] bg-background-muted/80 px-4 py-3",
        tone === "warning" && "border-amber-400/25 bg-amber-400/[0.08]",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function getMetricTone(value: number, format: MetricFormat) {
  if (format === "lossPercent") {
    return "text-rose-200";
  }

  if (format === "signedPercent" || format === "ratio") {
    if (value > 0) {
      return "text-emerald-200";
    }

    if (value < 0) {
      return "text-rose-200";
    }
  }

  return "text-foreground";
}

function formatMetricValue(value: number, format: MetricFormat): string {
  if (format === "ratio") {
    return value.toFixed(2);
  }

  if (format === "lossPercent") {
    return `${(value * 100).toFixed(2)}% loss`;
  }

  if (format === "signedPercent") {
    return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
  }

  return `${(value * 100).toFixed(2)}%`;
}

function formatWarning(warning: MarketDataWarning): string {
  const source = [warning.symbol, warning.provider].filter(Boolean).join(" / ");

  return source ? `${source}: ${warning.message}` : warning.message;
}

function formatProviderLabel(value: string): string {
  return value
    .split(" + ")
    .map((providerName) =>
      providerName === "twelveData"
        ? "Twelve Data"
        : providerName === "yahoo"
          ? "Yahoo"
          : providerName.charAt(0).toUpperCase() + providerName.slice(1),
    )
    .join(" + ");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function createPortfolioId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
