"use client";

import { useEffect, useMemo, useState } from "react";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  SECTOR_ROTATION_BENCHMARK,
  SECTOR_ROTATION_ETFS,
  SECTOR_ROTATION_PERIOD,
  SECTOR_ROTATION_SYMBOLS,
  buildSectorRotationDashboard,
  type SectorRotationDashboard,
  type SectorRotationRow,
  type SectorRotationSignal,
} from "@/lib/finance/sector-rotation";
import { loadHistoricalPrices } from "@/lib/market-data/client";
import type {
  ProviderSelectorOption,
  SafeProviderConfig,
} from "@/lib/market-data/provider-config";
import type {
  MarketDataProviderMode,
  MarketDataWarning,
} from "@/lib/market-data/types";
import { cn } from "@/lib/utils";

type SectorRotationMonitorProps = {
  providerConfigs: SafeProviderConfig[];
  providerSelectorOptions: ProviderSelectorOption[];
};

const DEFAULT_PROVIDER: MarketDataProviderMode = "auto";

export function SectorRotationMonitor({
  providerConfigs,
  providerSelectorOptions,
}: SectorRotationMonitorProps) {
  const [provider, setProvider] =
    useState<MarketDataProviderMode>(DEFAULT_PROVIDER);
  const [result, setResult] = useState<SectorRotationDashboard | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialDashboard() {
      try {
        const batch = await loadHistoricalPrices({
          symbols: [...SECTOR_ROTATION_SYMBOLS],
          period: SECTOR_ROTATION_PERIOD,
          provider: DEFAULT_PROVIDER,
          maxSymbols: SECTOR_ROTATION_SYMBOLS.length,
        });

        if (!cancelled) {
          setResult(buildSectorRotationDashboard(batch));
        }
      } catch (error) {
        if (!cancelled) {
          setResult(null);
          setRequestError(
            error instanceof Error
              ? error.message
              : "Unable to load sector rotation data right now.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadDashboard(nextProvider: MarketDataProviderMode) {
    setIsLoading(true);
    setRequestError(null);

    try {
      const batch = await loadHistoricalPrices({
        symbols: [...SECTOR_ROTATION_SYMBOLS],
        period: SECTOR_ROTATION_PERIOD,
        provider: nextProvider,
        maxSymbols: SECTOR_ROTATION_SYMBOLS.length,
      });

      setResult(buildSectorRotationDashboard(batch));
    } catch (error) {
      setResult(null);
      setRequestError(
        error instanceof Error
          ? error.message
          : "Unable to load sector rotation data right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const statusItems = useMemo(() => {
    if (!result) {
      return [];
    }

    return [
      { label: "Window", value: `${SECTOR_ROTATION_PERIOD} requested` },
      { label: "Common start", value: formatDate(result.meta.commonStartDate) },
      { label: "Common end", value: formatDate(result.meta.commonEndDate) },
      { label: "Observations", value: result.meta.observations.toString() },
      {
        label: "Provider",
        value:
          result.meta.providers.length > 0
            ? result.meta.providers.map(formatProviderLabel).join(" + ")
            : "Unavailable",
      },
      {
        label: "Cache",
        value: `${result.meta.cache.hits} hit / ${result.meta.cache.misses} miss`,
      },
    ];
  }, [result]);

  return (
    <section className="space-y-8">
      <SurfaceCard
        tone="elevated"
        padding="md"
        className="border-border-strong/95"
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.62fr)] xl:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-accent-foreground">
                Sector Rotation
              </span>
              <span className="rounded-full border border-white/[0.08] bg-background-muted/75 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-foreground-subtle">
                SPY benchmark
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-[2.65rem]">
                Sector rotation monitor
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-foreground-soft">
                Compare S&P 500 sector ETF leadership, laggards, relative 3M
                momentum versus SPY, and a deterministic market regime read.
                This is analytical context, not investment advice.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <WorkspaceSignal
              label="Universe"
              value="11 sector ETFs"
              detail={`${SECTOR_ROTATION_BENCHMARK} is benchmark-only and excluded from rankings.`}
              tone="ready"
            />
            <WorkspaceSignal
              label="Dashboard posture"
              value={
                result
                  ? `${result.leaders[0].ticker} leads with ${result.leaders[0].score}/100`
                  : isLoading
                    ? "Loading sector history"
                    : "Awaiting refresh"
              }
              detail={
                result
                  ? result.interpretation.title
                  : "Scores use cross-sectional sector ranks."
              }
              tone={result ? "ready" : isLoading ? "active" : "default"}
            />
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard padding="md" className="border-white/[0.08]">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)_auto] xl:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
              ETF universe
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SECTOR_ROTATION_ETFS.map((sector) => (
                <span
                  key={sector.ticker}
                  className="rounded-full border border-white/[0.08] bg-background-muted/75 px-3 py-1.5 text-xs font-semibold text-foreground-soft"
                  title={sector.name}
                >
                  {sector.ticker}
                </span>
              ))}
              <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent-foreground">
                {SECTOR_ROTATION_BENCHMARK} benchmark
              </span>
            </div>
            <p className="mt-3 text-xs leading-6 text-foreground-subtle">
              {formatCompactProviderStatus(providerConfigs)}
            </p>
          </div>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
              Provider
            </span>
            <select
              value={provider}
              onChange={(event) => {
                setProvider(event.target.value as MarketDataProviderMode);
                setRequestError(null);
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
            onClick={() => void loadDashboard(provider)}
            disabled={isLoading}
            className="rounded-[1.15rem] bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-wait disabled:bg-accent/60 xl:min-w-40"
          >
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {statusItems.length > 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {statusItems.map((item) => (
              <StatusFact key={item.label} {...item} />
            ))}
          </div>
        ) : null}

        {requestError ? (
          <InlineState tone="error" message={requestError} />
        ) : null}

        {isLoading && !result ? (
          <InlineState
            tone="loading"
            message="Fetching one year of daily sector ETF prices and aligning the shared history."
          />
        ) : null}
      </SurfaceCard>

      {result ? (
        <>
          <DashboardOverview result={result} />
          <ProviderNotes result={result} />
          <ScoreBySector rows={result.sectors} />
          <PerformanceVsSpy result={result} />
          <RankingTable rows={result.sectors} />
          <MethodologyAndLimits />
        </>
      ) : null}
    </section>
  );
}

