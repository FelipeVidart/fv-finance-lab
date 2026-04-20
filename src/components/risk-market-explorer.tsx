"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/card";
import { ExpandableChartCard } from "@/components/expandable-chart-card";
import {
  LineChartPanel,
  type LineChartSeries,
} from "@/components/line-chart-panel";
import { buildPortfolioAnalytics } from "@/lib/finance/portfolio";
import { parseTickerInput } from "@/lib/market-data/request";
import type {
  MarketDataPeriod,
  MarketDataRouteResponse,
  MarketDataExplorerPayload,
} from "@/lib/market-data/types";

const PERIOD_OPTIONS: MarketDataPeriod[] = ["1M", "3M", "6M", "1Y"];
const SERIES_COLORS = ["#7dd3fc", "#38bdf8", "#22d3ee", "#a78bfa", "#f59e0b"];
const PORTFOLIO_COLOR = "#f59e0b";
const DEFAULT_TICKER_INPUT = "AAPL, MSFT, NVDA";

type ChartKey = "normalized" | "cumulativeReturns" | "drawdowns";

type ExplorerChartProps = {
  title: string;
  description: string;
  data: MarketDataExplorerPayload;
  seriesKey: ChartKey;
  valueFormatter: (value: number) => string;
};

type SeriesChartProps = {
  title: string;
  description: string;
  dates: string[];
  series: LineChartSeries[];
  valueFormatter: (value: number) => string;
};

type WeightState = Record<string, string>;

