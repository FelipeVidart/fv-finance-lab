"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Card } from "@/components/card";
import type {
  BondExplorerRecord,
  BondMarketDataRouteResponse,
  BondMarketExplorerPayload,
} from "@/lib/bonds/types";
import { parseTickerInput } from "@/lib/market-data/request";
import type { MarketDataPeriod } from "@/lib/market-data/types";

const PERIOD_OPTIONS: MarketDataPeriod[] = ["1M", "3M", "6M", "1Y"];
const SERIES_COLORS = ["#7dd3fc", "#38bdf8", "#22d3ee", "#a78bfa", "#f59e0b"];
const DEFAULT_SYMBOL_INPUT = "US2Y, US5Y, US10Y";

type ChartKey = "normalized" | "cumulativeReturns" | "drawdowns";

type ChartProps = {
  title: string;
  description: string;
  data: BondMarketExplorerPayload;
  seriesKey: ChartKey;
  valueFormatter: (value: number) => string;
};

export function BondMarketExplorer() {
  const [symbolInput, setSymbolInput] = useState(DEFAULT_SYMBOL_INPUT);
  const [period, setPeriod] = useState<MarketDataPeriod>("6M");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<BondMarketExplorerPayload | null>(null);

  useEffect(() => {
    void loadBondMarketData(DEFAULT_SYMBOL_INPUT, "6M");
  }, []);

  async function loadBondMarketData(
    nextSymbolInput: string,
    nextPeriod: MarketDataPeriod,
  ) {
    const parsed = parseTickerInput(nextSymbolInput);

    if (!parsed.tickers) {
      setValidationError(parsed.error ?? "Enter valid bond symbols.");
      setRequestError(null);
      setData(null);
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

      setData(payload.data);
    } catch (error) {
      setData(null);
      setRequestError(
        error instanceof Error
          ? error.message
          : "Unable to load bond market data right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadBondMarketData(symbolInput, period);
  }

  const inputHint = useMemo(() => {
    const parsed = parseTickerInput(symbolInput);

    if (!parsed.tickers) {
      return "Enter 1 to 5 comma-separated bond symbols.";
    }

    return `Tracking ${parsed.tickers.length} unique symbol${
      parsed.tickers.length === 1 ? "" : "s"
    }: ${parsed.tickers.join(", ")}`;
  }, [symbolInput]);

  return (
    <section className="space-y-4">
      <Card
        eyebrow="Bond Market Explorer"
        title="Monitor daily bond market moves with separate local reference metadata"
        description="This explorer fetches daily bond market time series server-side while keeping manual bond reference metadata in a local registry. It is a clean foundation for later yield, spread, and sovereign-risk proxy analysis."
      >
        <form
          className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <label
              htmlFor="bond-symbols"
              className="text-sm font-medium text-slate-100"
            >
              Bond symbols
            </label>
            <input
              id="bond-symbols"
              type="text"
              value={symbolInput}
              onChange={(event) => {
                setSymbolInput(event.target.value);
                setValidationError(null);
              }}
              placeholder="US2Y, US5Y, US10Y"
              className={`w-full rounded-2xl border bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition ${
                validationError
                  ? "border-rose-400/70 focus:border-rose-300"
                  : "border-white/10 focus:border-sky-400/60"
              }`}
            />
            <div className="space-y-1">
              <p className="text-xs leading-6 text-slate-400">
                Use 1 to 5 comma-separated symbols. Example: US2Y, US5Y, US10Y.
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
              {isLoading ? "Loading data..." : "Fetch bond data"}
            </button>
          </div>
        </form>
      </Card>

      {requestError ? (
        <Card
          eyebrow="Request Status"
          title="Bond market data could not be loaded"
          description={requestError}
        />
      ) : null}

      {isLoading && !data ? (
        <Card
          eyebrow="Loading"
          title="Fetching bond market history"
          description="The explorer is requesting server-side daily bond market data and aligning the series for return and drawdown analysis."
        />
      ) : null}

      {data ? (
        <>
          <Card
            eyebrow="Registry Note"
            title="Local metadata and fetched market data are separate layers"
            description={data.meta.note}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <StatChip
                label="Registry entries"
                value={data.meta.registrySize.toString()}
              />
              <StatChip
                label="Metadata found"
                value={data.meta.metadataAvailable.toString()}
              />
              <StatChip
                label="Metadata missing"
                value={data.meta.metadataMissing.toString()}
              />
            </div>
          </Card>

          <Card
            eyebrow="Local Registry"
            title="Selected bond reference metadata"
            description="These cards come from the local bond registry, not from the market data provider."
          >
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {data.bonds.map((bond) => (
                <BondMetadataCard key={bond.symbol} bond={bond} />
              ))}
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <StatChip
              label="Common Start"
              value={formatDateLabel(data.marketData.meta.commonStartDate)}
            />
            <StatChip
              label="Common End"
              value={formatDateLabel(data.marketData.meta.commonEndDate)}
            />
            <StatChip
              label="Observations"
              value={data.marketData.meta.observations.toString()}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <BondLineChartCard
              title="Normalized Price"
              description="Each bond series starts at 100 on the first shared day in the selected period."
              data={data}
              seriesKey="normalized"
              valueFormatter={(value) => value.toFixed(1)}
            />
            <BondLineChartCard
              title="Cumulative Return"
              description="Total return from the shared starting point of the aligned market series."
              data={data}
              seriesKey="cumulativeReturns"
              valueFormatter={formatSignedPercent}
            />
            <BondLineChartCard
              title="Drawdown"
              description="Peak-to-trough decline from each bond series' running high."
              data={data}
              seriesKey="drawdowns"
              valueFormatter={formatSignedPercent}
            />
          </div>

          <Card
            eyebrow="Market Summary"
            title="Daily market performance by bond symbol"
            description="These return and drawdown metrics are computed from the fetched daily close series after the selected bonds are aligned to a shared date set."
          >
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
              <div className="min-w-[860px]">
                <div className="grid grid-cols-[1.2fr_1.5fr_repeat(4,minmax(110px,1fr))] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <span>Symbol</span>
                  <span>Reference name</span>
                  <span>Total return</span>
                  <span>Annualized return</span>
                  <span>Annualized vol</span>
                  <span>Max drawdown</span>
                </div>
                {data.marketData.metrics.map((metric) => {
                  const bond = data.bonds.find((entry) => entry.symbol === metric.ticker);

                  return (
                    <div
                      key={metric.ticker}
                      className="grid grid-cols-[1.2fr_1.5fr_repeat(4,minmax(110px,1fr))] gap-3 px-4 py-3 text-sm text-slate-200 not-last:border-b not-last:border-white/10"
                    >
                      <div className="space-y-1">
                        <span className="font-semibold text-white">
                          {metric.ticker}
                        </span>
                        <p className="text-xs text-slate-500">
                          {metric.observations} obs
                        </p>
                      </div>
                      <span className="text-slate-300">
                        {bond?.metadata?.displayName ?? "No local metadata"}
                      </span>
                      <span>{formatSignedPercent(metric.totalReturn)}</span>
                      <span>{formatSignedPercent(metric.annualizedReturn)}</span>
                      <span>
                        {formatUnsignedPercent(metric.annualizedVolatility)}
                      </span>
                      <span className="text-rose-200">
                        {formatSignedPercent(metric.maxDrawdown)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </section>
  );
}

function BondMetadataCard({ bond }: { bond: BondExplorerRecord }) {
  if (!bond.metadata) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">{bond.symbol}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Local metadata missing
            </p>
          </div>
          <MetadataBadge label="No registry entry" />
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          Market data can still be requested for this symbol, but no local bond
          reference record is currently registered.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">{bond.symbol}</p>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Local reference metadata
          </p>
        </div>
        <MetadataBadge label="Registry" />
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-slate-100">
            {bond.metadata.displayName}
          </p>
          <p className="text-xs leading-6 text-slate-400">
            {bond.metadata.issuer}
          </p>
        </div>
        <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Currency
            </p>
            <p>{bond.metadata.currency}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Face value
            </p>
            <p>{formatNumber(bond.metadata.faceValue)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Coupon rate
            </p>
            <p>{formatUnsignedPercent(bond.metadata.couponRate)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Payments / year
            </p>
            <p>{bond.metadata.paymentsPerYear}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Maturity date
            </p>
            <p>{formatDateLabel(bond.metadata.maturityDate)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetadataBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-sky-400/25 bg-sky-400/[0.10] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">
      {label}
    </span>
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

function BondLineChartCard({
  title,
  description,
  data,
  seriesKey,
  valueFormatter,
}: ChartProps) {
  const chartId = useId();
  const allValues = data.marketData.points.flatMap((point) =>
    data.marketData.tickers.map((ticker) => point[seriesKey][ticker]),
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

            {data.marketData.tickers.map((ticker, index) => {
              const values = data.marketData.points.map(
                (point) => point[seriesKey][ticker],
              );
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
              {formatDateLabel(data.marketData.meta.commonStartDate)}
            </text>
            <text
              x="610"
              y="250"
              textAnchor="end"
              fill="rgba(148, 163, 184, 0.75)"
              fontSize="11"
            >
              {formatDateLabel(data.marketData.meta.commonEndDate)}
            </text>
          </svg>
        </div>

        <div className="flex flex-wrap gap-3">
          {data.marketData.tickers.map((ticker, index) => (
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