function DashboardOverview({ result }: { result: SectorRotationDashboard }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(20rem,0.85fr)]">
      <SurfaceCard padding="md" className="border-emerald-400/15">
        <SectionHeading
          eyebrow="Top leaders"
          title="Leadership"
          description="Highest composite scores across the 11 sector ETFs."
        />
        <div className="mt-5 grid gap-3">
          {result.leaders.map((row, index) => (
            <SectorRankCard
              key={row.ticker}
              row={row}
              rank={index + 1}
              tone="leader"
            />
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard padding="md" className="border-rose-400/15">
        <SectionHeading
          eyebrow="Bottom laggards"
          title="Lagging sectors"
          description="Lowest composite scores across the ranked sector set."
        />
        <div className="mt-5 grid gap-3">
          {result.laggards.map((row, index) => (
            <SectorRankCard
              key={row.ticker}
              row={row}
              rank={result.sectors.length - index}
              tone="laggard"
            />
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard tone="accent" padding="md">
        <SectionHeading
          eyebrow="Regime read"
          title={result.interpretation.title}
          description={result.interpretation.caveat}
        />
        <div className="mt-5 space-y-3">
          {result.interpretation.observations.map((observation) => (
            <p
              key={observation}
              className="rounded-[1.2rem] border border-white/[0.08] bg-slate-950/30 px-4 py-3 text-sm leading-6 text-foreground-soft"
            >
              {observation}
            </p>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}

function ProviderNotes({ result }: { result: SectorRotationDashboard }) {
  const warnings = result.meta.warnings;
  const notes = result.meta.dataNotes;

  if (warnings.length === 0 && notes.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {notes.length > 0 ? (
        <SurfaceCard padding="sm" className="border-amber-400/20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
            Data notes
          </p>
          <div className="mt-3 space-y-2">
            {notes.map((note) => (
              <p key={note} className="text-sm leading-6 text-foreground-soft">
                {note}
              </p>
            ))}
          </div>
        </SurfaceCard>
      ) : null}

      {warnings.length > 0 ? (
        <SurfaceCard padding="sm" className="border-amber-400/20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
            Provider warnings
          </p>
          <ul className="mt-3 space-y-1 text-sm leading-6 text-foreground-soft">
            {warnings.slice(0, 5).map((warning, index) => (
              <li key={`${warning.code}-${warning.symbol ?? "all"}-${index}`}>
                {formatWarning(warning)}
              </li>
            ))}
          </ul>
        </SurfaceCard>
      ) : null}
    </div>
  );
}

function ScoreBySector({ rows }: { rows: SectorRotationRow[] }) {
  return (
    <SurfaceCard padding="md" className="border-white/[0.08]">
      <SectionHeading
        eyebrow="Score by sector"
        title="Composite leadership score"
        description="Scores are relative ranks across sector ETFs only; SPY is not scored."
      />
      <div className="mt-6 space-y-3">
        {rows.map((row) => (
          <div
            key={row.ticker}
            className="grid gap-3 rounded-[1.25rem] border border-white/[0.08] bg-background-muted/65 px-4 py-3 sm:grid-cols-[minmax(9rem,0.45fr)_minmax(0,1fr)_auto] sm:items-center"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">
                {row.ticker}
              </p>
              <p className="mt-1 text-xs text-foreground-subtle">{row.name}</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-950/70">
              <div
                className={cn(
                  "h-full rounded-full",
                  row.score >= 60
                    ? "bg-emerald-300"
                    : row.score < 40
                      ? "bg-rose-300"
                      : "bg-accent",
                )}
                style={{ width: `${row.score}%` }}
              />
            </div>
            <div className="flex items-center gap-3 sm:justify-end">
              <span className="text-sm font-semibold text-foreground">
                {row.score}
              </span>
              <SignalBadge signal={row.signal} />
            </div>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}

function PerformanceVsSpy({ result }: { result: SectorRotationDashboard }) {
  return (
    <SurfaceCard padding="md" className="border-white/[0.08]">
      <SectionHeading
        eyebrow="3M performance vs SPY"
        title="Relative momentum"
        description="Sector 3M return minus SPY 3M return, shown in percentage points."
      />
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {result.sectors.map((row) => (
          <div
            key={row.ticker}
            className="rounded-[1.25rem] border border-white/[0.08] bg-background-muted/65 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {row.ticker} {row.name}
                </p>
                <p className="mt-1 text-xs text-foreground-subtle">
                  Sector {formatSignedPercent(row.threeMonthReturn)} / SPY{" "}
                  {formatSignedPercent(result.benchmark.threeMonthReturn)}
                </p>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold",
                  row.relativeThreeMonthReturn >= 0
                    ? "text-emerald-200"
                    : "text-rose-200",
                )}
              >
                {formatSignedPercent(row.relativeThreeMonthReturn)}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-950/70">
              <div
                className={cn(
                  "h-full rounded-full",
                  row.relativeThreeMonthReturn >= 0
                    ? "bg-emerald-300"
                    : "bg-rose-300",
                )}
                style={{
                  width: `${Math.min(
                    Math.abs(row.relativeThreeMonthReturn) * 500,
                    100,
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}

function RankingTable({ rows }: { rows: SectorRotationRow[] }) {
  return (
    <SurfaceCard padding="md" className="border-white/[0.08]">
      <SectionHeading
        eyebrow="Full ranking"
        title="Sector rotation table"
        description="Trailing returns, SPY-relative momentum, trend, volatility, drawdown, and score."
      />
      <div className="mt-6 overflow-x-auto rounded-[1.55rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
        <table className="w-full min-w-[1120px] text-left">
          <thead>
            <tr className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Sector</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Signal</th>
              <th className="px-4 py-3">1M</th>
              <th className="px-4 py-3">3M</th>
              <th className="px-4 py-3">6M</th>
              <th className="px-4 py-3">3M vs SPY</th>
              <th className="px-4 py-3">MA50 dist.</th>
              <th className="px-4 py-3">3M vol.</th>
              <th className="px-4 py-3">6M max DD</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.ticker}
                className={cn(
                  "border-b border-white/[0.08] text-sm last:border-b-0",
                  index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                )}
              >
                <td className="px-4 py-4 font-semibold text-foreground">
                  {index + 1}
                </td>
                <td className="px-4 py-4">
                  <p className="font-semibold text-foreground">{row.ticker}</p>
                  <p className="mt-1 text-xs text-foreground-subtle">
                    {row.name}
                  </p>
                </td>
                <td className="px-4 py-4 font-semibold text-foreground">
                  {row.score}
                </td>
                <td className="px-4 py-4">
                  <SignalBadge signal={row.signal} />
                </td>
                <MetricCell value={row.oneMonthReturn} />
                <MetricCell value={row.threeMonthReturn} />
                <MetricCell value={row.sixMonthReturn} />
                <MetricCell value={row.relativeThreeMonthReturn} />
                <MetricCell value={row.distanceToMa50} />
                <td className="px-4 py-4 font-semibold text-foreground-soft">
                  {formatUnsignedPercent(row.threeMonthVolatility)}
                </td>
                <td className="px-4 py-4 font-semibold text-rose-200">
                  {formatSignedPercent(row.sixMonthMaxDrawdown)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}

function MethodologyAndLimits() {
  const methodology = [
    "Sector ETFs are used as practical proxies for S&P 500 sector behavior.",
    "Scores compare sector ETFs cross-sectionally; SPY is benchmark-only.",
    "Relative momentum is the sector 3M return minus SPY 3M return.",
    "Higher scores indicate stronger relative leadership; lower scores indicate relative lagging.",
    "Risk quality rewards lower realized volatility and lower absolute drawdown.",
  ];
  const limitations = [
    "This is not investment advice and does not recommend buy or sell decisions.",
    "ETFs are proxies, not the complete sector universe.",
    "Sector ETFs can be concentrated in a small number of large companies.",
    "Momentum is backward-looking and can reverse.",
    "Macro interpretation is rules-based context, not a mechanical forecast.",
    "Data quality depends on the selected historical price provider.",
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <InfoListCard
        eyebrow="Methodology"
        title="How the dashboard reads rotation"
        items={methodology}
      />
      <InfoListCard
        eyebrow="Limitations"
        title="What this tool does not do"
        items={limitations}
      />
    </div>
  );
}

function SectorRankCard({
  row,
  rank,
  tone,
}: {
  row: SectorRotationRow;
  rank: number;
  tone: "leader" | "laggard";
}) {
  return (
    <div className="rounded-[1.3rem] border border-white/[0.08] bg-background-muted/70 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
            Rank {rank}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">
            {row.ticker} {row.name}
          </h3>
        </div>
        <span
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-semibold",
            tone === "leader"
              ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
              : "border-rose-400/25 bg-rose-400/[0.08] text-rose-200",
          )}
        >
          {row.score}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniMetric label="3M" value={formatSignedPercent(row.threeMonthReturn)} />
        <MiniMetric
          label="Vs SPY"
          value={formatSignedPercent(row.relativeThreeMonthReturn)}
        />
        <MiniMetric label="Signal" value={row.signal} />
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground-soft">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function InfoListCard({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: string[];
}) {
  return (
    <SurfaceCard padding="md" className="border-white/[0.08]">
      <SectionHeading eyebrow={eyebrow} title={title} description="" />
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <p
            key={item}
            className="rounded-[1.15rem] border border-white/[0.08] bg-background-muted/70 px-4 py-3 text-sm leading-6 text-foreground-soft"
          >
            {item}
          </p>
        ))}
      </div>
    </SurfaceCard>
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
    <div
      className={cn(
        "rounded-[1.35rem] border border-white/[0.08] bg-background-muted/75 px-4 py-4",
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
      <p className="mt-2 text-sm leading-6 text-foreground-soft">{detail}</p>
    </div>
  );
}

function StatusFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-white/[0.08] bg-background-muted/70 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function InlineState({
  tone,
  message,
}: {
  tone: "loading" | "error";
  message: string;
}) {
  return (
    <div
      className={cn(
        "mt-5 rounded-[1.3rem] border px-4 py-3 text-sm leading-6",
        tone === "loading"
          ? "border-accent/25 bg-accent/10 text-accent-foreground"
          : "border-rose-400/30 bg-rose-400/[0.08] text-rose-200",
      )}
    >
      {message}
    </div>
  );
}

function SignalBadge({ signal }: { signal: SectorRotationSignal }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
        signal === "Strong Leader" || signal === "Leader"
          ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
          : signal === "Neutral"
            ? "border-white/[0.08] bg-background-muted/80 text-foreground-soft"
            : "border-rose-400/25 bg-rose-400/[0.08] text-rose-200",
      )}
    >
      {signal}
    </span>
  );
}

function MetricCell({ value }: { value: number }) {
  return (
    <td
      className={cn(
        "px-4 py-4 font-semibold",
        value > 0
          ? "text-emerald-200"
          : value < 0
            ? "text-rose-200"
            : "text-foreground",
      )}
    >
      {formatSignedPercent(value)}
    </td>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white/[0.08] bg-slate-950/35 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function formatCompactProviderStatus(providers: SafeProviderConfig[]): string {
  const providerIds = ["yahoo", "twelveData", "stooq"] as const;

  return providerIds
    .map((providerId) => providers.find((provider) => provider.id === providerId))
    .filter((provider): provider is SafeProviderConfig => Boolean(provider))
    .map((provider) => `${provider.label} ${formatProviderState(provider)}`)
    .join(" | ");
}

function formatProviderState(provider: SafeProviderConfig): string {
  if (provider.available && provider.requiresApiKey) {
    return "configured";
  }

  if (provider.available) {
    return "available";
  }

  if (provider.requiresApiKey && !provider.configured) {
    return "requires API key";
  }

  return provider.statusLabel.toLowerCase();
}

function formatProviderLabel(value: string): string {
  if (value === "twelveData") {
    return "Twelve Data";
  }

  if (value === "yahoo") {
    return "Yahoo";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatWarning(warning: MarketDataWarning): string {
  const source = [warning.symbol, warning.provider].filter(Boolean).join(" / ");

  return source ? `${source}: ${warning.message}` : warning.message;
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

function formatUnsignedPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
