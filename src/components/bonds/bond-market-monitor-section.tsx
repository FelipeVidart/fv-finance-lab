import { Card } from "@/components/card";
import { BondChartCard, BondStatusStrip } from "@/components/bonds/bond-shared";
import type { BondMarketMonitorSectionProps } from "@/components/bonds/types";
import type { MarketDataPeriod } from "@/lib/market-data/types";

const PERIOD_OPTIONS: MarketDataPeriod[] = ["1M", "3M", "6M", "1Y"];

export function BondMarketMonitorSection({
  benchmarkAvailableInSelection,
  benchmarkSymbol,
  data,
  inputHint,
  isLoading,
  marketCharts,
  marketMetricRows,
  period,
  registryCards,
  requestError,
  selectedRegistryEntries,
  statusItems,
  symbolInput,
  validationError,
  yieldSpreadRows,
  onBenchmarkChange,
  onPeriodChange,
  onSubmit,
  onSymbolInputChange,
}: BondMarketMonitorSectionProps) {
  return (
    <div
      id="market-monitor-panel"
      role="tabpanel"
      aria-labelledby="market-monitor-tab"
      className="space-y-4"
    >
      <Card
        eyebrow="Market Monitor"
        title="Bond market setup and spread snapshot"
        description="Fetch aligned bond market series, then monitor approximate YTM and benchmark spreads from the latest available prices."
      >
        <div className="space-y-5">
          <form
            className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]"
            onSubmit={onSubmit}
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
                onChange={(event) => onSymbolInputChange(event.target.value)}
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
                      onClick={() => onPeriodChange(option)}
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

          <div className="grid gap-4 xl:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
            <label className="space-y-2">
              <span className="block text-sm font-medium text-slate-100">
                Benchmark bond
              </span>
              <select
                value={benchmarkSymbol}
                onChange={(event) => onBenchmarkChange(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60"
              >
                {registryCards
                  .map((bond) => bond.metadata)
                  .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
                  .map((entry) => (
                    <option key={entry.symbol} value={entry.symbol}>
                      {entry.symbol} · {entry.displayName}
                    </option>
                  ))}
              </select>
            </label>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm leading-7 text-slate-300">
              <p>Approximate YTM is solved from the latest fetched close using local registry terms.</p>
              <p className="mt-2 text-xs leading-6 text-slate-400">
                This is a practical monitor, not an official spread or country-risk index.
              </p>
              <p className="mt-2 text-xs leading-6 text-slate-400">
                {!data
                  ? selectedRegistryEntries.length > 0
                    ? "Local metadata is available for some selected bonds, but market prices have not been loaded yet."
                    : "Fetch market data with registered symbols to populate latest price, approximate YTM, and spread."
                  : !benchmarkAvailableInSelection
                    ? "The selected benchmark is not in the current fetched set, so benchmark YTM and spreads remain unavailable."
                    : "Benchmark YTM is derived from the latest aligned market close for the selected benchmark bond."}
              </p>
            </div>
          </div>

          {requestError ? (
            <InlineState tone="error" message={requestError} />
          ) : null}

          {!requestError && isLoading && !data ? (
            <InlineState
              tone="loading"
              message="Fetching bond market history and aligning the selected series."
            />
          ) : null}

          {!requestError && !isLoading && !data ? (
            <InlineState
              tone="empty"
              message={
                selectedRegistryEntries.length > 0
                  ? `Local metadata is already available for ${selectedRegistryEntries
                      .map((entry) => entry.symbol)
                      .join(", ")}, but no market snapshot has been loaded yet.`
                  : "No fetched market snapshot is available yet. Try symbols such as US2Y, US5Y, US10Y, US30Y, or DE10Y."
              }
            />
          ) : null}

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
          ) : null}
        </div>
      </Card>

      {data ? <BondStatusStrip items={statusItems} /> : null}

      {data ? (
        <>
          <Card
            eyebrow="Market Monitor"
            title="Reference metadata"
            description="Local registry metadata is shown separately from fetched market prices."
          >
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {registryCards.map((bond) => (
                <BondMetadataCard key={bond.symbol} bond={bond} />
              ))}
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-3">
            {marketCharts.map((chart) => (
              <BondChartCard key={chart.title} {...chart} />
            ))}
          </div>

          <Card
            eyebrow="Market Monitor"
            title="Market performance snapshot"
            description="Daily return, volatility, and drawdown metrics from the aligned market series."
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
                {marketMetricRows.map((row) => (
                  <div
                    key={row.symbol}
                    className="grid grid-cols-[1.2fr_1.5fr_repeat(4,minmax(110px,1fr))] gap-3 px-4 py-3 text-sm text-slate-200 not-last:border-b not-last:border-white/10"
                  >
                    <div className="space-y-1">
                      <span className="font-semibold text-white">{row.symbol}</span>
                      <p className="text-xs text-slate-500">{row.observations} obs</p>
                    </div>
                    <span className="text-slate-300">{row.displayName}</span>
                    <span>{row.totalReturn}</span>
                    <span>{row.annualizedReturn}</span>
                    <span>{row.annualizedVolatility}</span>
                    <span className="text-rose-200">{row.maxDrawdown}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function InlineState({
  tone,
  message,
}: {
  tone: "loading" | "empty" | "error";
  message: string;
}) {
  const toneMap = {
    loading: "border-sky-400/25 bg-sky-400/[0.08] text-sky-100",
    empty: "border-white/10 bg-slate-950/60 text-slate-300",
    error: "border-rose-400/30 bg-rose-400/[0.08] text-rose-200",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneMap[tone]}`}>
      {message}
    </div>
  );
}

function BondMetadataCard({
  bond,
}: {
  bond: BondMarketMonitorSectionProps["registryCards"][number];
}) {
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
          Market data can still be requested for this symbol, but reference metadata is unavailable.
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

function YieldSpreadRowView({
  row,
}: {
  row: BondMarketMonitorSectionProps["yieldSpreadRows"][number];
}) {
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
      <span
        className={
          row.spreadBps !== null && row.spreadBps < 0
            ? "text-emerald-200"
            : "text-amber-200"
        }
      >
        {row.spreadBps !== null ? formatBasisPoints(row.spreadBps) : "—"}
      </span>
      <span className="text-slate-400">{row.note}</span>
    </div>
  );
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
