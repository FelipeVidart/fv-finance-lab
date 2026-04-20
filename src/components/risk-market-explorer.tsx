"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Card } from "@/components/card";
import { parseTickerInput } from "@/lib/market-data/request";
import type {
  MarketDataPeriod,
  MarketDataRouteResponse,
  MarketDataExplorerPayload,
} from "@/lib/market-data/types";

const PERIOD_OPTIONS: MarketDataPeriod[] = ["1M", "3M", "6M", "1Y"];

const SERIES_COLORS = ["#7dd3fc", "#38bdf8", "#22d3ee", "#a78bfa", "#f59e0b"];

const DEFAULT_TICKER_INPUT = "AAPL, MSFT, NVDA";

type ChartKey = "normalized" | "cumulativeReturns" | "drawdowns";

type ChartProps = {
  title: string;
  description: string;
  data: MarketDataExplorerPayload;
  seriesKey: ChartKey;
  valueFormatter: (value: number) => string;
};

export function RiskMarketExplorer() {
  const [tickerInput, setTickerInput] = useState(DEFAULT_TICKER_INPUT);
  const [period, setPeriod] = useState<MarketDataPeriod>("6M");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<MarketDataExplorerPayload | null>(null);

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
    } catch (error) {
      setData(null);
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

  const inputHint = useMemo(() => {
    const parsed = parseTickerInput(tickerInput);

    if (!parsed.tickers) {
      return "Enter 1 to 5 comma-separated tickers.";
    }

    return `Tracking ${parsed.tickers.length} unique ticker${
      parsed.tickers.length === 1 ? "" : "s"
    }: ${parsed.tickers.join(", ")}`;
  }, [tickerInput]);

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
            <LineChartCard
              title="Normalized Price"
              description="Each line starts at 100 on the first shared trading day."
              data={data}
              seriesKey="normalized"
              valueFormatter={(value) => value.toFixed(1)}
            />
            <LineChartCard
              title="Cumulative Return"
              description="Total return since the shared start date."
              data={data}
              seriesKey="cumulativeReturns"
              valueFormatter={formatPercent}
            />
            <LineChartCard
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

function LineChartCard({
  title,
  description,
  data,
  seriesKey,
  valueFormatter,
}: ChartProps) {
  const chartId = useId();
  const allValues = data.points.flatMap((point) =>
    data.tickers.map((ticker) => point[seriesKey][ticker]),
  );
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const domainPadding =
    minValue === maxValue
      ? Math.max(Math.abs(minValue) * 0.1, 1)
      : (maxValue - minValue) * 0.12;
  const yMin = minValue - domainPadding;
  const yMax = maxValue + domainPadding;

  return (
    <Card
      eyebrow="Chart"
      title={title}
      description={description}
      className="h-full"
    >
      <div className="space-y-5">
        <div className="h-72 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <svg
            viewBox="0 0 640 260"
            className="h-full w-full"
            role="img"
            aria-labelledby={chartId}
          >
            <title id={chartId}>{title}</title>
            {[0, 1, 2, 3].map((index) => {
              const y = 20 + index * 70;
              const gridValue = yMax - ((y - 20) / 210) * (yMax - yMin);

              return (
                <g key={index}>
                  <line
                    x1="50"
                    y1={y}
                    x2="610"
                    y2={y}
                    stroke="rgba(148, 163, 184, 0.16)"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y={y + 4}
                    fill="rgba(203, 213, 225, 0.75)"
                    fontSize="11"
                  >
                    {valueFormatter(gridValue)}
                  </text>
                </g>
              );
            })}

            {data.tickers.map((ticker, index) => {
              const values = data.points.map((point) => point[seriesKey][ticker]);
              const path = buildPath(values, yMin, yMax);

              return (
                <path
                  key={ticker}
                  d={path}
                  fill="none"
                  stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            <line
              x1="50"
              y1="230"
              x2="610"
              y2="230"
              stroke="rgba(148, 163, 184, 0.25)"
              strokeWidth="1"
            />
            <text
              x="50"
              y="250"
              fill="rgba(148, 163, 184, 0.75)"
              fontSize="11"
            >
              {formatDateLabel(data.meta.commonStartDate)}
            </text>
            <text
              x="610"
              y="250"
              textAnchor="end"
              fill="rgba(148, 163, 184, 0.75)"
              fontSize="11"
            >
              {formatDateLabel(data.meta.commonEndDate)}
            </text>
          </svg>
        </div>

        <div className="flex flex-wrap gap-3">
          {data.tickers.map((ticker, index) => (
            <div
              key={ticker}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-300"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length],
                }}
              />
              <span>{ticker}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function buildPath(values: number[], yMin: number, yMax: number): string {
  return values
    .map((value, index) => {
      const x = 50 + (index / Math.max(values.length - 1, 1)) * 560;
      const y = 230 - ((value - yMin) / Math.max(yMax - yMin, 1e-9)) * 210;
      const command = index === 0 ? "M" : "L";

      return `${command} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
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
