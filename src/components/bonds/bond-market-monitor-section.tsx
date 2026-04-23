import { Card } from "@/components/card";
import { BondChartCard, BondStatusStrip } from "@/components/bonds/bond-shared";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
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
      className="space-y-6"
    >
      <Card
        eyebrow="Market Monitor"
        title="Bond market setup and spread monitor"
        description="Fetch aligned bond market series, then monitor approximate YTM and benchmark spread context from the latest available prices."
        tone="elevated"
      >
        <div className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
            <SurfaceCard padding="sm" className="border-white/[0.08]">
              <form className="space-y-5" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                    Market universe
                  </p>
                  <p className="text-sm leading-6 text-foreground-soft">
                    Select the benchmark set to align the market monitor around the instruments you want to track.
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="bond-symbols"
                    className="text-sm font-semibold text-foreground"
                  >
                    Bond symbols
                  </label>
                  <input
                    id="bond-symbols"
                    type="text"
                    value={symbolInput}
                    onChange={(event) => onSymbolInputChange(event.target.value)}
                    placeholder="US2Y, US5Y, US10Y"
                    className={cn(
                      "w-full rounded-[1.15rem] border bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition",
                      validationError
                        ? "border-rose-400/70 focus:border-rose-300"
                        : "border-white/10 focus:border-accent/60",
                    )}
                  />
                  <div className="space-y-1">
                    <p className="text-xs leading-6 text-foreground-muted">
                      Use 1 to 5 comma-separated symbols. Example: US2Y, US5Y, US10Y.
                    </p>
                    <p className="text-xs leading-6 text-foreground-subtle">{inputHint}</p>
                    {validationError ? (
                      <p className="text-xs leading-6 text-rose-300">
                        {validationError}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,0.88fr)]">
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">Period</span>
                    <div className="grid grid-cols-4 gap-2">
                      {PERIOD_OPTIONS.map((option) => {
                        const isActive = period === option;

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => onPeriodChange(option)}
                            className={cn(
                              "rounded-[1.1rem] border px-4 py-3 text-sm font-semibold transition",
                              isActive
                                ? "border-accent/40 bg-accent/12 text-accent-foreground"
                                : "border-white/[0.08] bg-slate-950/55 text-slate-300 hover:border-border-strong/80 hover:bg-white/[0.04]",
                            )}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">
                      Action
                    </span>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-[1.2rem] bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-wait disabled:bg-accent/60"
                    >
                      {isLoading ? "Loading data..." : "Fetch bond data"}
                    </button>
                  </div>
                </div>
              </form>
            </SurfaceCard>

            <div className="space-y-4">
              <SurfaceCard padding="sm" className="border-white/[0.08]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                  Benchmark context
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground-soft">
                  Benchmark YTM and spread views are derived from the latest aligned market close for the selected reference bond.
                </p>
                <label className="mt-4 block space-y-2">
                  <span className="block text-sm font-semibold text-foreground">
                    Benchmark bond
                  </span>
                  <select
                    value={benchmarkSymbol}
                    onChange={(event) => onBenchmarkChange(event.target.value)}
                    className="w-full rounded-[1.15rem] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60"
                  >
                    {registryCards
                      .map((bond) => bond.metadata)
                      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
                      .map((entry) => (
                        <option key={entry.symbol} value={entry.symbol}>
                          {`${entry.symbol} - ${entry.displayName}`}
                        </option>
                      ))}
                  </select>
                </label>
              </SurfaceCard>

              <SurfaceCard padding="sm" className="border-white/[0.08]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                  Monitor note
                </p>
                <p className="mt-3 text-sm leading-7 text-foreground-soft">
                  Approximate YTM is solved from the latest fetched close using local registry terms. This is a practical desk monitor, not an official spread or country-risk index.
                </p>
                <p className="mt-3 text-sm leading-7 text-foreground-soft">
                  {!data
                    ? selectedRegistryEntries.length > 0
                      ? "Local metadata is already available for some selected bonds, but market prices have not been loaded yet."
                      : "Fetch market data with registered symbols to populate latest price, approximate YTM, and spread."
                    : !benchmarkAvailableInSelection
                      ? "The selected benchmark is not in the current fetched set, so benchmark YTM and spreads remain unavailable."
                      : "Benchmark YTM is derived from the latest aligned market close for the selected benchmark bond."}
                </p>
              </SurfaceCard>
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
            <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
              <div className="min-w-[1040px]">
                <div className="grid grid-cols-[1.05fr_1.1fr_1fr_1fr_1fr_0.9fr_1.6fr] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                  <span>Symbol</span>
                  <span>Latest price</span>
                  <span>Approx YTM</span>
                  <span>Benchmark</span>
                  <span>Benchmark YTM</span>
                  <span>Spread</span>
                  <span>Status</span>
                </div>
                {yieldSpreadRows.map((row, index) => (
                  <YieldSpreadRowView key={row.symbol} row={row} index={index} />
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
            description="Local registry metadata is kept visually distinct from fetched market prices so the user can separate descriptive context from live market interpretation."
          >
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {registryCards.map((bond) => (
                <BondMetadataCard key={bond.symbol} bond={bond} />
              ))}
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            {marketCharts.map((chart, index) => (
              <div key={chart.title} className={cn(index === 0 && "xl:col-span-2")}>
                <BondChartCard {...chart} />
              </div>
            ))}
          </div>

          <Card
            eyebrow="Market Monitor"
            title="Market performance snapshot"
            description="Daily return, volatility, and drawdown metrics from the aligned market series."
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.14fr)_minmax(18rem,0.86fr)]">
              <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-[1.2fr_1.5fr_repeat(4,minmax(110px,1fr))] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                    <span>Symbol</span>
                    <span>Reference name</span>
                    <span>Total return</span>
                    <span>Annualized return</span>
                    <span>Annualized vol</span>
                    <span>Max drawdown</span>
                  </div>
                  {marketMetricRows.map((row, index) => (
                    <div
                      key={row.symbol}
                      className={cn(
                        "grid grid-cols-[1.2fr_1.5fr_repeat(4,minmax(110px,1fr))] gap-3 px-5 py-4 text-sm text-foreground-soft not-last:border-b not-last:border-white/[0.08]",
                        index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                      )}
                    >
                      <div className="space-y-1">
                        <span className="font-semibold text-foreground">{row.symbol}</span>
                        <p className="text-xs text-foreground-subtle">
                          {row.observations} obs
                        </p>
                      </div>
                      <span>{row.displayName}</span>
                      <span>{row.totalReturn}</span>
                      <span>{row.annualizedReturn}</span>
                      <span>{row.annualizedVolatility}</span>
                      <span className="text-rose-200">{row.maxDrawdown}</span>
                    </div>
                  ))}
                </div>
              </div>

              <SurfaceCard padding="sm" className="border-white/[0.08]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                  Reading guide
                </p>
                <div className="mt-4 space-y-3">
                  <DeskNote
                    title="Return context"
                    body="Use the market table as a comparative reference layer, not as a replacement for direct pricing analysis."
                  />
                  <DeskNote
                    title="Spread posture"
                    body="The spread table is most useful when the selected benchmark stays stable and meaningful for the bond set being reviewed."
                  />
                  <DeskNote
                    title="Reference discipline"
                    body="Registry metadata and live market prices are shown separately so interpretation stays cleaner."
                  />
                </div>
              </SurfaceCard>
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
    loading: "border-accent/25 bg-accent/10 text-accent-foreground",
    empty: "border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.76),rgba(10,17,26,0.54))] text-foreground-soft",
    error: "border-rose-400/30 bg-rose-400/[0.08] text-rose-200",
  };

  return (
    <div className={`rounded-[1.3rem] border px-4 py-3 text-sm ${toneMap[tone]}`}>
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
      <div className="rounded-[1.45rem] border border-dashed border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.76),rgba(10,17,26,0.54))] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{bond.symbol}</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-subtle">
              Local metadata missing
            </p>
          </div>
          <MetadataBadge label="No registry entry" />
        </div>
        <p className="mt-4 text-sm leading-7 text-foreground-soft">
          Market data can still be requested for this symbol, but reference
          metadata is unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.45rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.76),rgba(10,17,26,0.54))] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{bond.symbol}</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-subtle">
            Local reference metadata
          </p>
        </div>
        <MetadataBadge label="Registry" />
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {bond.metadata.displayName}
          </p>
          <p className="text-xs leading-6 text-foreground-muted">
            {bond.metadata.issuer}
          </p>
        </div>
        <div className="grid gap-2 text-sm text-foreground-soft sm:grid-cols-2">
          <MetadataField label="Currency" value={bond.metadata.currency} />
          <MetadataField label="Face value" value={formatNumber(bond.metadata.faceValue)} />
          <MetadataField
            label="Coupon rate"
            value={formatUnsignedPercent(bond.metadata.couponRate)}
          />
          <MetadataField
            label="Payments / year"
            value={bond.metadata.paymentsPerYear.toString()}
          />
          <div className="sm:col-span-2">
            <MetadataField
              label="Maturity date"
              value={formatDateLabel(bond.metadata.maturityDate)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetadataField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

function MetadataBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
      {label}
    </span>
  );
}

