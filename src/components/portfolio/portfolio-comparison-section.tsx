"use client";

import { useMemo, useState } from "react";
import { PortfolioComparisonCharts } from "@/components/portfolio/portfolio-comparison-charts";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  buildPortfolioComparison,
  DEFAULT_PORTFOLIO_COMPARISON_INITIAL_CAPITAL,
  DEFAULT_PORTFOLIO_COMPARISON_PERIOD,
  DEFAULT_PORTFOLIO_COMPARISON_STRATEGY,
  getPortfolioComparisonTickers,
  getPredefinedPortfolioComparisonPresets,
  type PortfolioComparisonMetrics,
  type PortfolioComparisonResult,
} from "@/lib/finance/portfolio/comparison";
import { getRebalancingStrategyLabel } from "@/lib/finance/portfolio/rebalancing";
import { loadMarketDataExplorer } from "@/lib/market-data/client";
import type {
  MarketDataPeriod,
  MarketDataProviderMode,
  MarketDataWarning,
} from "@/lib/market-data/types";
import type { ProviderSelectorOption } from "@/lib/market-data/provider-config";
import { cn } from "@/lib/utils";

type PortfolioComparisonSectionProps = {
  providerSelectorOptions: ProviderSelectorOption[];
};

type MetricFormat = "signedPercent" | "percent" | "lossPercent" | "ratio";

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
    description: "Daily historical loss threshold exceeded in the worst 5% of observations.",
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
  providerSelectorOptions,
}: PortfolioComparisonSectionProps) {
  const [period, setPeriod] = useState<MarketDataPeriod>(
    DEFAULT_PORTFOLIO_COMPARISON_PERIOD,
  );
  const [provider, setProvider] = useState<MarketDataProviderMode>("auto");
  const [comparison, setComparison] = useState<PortfolioComparisonResult | null>(
    null,
  );
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const presets = useMemo(() => getPredefinedPortfolioComparisonPresets(), []);
  const tickers = useMemo(() => getPortfolioComparisonTickers(), []);
  const invalidPreset = presets.find((preset) => !preset.validation.isValid);
  const strategyLabel = getRebalancingStrategyLabel(
    DEFAULT_PORTFOLIO_COMPARISON_STRATEGY,
  );

  async function handleRunComparison() {
    setRequestMessage(null);

    if (invalidPreset) {
      setComparison(null);
      setRequestMessage(
        `${invalidPreset.label} portfolio is invalid: ${
          invalidPreset.validation.error ?? "Review weights."
        }`,
      );
      return;
    }

    setIsLoading(true);

    try {
      const data = await loadMarketDataExplorer({
        tickers,
        period,
        provider,
        maxTickers: tickers.length,
      });
      const result = buildPortfolioComparison({
        data,
        initialCapital: DEFAULT_PORTFOLIO_COMPARISON_INITIAL_CAPITAL,
        strategy: DEFAULT_PORTFOLIO_COMPARISON_STRATEGY,
        riskFreeRate: 0,
      });

      setComparison(result);
    } catch (error) {
      setComparison(null);
      setRequestMessage(
        error instanceof Error
          ? error.message
          : "Unable to run the portfolio comparison right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SurfaceCard tone="elevated" padding="md" className="border-border-strong/90">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
              Portfolio comparison
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground">
              Compare predefined allocations on one market-data window
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground-soft">
              Conservative, Balanced, and Aggressive portfolios are simulated
              side by side using the same aligned historical prices. Results are
              historical observations only, not forecasts.
            </p>
          </div>
          <span className="w-fit rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-foreground">
            Shared data backtest
          </span>
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-3">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="rounded-[1.35rem] border border-white/[0.08] bg-background-muted/75 px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                    {preset.label}
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-foreground">
                    {preset.name}
                  </h3>
                </div>
                <ValidationBadge
                  isValid={preset.validation.isValid}
                  totalWeight={preset.validation.totalWeight}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-foreground-soft">
                {preset.description}
              </p>
              <p className="mt-2 text-xs leading-6 text-foreground-muted">
                Source preset: {preset.sourcePresetName}
              </p>
              <div className="mt-4 grid gap-2">
                {preset.holdings.map((holding) => (
                  <div
                    key={holding.ticker}
                    className="grid grid-cols-[4.5rem_minmax(0,1fr)_3.5rem] items-center gap-3 rounded-[0.95rem] border border-white/[0.08] bg-slate-950/45 px-3 py-2"
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {holding.ticker}
                    </span>
                    <span className="min-w-0 text-xs leading-5 text-foreground-muted">
                      {holding.assetClass}
                    </span>
                    <span className="text-right text-sm font-semibold text-foreground-soft">
                      {holding.weight.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,0.45fr)_auto] lg:items-end">
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
                    setComparison(null);
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
                setComparison(null);
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
            disabled={isLoading || Boolean(invalidPreset)}
            className="rounded-[1.15rem] bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-wait disabled:bg-accent/60 lg:min-w-48"
          >
            {isLoading ? "Running comparison..." : "Run comparison"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <InfoLine label="Union tickers" value={tickers.join(", ")} />
          <InfoLine label="Initial capital" value="$100,000 each" />
          <InfoLine label="Rebalancing" value={strategyLabel} />
        </div>

        {requestMessage ? (
          <p className="mt-5 rounded-[1.15rem] border border-rose-400/30 bg-rose-400/[0.08] px-4 py-3 text-sm leading-6 text-rose-200">
            {requestMessage}
          </p>
        ) : null}

        {comparison ? (
          <div className="mt-6 space-y-5">
            <ComparisonStatus comparison={comparison} />
            <ComparisonMetricsTable comparison={comparison} />
          </div>
        ) : (
          <div className="mt-6 rounded-[1.45rem] border border-dashed border-border/80 bg-background-muted/55 px-5 py-5 text-sm leading-7 text-foreground-soft">
            Run the comparison to load one aligned dataset for all{" "}
            {tickers.length} ETF proxies and calculate side-by-side historical
            metrics.
          </div>
        )}
      </SurfaceCard>

      {comparison ? <PortfolioComparisonCharts comparison={comparison} /> : null}
    </div>
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
    <div className="space-y-3">
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
    <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
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

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/[0.08] bg-background-muted/80 px-4 py-3">
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
