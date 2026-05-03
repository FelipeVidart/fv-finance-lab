import { SurfaceCard } from "@/components/ui/surface-card";
import type { PortfolioAnalysis } from "@/lib/finance/portfolio/types";

type PortfolioDrawdownAnalysisProps = {
  analysis: PortfolioAnalysis;
};

export function PortfolioDrawdownAnalysis({
  analysis,
}: PortfolioDrawdownAnalysisProps) {
  const { drawdownAnalysis } = analysis;
  const benchmarkMaxDrawdown =
    analysis.benchmarkComparison?.metrics.benchmarkMaxDrawdown;

  return (
    <SurfaceCard padding="md" className="border-white/[0.08]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
            Worst Drawdowns
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">
            Largest peak-to-trough declines and recovery periods over the available backtest window.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground-soft">
            Drawdowns measure the decline from a previous portfolio peak.
            Recovery time shows how long it took to return to that peak.
          </p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-background-muted/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
          Portfolio only
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <DrawdownSummaryCard
          label="Worst Drawdown"
          value={
            drawdownAnalysis.worstDrawdown
              ? formatPercent(drawdownAnalysis.worstDrawdown.maxDrawdown)
              : "0.00%"
          }
          detail={
            drawdownAnalysis.worstDrawdown
              ? `${formatDate(drawdownAnalysis.worstDrawdown.startDate)} to ${formatDate(
                  drawdownAnalysis.worstDrawdown.troughDate,
                )}`
              : "No drawdown episodes"
          }
        />
        <DrawdownSummaryCard
          label="Longest Underwater Period"
          value={
            drawdownAnalysis.longestUnderwater
              ? formatDayCount(drawdownAnalysis.longestUnderwater.underwaterDays)
              : "0 days"
          }
          detail={
            drawdownAnalysis.longestUnderwater
              ? recoveryLabel(drawdownAnalysis.longestUnderwater.recoveryDate)
              : "At high / recovered"
          }
        />
        <DrawdownSummaryCard
          label="Current Drawdown Status"
          value={
            drawdownAnalysis.currentStatus.isRecovered
              ? "At high / recovered"
              : formatPercent(drawdownAnalysis.currentStatus.currentDrawdown)
          }
          detail={
            drawdownAnalysis.currentStatus.isRecovered
              ? "Latest balance is at or near a high"
              : `${formatDayCount(
                  drawdownAnalysis.currentStatus.underwaterDays,
                )} underwater`
          }
        />
      </div>

      {benchmarkMaxDrawdown !== undefined ? (
        <p className="mt-4 rounded-[1.15rem] border border-white/[0.08] bg-background-muted/75 px-4 py-3 text-sm leading-7 text-foreground-soft">
          Benchmark max drawdown over the comparison window:{" "}
          <span className="font-semibold text-foreground">
            {formatPercent(benchmarkMaxDrawdown)}
          </span>
          .
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-[1.55rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[0.42fr_0.9fr_0.9fr_0.95fr_1.05fr_0.95fr_0.85fr_0.9fr_0.9fr] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
            <span>Rank</span>
            <span>Start</span>
            <span>Trough</span>
            <span>Recovery</span>
            <span>Underwater</span>
            <span>Recovery time</span>
            <span>Max drawdown</span>
            <span>Start balance</span>
            <span>Trough balance</span>
          </div>

          {drawdownAnalysis.episodes.length > 0 ? (
            drawdownAnalysis.episodes.map((episode, index) => (
              <div
                key={`${episode.rank}-${episode.startDate}-${episode.troughDate}`}
                className={[
                  "grid grid-cols-[0.42fr_0.9fr_0.9fr_0.95fr_1.05fr_0.95fr_0.85fr_0.9fr_0.9fr] gap-3 px-5 py-4 text-sm not-last:border-b not-last:border-white/[0.08]",
                  index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                ].join(" ")}
              >
                <span className="font-semibold text-foreground">
                  {episode.rank}
                </span>
                <span className="text-foreground-soft">
                  {formatDate(episode.startDate)}
                </span>
                <span className="text-foreground-soft">
                  {formatDate(episode.troughDate)}
                </span>
                <span className="text-foreground-soft">
                  {episode.recoveryDate
                    ? formatDate(episode.recoveryDate)
                    : "Not recovered"}
                </span>
                <span className="text-foreground-soft">
                  {formatDayCount(episode.underwaterDays)}
                </span>
                <span className="text-foreground-soft">
                  {episode.recoveryDays === null
                    ? "Not recovered"
                    : formatDayCount(episode.recoveryDays)}
                </span>
                <span className="font-semibold text-rose-200">
                  {formatPercent(episode.maxDrawdown)}
                </span>
                <span className="text-foreground-soft">
                  {formatCurrency(episode.startBalance)}
                </span>
                <span className="text-foreground-soft">
                  {formatCurrency(episode.troughBalance)}
                </span>
              </div>
            ))
          ) : (
            <div className="px-5 py-5 text-sm leading-7 text-foreground-soft">
              No drawdown episodes were detected over the aligned market-data
              window.
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 rounded-[1.15rem] border border-white/[0.08] bg-background-muted/75 px-4 py-3 text-sm leading-7 text-foreground-soft">
        Drawdown periods are calculated from the portfolio balance path over the
        aligned market-data window.
      </p>
    </SurfaceCard>
  );
}

function DrawdownSummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/[0.08] bg-background-muted/80 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-xs leading-6 text-foreground-muted">{detail}</p>
    </div>
  );
}

function recoveryLabel(recoveryDate: string | null): string {
  return recoveryDate ? `Recovered ${formatDate(recoveryDate)}` : "Not recovered";
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDayCount(value: number): string {
  return `${value.toLocaleString("en-US")} ${value === 1 ? "day" : "days"}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
