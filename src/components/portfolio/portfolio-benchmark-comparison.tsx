import { SurfaceCard } from "@/components/ui/surface-card";
import type { PortfolioAnalysis } from "@/lib/finance/portfolio/types";
import { cn } from "@/lib/utils";

type PortfolioBenchmarkComparisonProps = {
  analysis: PortfolioAnalysis | null;
};

const metricRows = [
  {
    key: "portfolioCagr",
    label: "Portfolio CAGR",
    format: "percent",
  },
  {
    key: "benchmarkCagr",
    label: "Benchmark CAGR",
    format: "percent",
  },
  {
    key: "activeReturn",
    label: "Active Return",
    format: "percent",
  },
  {
    key: "trackingError",
    label: "Tracking Error",
    format: "percent",
  },
  {
    key: "informationRatio",
    label: "Information Ratio",
    format: "ratio",
  },
  {
    key: "correlation",
    label: "Correlation",
    format: "ratio",
  },
  {
    key: "beta",
    label: "Beta",
    format: "ratio",
  },
  {
    key: "alpha",
    label: "Alpha",
    format: "percent",
  },
  {
    key: "portfolioMaxDrawdown",
    label: "Portfolio Max Drawdown",
    format: "percent",
  },
  {
    key: "benchmarkMaxDrawdown",
    label: "Benchmark Max Drawdown",
    format: "percent",
  },
] as const;

export function PortfolioBenchmarkComparison({
  analysis,
}: PortfolioBenchmarkComparisonProps) {
  const comparison = analysis?.benchmarkComparison;

  return (
    <SurfaceCard padding="md" className="border-white/[0.08]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
            Benchmark Comparison
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">
            Evaluate portfolio performance against a selected reference portfolio or market index.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground-soft">
            Benchmark comparison uses the overlapping date range between the
            portfolio and the selected benchmark.
          </p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-background-muted/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
          {comparison ? comparison.benchmark.label : "Pending"}
        </span>
      </div>

      {analysis?.benchmarkWarning ? (
        <p className="mt-5 rounded-[1.15rem] border border-amber-400/25 bg-amber-400/[0.08] px-4 py-3 text-sm leading-6 text-amber-200">
          {analysis.benchmarkWarning}
        </p>
      ) : null}

      {!analysis ? (
        <div className="mt-6 rounded-[1.45rem] border border-dashed border-border/80 bg-background-muted/55 px-5 py-5 text-sm leading-7 text-foreground-soft">
          Run a portfolio backtest to unlock benchmark comparison metrics.
        </div>
      ) : null}

      {analysis && !comparison && !analysis.benchmarkWarning ? (
        <div className="mt-6 rounded-[1.45rem] border border-dashed border-border/80 bg-background-muted/55 px-5 py-5 text-sm leading-7 text-foreground-soft">
          No benchmark was selected for this run. Portfolio-only analysis remains
          available above.
        </div>
      ) : null}

      {comparison ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <PeriodCard
              label="Comparison start"
              value={formatDate(comparison.comparisonStartDate)}
            />
            <PeriodCard
              label="Comparison end"
              value={formatDate(comparison.comparisonEndDate)}
            />
            <PeriodCard
              label="Observations"
              value={comparison.observations.toString()}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {metricRows.map((row) => {
              const value = comparison.metrics[row.key];
              const formatted =
                row.format === "percent"
                  ? formatPercent(value)
                  : formatRatio(value);

              return (
                <div
                  key={row.key}
                  className="rounded-[1.25rem] border border-white/[0.08] bg-background-muted/80 px-4 py-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                    {row.label}
                  </p>
                  <p
                    className={cn(
                      "mt-3 text-lg font-semibold text-foreground",
                      formatted.startsWith("+") && "text-emerald-200",
                      formatted.startsWith("-") && "text-rose-200",
                    )}
                  >
                    {formatted}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <NoteLine>
              A positive active return means the portfolio outperformed the
              selected benchmark over the comparison period.
            </NoteLine>
            <NoteLine>
              Tracking error measures how differently the portfolio moved
              relative to the benchmark.
            </NoteLine>
          </div>
        </div>
      ) : null}
    </SurfaceCard>
  );
}

function PeriodCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/[0.08] bg-background-muted/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function NoteLine({ children }: { children: string }) {
  return (
    <p className="rounded-[1.15rem] border border-white/[0.08] bg-background-muted/75 px-4 py-3 text-sm leading-7 text-foreground-soft">
      {children}
    </p>
  );
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "N/A";
  }

  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

function formatRatio(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "N/A";
  }

  return value.toFixed(2);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
