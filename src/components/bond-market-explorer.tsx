"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/card";
import { ExpandableChartCard } from "@/components/expandable-chart-card";
import {
  LineChartPanel,
  type LineChartSeries,
} from "@/components/line-chart-panel";
import { buildBondYieldSpreadRows } from "@/lib/bonds/analytics";
import { getBondRegistry } from "@/lib/bonds/registry";
import type {
  BondExplorerRecord,
  BondMarketDataRouteResponse,
  BondMarketExplorerPayload,
  BondYieldSpreadRow,
} from "@/lib/bonds/types";
import { parseTickerInput } from "@/lib/market-data/request";
import type { MarketDataPeriod } from "@/lib/market-data/types";

const PERIOD_OPTIONS: MarketDataPeriod[] = ["1M", "3M", "6M", "1Y"];
const SERIES_COLORS = ["#7dd3fc", "#38bdf8", "#22d3ee", "#a78bfa", "#f59e0b"];
const DEFAULT_SYMBOL_INPUT = "US2Y, US5Y, US10Y";
const DEFAULT_BENCHMARK_SYMBOL = "US10Y";
const REGISTRY_OPTIONS = getBondRegistry();

type ChartKey = "normalized" | "cumulativeReturns" | "drawdowns";

type ChartProps = {
  title: string;
  description: string;
  data: BondMarketExplorerPayload;
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

export function BondMarketExplorer() {
  const [symbolInput, setSymbolInput] = useState(DEFAULT_SYMBOL_INPUT);
  const [period, setPeriod] = useState<MarketDataPeriod>("6M");
  const [benchmarkSymbol, setBenchmarkSymbol] = useState(DEFAULT_BENCHMARK_SYMBOL);
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
  const yieldSpreadRows = useMemo(() => {
    if (!data) {
      return [];
    }

    return buildBondYieldSpreadRows({
      bonds: data.bonds,
      marketData: data.marketData,
      benchmarkSymbol,
    });
  }, [benchmarkSymbol, data]);
  const benchmarkAvailableInSelection = useMemo(() => {
    return Boolean(data?.bonds.some((bond) => bond.symbol === benchmarkSymbol));
  }, [benchmarkSymbol, data]);
  const selectedSymbols = useMemo(() => {
    const parsed = parseTickerInput(symbolInput);

    return parsed.tickers ?? [];
  }, [symbolInput]);
  const selectedRegistryEntries = useMemo(() => {
    return selectedSymbols
      .map((symbol) => REGISTRY_OPTIONS.find((entry) => entry.symbol === symbol))
      .filter((entry): entry is (typeof REGISTRY_OPTIONS)[number] => Boolean(entry));
  }, [selectedSymbols]);

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

      <Card
        eyebrow="Yield and Spread"
        title="Latest YTM and benchmark spread snapshot"
        description="This layer estimates approximate YTM from the latest fetched market price for bonds that also have local metadata, then compares each selected bond against a chosen local benchmark."
      >
        <div className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
            <label className="space-y-2">
              <span className="block text-sm font-medium text-slate-100">
                Benchmark bond
              </span>
              <select
                value={benchmarkSymbol}
                onChange={(event) => setBenchmarkSymbol(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60"
              >
                {REGISTRY_OPTIONS.map((entry) => (
                  <option key={entry.symbol} value={entry.symbol}>
                    {entry.symbol} · {entry.displayName}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm leading-7 text-slate-300">
              <p>
                This snapshot is a spread monitor and sovereign-risk proxy
                foundation, not an official EMBI or official country risk
                measure.
              </p>
              <p className="mt-2 text-xs leading-6 text-slate-400">
                Approximate YTM treats the latest fetched close as a bond price
                input and solves a plain fixed-rate bond yield from the local
                registry terms.
              </p>
              <p className="mt-2 text-xs leading-6 text-slate-400">
                {!data
                  ? selectedRegistryEntries.length > 0
                    ? "Local metadata is already available for some selected bonds, but market data must load before latest price, benchmark YTM, and spread can be computed."
                    : "Enter bond symbols and fetch market data to populate the latest price, approximate YTM, benchmark YTM, and spread columns."
                  : !benchmarkAvailableInSelection
                    ? "The chosen benchmark is not in the current fetched selection, so benchmark YTM and spreads will remain unavailable until that symbol is included."
                    : "Benchmark YTM is derived from the latest aligned market close for the selected benchmark bond."}
              </p>
            </div>
          </div>

          {data ? (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
              <div className="min-w-[980px]">
                <div className="grid grid-cols-[1.05fr_1.1fr_1fr_1fr_1fr_0.9fr_1.6fr] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <span>Symbol</span>
                  <span>Latest price</span>
                  <span>Approx YTM</span>
                  <span>Benchmark</span>
                  <span>Benchmark YTM</span>
                  <span>Spread</span>
                  <span>Status</span>
                </div>
                {yieldSpreadRows.map((row) => (
                  <YieldSpreadRowView key={row.symbol} row={row} />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-5">
                <p className="text-sm font-semibold text-white">
                  Yield and spread workflow
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  1. Select bond symbols that have local metadata.
                </p>
                <p className="text-sm leading-7 text-slate-300">
                  2. Fetch market data to load the latest close for each bond.
                </p>
                <p className="text-sm leading-7 text-slate-300">
                  3. Use the benchmark selector to compare approximate YTM and
                  spread in basis points.
                </p>
              </div>

              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-5">
                <p className="text-sm font-semibold text-white">
                  What is missing right now
                </p>
                {selectedRegistryEntries.length > 0 ? (
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Local metadata is available for{" "}
                    {selectedRegistryEntries.map((entry) => entry.symbol).join(", ")},
                    but no fetched market price history is available yet for the
                    current session, so latest price, approximate YTM, benchmark
                    YTM, and spread cannot be shown.
                  </p>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Neither fetched market data nor matching local metadata is
                    available for the current symbol input. Try registered symbols
                    such as `US2Y`, `US5Y`, `US10Y`, `US30Y`, or `DE10Y`.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

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
                  const bond = data.bonds.find(
                    (entry) => entry.symbol === metric.ticker,
                  );

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

function YieldSpreadRowView({ row }: { row: BondYieldSpreadRow }) {
  return (
    <div className="grid grid-cols-[1.05fr_1.1fr_1fr_1fr_1fr_0.9fr_1.6fr] gap-3 px-4 py-3 text-sm text-slate-200 not-last:border-b not-last:border-white/10">
      <div className="space-y-1">
        <span className="font-semibold text-white">{row.symbol}</span>
        <p className="text-xs text-slate-500">
          {row.displayName ?? "No local metadata"}
        </p>
      </div>
      <span>{row.latestPrice !== null ? formatPrice(row.latestPrice) : "—"}</span>
      <span>
        {row.approximateYtm !== null
          ? formatUnsignedPercent(row.approximateYtm)
          : "—"}
      </span>
      <span>{row.benchmarkSymbol}</span>
      <span>
        {row.benchmarkYtm !== null
          ? formatUnsignedPercent(row.benchmarkYtm)
          : "—"}
      </span>
      <span className={row.spreadBps !== null && row.spreadBps < 0 ? "text-emerald-200" : "text-amber-200"}>
        {row.spreadBps !== null ? formatBasisPoints(row.spreadBps) : "—"}
      </span>
      <span className="text-slate-400">{row.note}</span>
    </div>
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
  return (
    <BondSeriesLineChartCard
      title={title}
      description={description}
      dates={data.marketData.points.map((point) => point.date)}
      series={data.marketData.tickers.map((ticker, index) => ({
        label: ticker,
        values: data.marketData.points.map((point) => point[seriesKey][ticker]),
        color: SERIES_COLORS[index % SERIES_COLORS.length],
      }))}
      valueFormatter={valueFormatter}
    />
  );
}

function BondSeriesLineChartCard({
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

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

function formatUnsignedPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatBasisPoints(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(0)} bps`;
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

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}