export function RiskMarketExplorer() {
  const [tickerInput, setTickerInput] = useState(DEFAULT_TICKER_INPUT);
  const [period, setPeriod] = useState<MarketDataPeriod>("6M");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<MarketDataExplorerPayload | null>(null);
  const [weightInputs, setWeightInputs] = useState<WeightState>({});

  useEffect(() => {
    void loadMarketData(DEFAULT_TICKER_INPUT, "6M");
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

  function updateWeightInput(ticker: string, value: string) {
    setWeightInputs((current) => ({ ...current, [ticker]: value }));
  }

  function applyEqualWeights() {
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
  const weightValidation = useMemo(() => {
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
  const comparisonSeries = useMemo(() => {
    if (!data || !portfolioAnalytics) {
      return [];
    }

    return [
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
  }, [data, portfolioAnalytics]);

  return (
    <section className="space-y-4">
      <Card
        eyebrow="Market Data Explorer"
        title="Compare daily price performance across up to five equities"
        description="This first risk workflow pulls server-side daily history, aligns the selected tickers onto a common date base, and surfaces return, volatility, and drawdown context for later portfolio analysis."
      >
        <form
          className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <label
              htmlFor="risk-tickers"
              className="text-sm font-medium text-slate-100"
            >
              Tickers
            </label>
            <input
              id="risk-tickers"
              type="text"
              value={tickerInput}
              onChange={(event) => {
                setTickerInput(event.target.value);
                setValidationError(null);
              }}
              placeholder="AAPL, MSFT, NVDA"
              className={`w-full rounded-2xl border bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition ${
                validationError
                  ? "border-rose-400/70 focus:border-rose-300"
                  : "border-white/10 focus:border-sky-400/60"
              }`}
            />
            <div className="space-y-1">
              <p className="text-xs leading-6 text-slate-400">
                Use 1 to 5 comma-separated tickers. Example: AAPL, MSFT, NVDA.
              </p>
              <p className="text-xs leading-6 text-slate-500">{inputHint}</p>
              {validationError ? (
                <p className="text-xs leading-6 text-rose-300">
                  {validationError}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2 xl:min-w-56">
            <span className="text-sm font-medium text-slate-100">Period</span>
            <div className="grid grid-cols-4 gap-2 xl:grid-cols-2">
              {PERIOD_OPTIONS.map((option) => {
                const isActive = period === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPeriod(option)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "border-sky-400/70 bg-sky-400/15 text-sky-100"
                        : "border-white/10 bg-slate-950/60 text-slate-300 hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-wait disabled:bg-sky-400/70"
            >
              {isLoading ? "Loading data..." : "Fetch market data"}
            </button>
          </div>
        </form>
      </Card>

      {requestError ? (
        <Card
          eyebrow="Request Status"
          title="Market data could not be loaded"
          description={requestError}
        />
      ) : null}

      {isLoading && !data ? (
        <Card
          eyebrow="Loading"
          title="Fetching daily history"
          description="The explorer is requesting server-side daily price data and preparing normalized return and drawdown analytics."
        />
      ) : null}

      <Card
        eyebrow="Portfolio Sandbox"
        title="Combine the loaded assets into a manual portfolio"
        description="This sandbox uses the already fetched and aligned market data as its investable universe. It is the foundation for future portfolio risk and asset allocation analysis."
      >
        {!data ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-5">
              <p className="text-sm font-semibold text-white">
                Portfolio workflow
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                1. Fetch market data for up to five tickers above.
              </p>
              <p className="text-sm leading-7 text-slate-300">
                2. Assign manual weights to the loaded assets.
              </p>
              <p className="text-sm leading-7 text-slate-300">
                3. Review portfolio NAV, return, volatility, and drawdown against
                the component assets.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-5">
              <p className="text-sm font-semibold text-white">
                What is missing right now
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                The portfolio sandbox needs a successfully loaded aligned market
                dataset before it can calculate portfolio returns. Fetch market
                data first to unlock weights, portfolio metrics, and comparison
                charts.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
                  <div className="min-w-[560px]">
                    <div className="grid grid-cols-[1.1fr_0.9fr_1fr_1fr] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <span>Ticker</span>
                      <span>Latest price</span>
                      <span>Weight</span>
                      <span>Weight share</span>
                    </div>
                    {data.metrics.map((metric) => (
                      <div
                        key={metric.ticker}
                        className="grid grid-cols-[1.1fr_0.9fr_1fr_1fr] gap-3 px-4 py-3 text-sm text-slate-200 not-last:border-b not-last:border-white/10"
                      >
                        <div className="space-y-1">
                          <span className="font-semibold text-white">
                            {metric.ticker}
                          </span>
                          <p className="text-xs text-slate-500">
                            {metric.observations} obs
                          </p>
                        </div>
                        <span>{formatNumber(metric.endPrice)}</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={weightInputs[metric.ticker] ?? ""}
                          onChange={(event) =>
                            updateWeightInput(metric.ticker, event.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400/60"
                        />
                        <span className="text-slate-400">
                          {weightInputs[metric.ticker]
                            ? `${Number(weightInputs[metric.ticker]).toFixed(2)}%`
                            : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={applyEqualWeights}
                    className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                  >
                    Equal weight
                  </button>
                  <button
                    type="button"
                    onClick={applyEqualWeights}
                    className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.04]"
                  >
                    Reset weights
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Weight validation
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {weightValidation
                      ? `${weightValidation.totalPercent.toFixed(2)}%`
                      : "—"}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Total portfolio weight must sum to 100% before portfolio
                    analytics are enabled.
                  </p>
                  {weightValidation && !weightValidation.isValid ? (
                    <p className="mt-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3 text-sm text-amber-200">
                      {weightValidation.error}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-sm font-semibold text-white">
                    Portfolio construction assumption
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    The sandbox combines aligned daily asset returns using the
                    entered weights as a fixed-weight daily return mix, then
                    compounds those returns into a normalized portfolio NAV.
                  </p>
                </div>
              </div>
            </div>

            {portfolioAnalytics ? null : (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3 text-sm text-amber-200">
                Portfolio charts and metrics are disabled until the loaded data has
                enough aligned observations and the entered weights are valid.
              </div>
            )}
          </div>
        )}
      </Card>

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatChip
              label="Common Start"
              value={formatDateLabel(data.meta.commonStartDate)}
            />
            <StatChip
              label="Common End"
              value={formatDateLabel(data.meta.commonEndDate)}
            />
            <StatChip
              label="Observations"
              value={data.meta.observations.toString()}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <ExplorerLineChartCard
              title="Normalized Price"
              description="Each line starts at 100 on the first shared trading day."
              data={data}
              seriesKey="normalized"
              valueFormatter={(value) => value.toFixed(1)}
            />
            <ExplorerLineChartCard
              title="Cumulative Return"
              description="Total return since the shared start date."
              data={data}
              seriesKey="cumulativeReturns"
              valueFormatter={formatPercent}
            />
            <ExplorerLineChartCard
              title="Drawdown"
              description="Peak-to-trough decline from each ticker's running high."
              data={data}
              seriesKey="drawdowns"
              valueFormatter={formatPercent}
            />
          </div>

          <Card
            eyebrow="Summary Metrics"
            title="Return, volatility, and drawdown snapshot"
            description="Metrics are calculated from the aligned daily close series returned by the server-side market data layer."
          >
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[1.1fr_repeat(4,minmax(110px,1fr))] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <span>Ticker</span>
                  <span>Total return</span>
                  <span>Annualized return</span>
                  <span>Annualized vol</span>
                  <span>Max drawdown</span>
                </div>
                {data.metrics.map((metric) => (
                  <div
                    key={metric.ticker}
                    className="grid grid-cols-[1.1fr_repeat(4,minmax(110px,1fr))] gap-3 px-4 py-3 text-sm text-slate-200 not-last:border-b not-last:border-white/10"
                  >
                    <div className="space-y-1">
                      <span className="font-semibold text-white">
                        {metric.ticker}
                      </span>
                      <p className="text-xs text-slate-500">
                        {metric.observations} obs
                      </p>
                    </div>
                    <span>{formatPercent(metric.totalReturn)}</span>
                    <span>{formatPercent(metric.annualizedReturn)}</span>
                    <span>{formatPercent(metric.annualizedVolatility)}</span>
                    <span className="text-rose-200">
                      {formatPercent(metric.maxDrawdown)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {portfolioAnalytics ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <StatChip
                  label="Portfolio return"
                  value={formatPercent(portfolioAnalytics.metrics.totalReturn)}
                />
                <StatChip
                  label="Annualized return"
                  value={formatPercent(
                    portfolioAnalytics.metrics.annualizedReturn,
                  )}
                />
                <StatChip
                  label="Annualized vol"
                  value={formatPercent(
                    portfolioAnalytics.metrics.annualizedVolatility,
                  )}
                />
                <StatChip
                  label="Max drawdown"
                  value={formatPercent(portfolioAnalytics.metrics.maxDrawdown)}
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <SeriesLineChartCard
                  title="Portfolio NAV"
                  description="Normalized portfolio NAV built from the weighted daily return series."
                  dates={portfolioAnalytics.points.map((point) => point.date)}
                  series={[
                    {
                      label: "Portfolio",
                      values: portfolioAnalytics.points.map((point) => point.nav),
                      color: PORTFOLIO_COLOR,
                    },
                  ]}
                  valueFormatter={(value) => value.toFixed(1)}
                />
                <SeriesLineChartCard
                  title="Portfolio Drawdown"
                  description="Running drawdown of the portfolio NAV."
                  dates={portfolioAnalytics.points.map((point) => point.date)}
                  series={[
                    {
                      label: "Portfolio",
                      values: portfolioAnalytics.points.map(
                        (point) => point.drawdown,
                      ),
                      color: PORTFOLIO_COLOR,
                    },
                  ]}
                  valueFormatter={formatPercent}
                />
                <SeriesLineChartCard
                  title="Portfolio vs Assets"
                  description="Portfolio cumulative return compared with the currently selected assets."
                  dates={portfolioAnalytics.points.map((point) => point.date)}
                  series={comparisonSeries}
                  valueFormatter={formatPercent}
                />
              </div>

              <Card
                eyebrow="Portfolio Summary"
                title="Weights and latest portfolio snapshot"
                description="This table summarizes the active manual weights and the latest aligned market price for each component asset in the sandbox."
              >
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
                  <div className="min-w-[640px]">
                    <div className="grid grid-cols-[1.1fr_1fr_1fr_1fr] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <span>Ticker</span>
                      <span>Weight</span>
                      <span>Latest price</span>
                      <span>Total return</span>
                    </div>
                    {data.metrics.map((metric) => (
                      <div
                        key={metric.ticker}
                        className="grid grid-cols-[1.1fr_1fr_1fr_1fr] gap-3 px-4 py-3 text-sm text-slate-200 not-last:border-b not-last:border-white/10"
                      >
                        <span className="font-semibold text-white">
                          {metric.ticker}
                        </span>
                        <span>
                          {weightValidation?.weights
                            ? `${(
                                weightValidation.weights[metric.ticker] * 100
                              ).toFixed(2)}%`
                            : "—"}
                        </span>
                        <span>{formatNumber(metric.endPrice)}</span>
                        <span>{formatPercent(metric.totalReturn)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function ExplorerLineChartCard({
  title,
  description,
  data,
  seriesKey,
  valueFormatter,
}: ExplorerChartProps) {
  return (
    <SeriesLineChartCard
      title={title}
      description={description}
      dates={data.points.map((point) => point.date)}
      series={data.tickers.map((ticker, index) => ({
        label: ticker,
        values: data.points.map((point) => point[seriesKey][ticker]),
        color: SERIES_COLORS[index % SERIES_COLORS.length],
      }))}
      valueFormatter={valueFormatter}
    />
  );
}

function SeriesLineChartCard({
  title,
  description,
  dates,
  series,
  valueFormatter,
}: SeriesChartProps) {
  return (
    <ExpandableChartCard
      title={title}
      description={description}
      renderPreview={({ open }) => (
        <LineChartPanel
          title={title}
          dates={dates}
          series={series}
          valueFormatter={valueFormatter}
          onChartClick={open}
        />
      )}
      detail={
        <LineChartPanel
          title={title}
          dates={dates}
          series={series}
          valueFormatter={valueFormatter}
          heightClassName="h-[24rem] sm:h-[32rem] lg:h-[40rem]"
          interactive
          showSummary
        />
      }
    />
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