function YieldSpreadRowView({
  row,
  index,
}: {
  row: BondMarketMonitorSectionProps["yieldSpreadRows"][number];
  index: number;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1.05fr_1.1fr_1fr_1fr_1fr_0.9fr_1.6fr] gap-3 px-5 py-4 text-sm text-foreground-soft not-last:border-b not-last:border-white/[0.08]",
        index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
      )}
    >
      <div className="space-y-1">
        <span className="font-semibold text-foreground">{row.symbol}</span>
        <p className="text-xs text-foreground-subtle">
          {row.displayName ?? "No local metadata"}
        </p>
      </div>
      <span>{row.latestPrice !== null ? formatPrice(row.latestPrice) : "--"}</span>
      <span>
        {row.approximateYtm !== null
          ? formatUnsignedPercent(row.approximateYtm)
          : "--"}
      </span>
      <span>{row.benchmarkSymbol}</span>
      <span>
        {row.benchmarkYtm !== null
          ? formatUnsignedPercent(row.benchmarkYtm)
          : "--"}
      </span>
      <span
        className={
          row.spreadBps !== null && row.spreadBps < 0
            ? "text-emerald-200"
            : "text-amber-200"
        }
      >
        {row.spreadBps !== null ? formatBasisPoints(row.spreadBps) : "--"}
      </span>
      <span className="text-foreground-muted">{row.note}</span>
    </div>
  );
}

function DeskNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.76),rgba(10,17,26,0.54))] px-4 py-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-foreground-soft">{body}</p>
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
