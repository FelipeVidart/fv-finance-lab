import { SurfaceCard } from "@/components/ui/surface-card";
import type { PortfolioAnalysis } from "@/lib/finance/portfolio/types";
import { cn } from "@/lib/utils";

type PortfolioSummaryProps = {
  analysis: PortfolioAnalysis | null;
};

const metricLabels = [
  "Initial balance",
  "Final balance",
  "Cumulative return",
  "CAGR",
  "Annualized volatility",
  "Sharpe ratio",
  "Sortino ratio",
  "Maximum drawdown",
] as const;

export function PortfolioSummary({ analysis }: PortfolioSummaryProps) {
  if (!analysis) {
    return (
      <SurfaceCard padding="md" className="border-white/[0.08]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
          Portfolio summary
        </p>
        <p className="mt-3 text-sm leading-7 text-foreground-soft">
          Load a validated ETF allocation to calculate balance growth,
          risk-adjusted returns, drawdown, and calendar-year extremes.
        </p>
      </SurfaceCard>
    );
  }

  const metrics = [
    formatCurrency(analysis.metrics.initialBalance),
    formatCurrency(analysis.metrics.finalBalance),
    formatPercent(analysis.metrics.cumulativeReturn),
    formatPercent(analysis.metrics.cagr),
    formatPercent(analysis.metrics.annualizedVolatility),
    formatRatio(analysis.metrics.sharpeRatio),
    formatRatio(analysis.metrics.sortinoRatio),
    formatPercent(analysis.metrics.maxDrawdown),
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricLabels.map((label, index) => (
          <SurfaceCard
            key={label}
            tone={index === 1 ? "accent" : "elevated"}
            padding="sm"
            className="h-full border-white/[0.08]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              {label}
            </p>
            <p
              className={cn(
                "mt-4 text-[1.7rem] font-semibold tracking-[-0.04em] text-foreground",
                metrics[index].startsWith("+") && "text-emerald-200",
                metrics[index].startsWith("-") && "text-rose-200",
              )}
            >
              {metrics[index]}
            </p>
          </SurfaceCard>
        ))}
      </div>

      <SurfaceCard padding="sm" className="border-white/[0.08]">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryLine label="Common start" value={formatDate(analysis.commonStartDate)} />
          <SummaryLine label="Common end" value={formatDate(analysis.commonEndDate)} />
          <SummaryLine label="Observations" value={analysis.observations.toString()} />
          <SummaryLine label="Provider" value={formatProviderLabel(analysis.provider)} />
          <SummaryLine
            label="Warnings"
            value={(analysis.providerWarnings?.length ?? 0).toString()}
          />
          <SummaryLine
            label="Cache"
            value={
              analysis.providerCache
                ? `${analysis.providerCache.hits} hit / ${analysis.providerCache.misses} miss`
                : "N/A"
            }
          />
          <SummaryLine
            label="Best / worst year"
            value={`${formatYearReturn(analysis.metrics.bestYear)} / ${formatYearReturn(
              analysis.metrics.worstYear,
            )}`}
          />
        </div>
      </SurfaceCard>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/[0.08] bg-background-muted/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function formatProviderLabel(value: string): string {
  return value
    .split(" + ")
    .map((provider) =>
      provider === "twelveData"
        ? "Twelve Data"
        : provider === "yahoo"
          ? "Yahoo"
        : provider.charAt(0).toUpperCase() + provider.slice(1),
    )
    .join(" + ");
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

function formatRatio(value: number): string {
  return value.toFixed(2);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatYearReturn(
  value: PortfolioAnalysis["metrics"]["bestYear"],
): string {
  if (!value) {
    return "N/A";
  }

  return `${value.year} ${formatPercent(value.return)}`;
}
