import { SurfaceCard } from "@/components/ui/surface-card";
import type { MarketRegimeResult } from "@/lib/finance/market-regime/types";
import { cn } from "@/lib/utils";

export function RegimeSummaryCard({ result }: { result: MarketRegimeResult }) {
  const scorePosition = `${Math.min(Math.max((result.score + 100) / 2, 0), 100)}%`;

  return (
    <SurfaceCard tone="accent" padding="lg">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)] xl:items-stretch">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em]",
                getRegimeBadgeClass(result.score),
              )}
            >
              {result.regime}
            </span>
            <span className="rounded-full border border-white/[0.08] bg-background-muted/75 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-foreground-subtle">
              {result.source === "mock" ? "Fallback data" : "Live market data"}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">
              Current regime
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.045em] text-foreground sm:text-5xl">
              {result.regime}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-foreground-soft">
              {result.explanation}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              <span>Strong Risk Off</span>
              <span>Strong Risk On</span>
            </div>
            <div className="relative h-3 rounded-full border border-white/[0.08] bg-[linear-gradient(90deg,rgba(251,113,133,0.5),rgba(226,184,107,0.34),rgba(52,211,153,0.46))]">
              <span
                className="absolute top-1/2 h-6 w-1.5 -translate-y-1/2 rounded-full bg-foreground shadow-[0_0_20px_rgba(245,241,232,0.45)]"
                style={{ left: scorePosition }}
              />
            </div>
            <div className="flex items-center justify-between gap-4 text-xs font-semibold text-foreground-muted">
              <span>-100</span>
              <span>0</span>
              <span>+100</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {result.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <SummaryMetric label="Market Regime Score" value={formatScore(result.score)} />
          <SummaryMetric
            label="Confidence"
            value={`${result.confidence.level} (${result.confidence.score}%)`}
          />
          <SummaryMetric
            label="Last Market Date"
            value={formatDateLabel(result.lastMarketDate)}
          />
          <SummaryMetric
            label="Last Updated"
            value={formatDateTimeLabel(result.lastUpdated)}
          />
        </div>
      </div>
    </SurfaceCard>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/[0.08] bg-background-muted/75 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
        {value}
      </p>
    </div>
  );
}

function getRegimeBadgeClass(score: number): string {
  if (score >= 20) {
    return "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200";
  }

  if (score <= -20) {
    return "border-rose-400/25 bg-rose-400/[0.08] text-rose-200";
  }

  return "border-amber-400/25 bg-amber-400/[0.08] text-amber-200";
}

function formatScore(score: number): string {
  return `${score >= 0 ? "+" : ""}${score}`;
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTimeLabel(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

