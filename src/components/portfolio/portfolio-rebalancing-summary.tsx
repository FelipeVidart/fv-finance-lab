import { SurfaceCard } from "@/components/ui/surface-card";
import { getRebalancingStrategyLabel } from "@/lib/finance/portfolio/rebalancing";
import type {
  PortfolioAnalysis,
  PortfolioSimulationResult,
} from "@/lib/finance/portfolio/types";
import { cn } from "@/lib/utils";

type PortfolioRebalancingSummaryProps = {
  analysis: PortfolioAnalysis | null;
};

const comparisonRows = [
  "Final value",
  "CAGR",
  "Ann. volatility",
  "Sharpe",
  "Max drawdown",
  "Rebalances",
  "Total turnover",
  "Average drift",
  "Max drift",
] as const;

export function PortfolioRebalancingSummary({
  analysis,
}: PortfolioRebalancingSummaryProps) {
  if (!analysis) {
    return null;
  }

  const selected = analysis.rebalancing.selected;
  const buyAndHold = analysis.rebalancing.buyAndHold;
  const strategyLabel = getRebalancingStrategyLabel(
    analysis.rebalancing.strategy,
  );
  const showBuyAndHoldComparison = analysis.rebalancing.strategy.id !== "none";
  const recentEvents = [...selected.rebalanceEvents].reverse().slice(0, 12);

  return (
    <SurfaceCard padding="md" className="border-white/[0.08]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
            Rebalancing Strategy
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">
            Portfolio behavior under the selected rebalancing policy.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground-soft">
            Turnover is estimated as one-way portfolio turnover when weights are
            reset to the target allocation.
          </p>
        </div>
        <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-foreground">
          {strategyLabel}
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Final Value" value={formatCurrency(analysis.metrics.finalBalance)} />
        <SummaryCard
          label="Rebalances"
          value={selected.rebalanceCount.toLocaleString("en-US")}
        />
        <SummaryCard
          label="Total Turnover"
          value={formatUnsignedPercent(selected.totalTurnover)}
        />
        <SummaryCard
          label="Average Drift"
          value={formatUnsignedPercent(selected.averageDrift)}
        />
        <SummaryCard label="Max Drift" value={formatUnsignedPercent(selected.maxDrift)} />
        <SummaryCard
          label="Final Drift"
          value={formatUnsignedPercent(selected.finalDrift)}
        />
      </div>

      {showBuyAndHoldComparison ? (
        <div className="mt-6 overflow-x-auto rounded-[1.55rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
          <div className="min-w-[920px]">
            <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              <span>Metric</span>
              <span>{strategyLabel}</span>
              <span>Buy & Hold</span>
              <span>Difference</span>
            </div>
            {comparisonRows.map((row, index) => {
              const values = getComparisonValues({
                row,
                analysis,
                selected,
                buyAndHold,
              });

              return (
                <div
                  key={row}
                  className={cn(
                    "grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-3 px-5 py-4 text-sm not-last:border-b not-last:border-white/[0.08]",
                    index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                  )}
                >
                  <span className="font-semibold text-foreground">{row}</span>
                  <span className={getSignedTone(values.selectedRaw, row)}>
                    {values.selected}
                  </span>
                  <span className="text-foreground-soft">{values.buyAndHold}</span>
                  <span className={getSignedTone(values.differenceRaw, row)}>
                    {values.difference}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <div className="overflow-x-auto rounded-[1.55rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[0.9fr_0.75fr_0.75fr_0.95fr] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              <span>Date</span>
              <span>Reason</span>
              <span>Turnover</span>
              <span>Max drift before</span>
            </div>
            {recentEvents.length > 0 ? (
              recentEvents.map((event, index) => (
                <div
                  key={`${event.date}-${event.reason}-${index}`}
                  className={cn(
                    "grid grid-cols-[0.9fr_0.75fr_0.75fr_0.95fr] gap-3 px-5 py-4 text-sm not-last:border-b not-last:border-white/[0.08]",
                    index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                  )}
                >
                  <span className="text-foreground-soft">
                    {formatDate(event.date)}
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatReason(event.reason)}
                  </span>
                  <span className="text-foreground-soft">
                    {formatUnsignedPercent(event.turnover)}
                  </span>
                  <span className="text-foreground-soft">
                    {formatUnsignedPercent(event.maxDriftBeforeRebalance)}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-5 text-sm leading-7 text-foreground-soft">
                No rebalance events were triggered over the aligned
                market-data window.
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-[1.55rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
          <div className="min-w-[520px]">
            <div className="grid grid-cols-[0.8fr_0.75fr_0.75fr_0.75fr] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              <span>Ticker</span>
              <span>Target</span>
              <span>Final</span>
              <span>Drift</span>
            </div>
            {analysis.assets.map((asset, index) => {
              const finalWeight = selected.finalWeights[asset.ticker] ?? 0;
              const targetWeight = asset.weight / 100;

              return (
                <div
                  key={asset.ticker}
                  className={cn(
                    "grid grid-cols-[0.8fr_0.75fr_0.75fr_0.75fr] gap-3 px-5 py-4 text-sm not-last:border-b not-last:border-white/[0.08]",
                    index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                  )}
                >
                  <span className="font-semibold text-foreground">
                    {asset.ticker}
                  </span>
                  <span className="text-foreground-soft">
                    {formatUnsignedPercent(targetWeight)}
                  </span>
                  <span className="text-foreground-soft">
                    {formatUnsignedPercent(finalWeight)}
                  </span>
                  <span className="text-foreground-soft">
                    {formatUnsignedPercent(Math.abs(finalWeight - targetWeight))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/[0.08] bg-background-muted/80 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function getComparisonValues(input: {
  row: (typeof comparisonRows)[number];
  analysis: PortfolioAnalysis;
  selected: PortfolioSimulationResult;
  buyAndHold: PortfolioSimulationResult;
}) {
  const buyAndHoldMetrics = input.analysis.rebalancing.buyAndHoldMetrics;

  if (input.row === "Final value") {
    return formatComparison({
      selected: input.analysis.metrics.finalBalance,
      buyAndHold: buyAndHoldMetrics.finalBalance,
      formatter: formatCurrency,
    });
  }

  if (input.row === "CAGR") {
    return formatComparison({
      selected: input.analysis.metrics.cagr,
      buyAndHold: buyAndHoldMetrics.cagr,
      formatter: formatPercent,
    });
  }

  if (input.row === "Ann. volatility") {
    return formatComparison({
      selected: input.analysis.metrics.annualizedVolatility,
      buyAndHold: buyAndHoldMetrics.annualizedVolatility,
      formatter: formatPercent,
    });
  }

  if (input.row === "Sharpe") {
    return formatComparison({
      selected: input.analysis.metrics.sharpeRatio,
      buyAndHold: buyAndHoldMetrics.sharpeRatio,
      formatter: formatRatio,
    });
  }

  if (input.row === "Max drawdown") {
    return formatComparison({
      selected: input.analysis.metrics.maxDrawdown,
      buyAndHold: buyAndHoldMetrics.maxDrawdown,
      formatter: formatPercent,
    });
  }

  if (input.row === "Rebalances") {
    return formatComparison({
      selected: input.selected.rebalanceCount,
      buyAndHold: input.buyAndHold.rebalanceCount,
      formatter: (value) => value.toLocaleString("en-US"),
    });
  }

  if (input.row === "Total turnover") {
    return formatComparison({
      selected: input.selected.totalTurnover,
      buyAndHold: input.buyAndHold.totalTurnover,
      formatter: formatPercent,
    });
  }

  if (input.row === "Average drift") {
    return formatComparison({
      selected: input.selected.averageDrift,
      buyAndHold: input.buyAndHold.averageDrift,
      formatter: formatPercent,
    });
  }

  return formatComparison({
    selected: input.selected.maxDrift,
    buyAndHold: input.buyAndHold.maxDrift,
    formatter: formatPercent,
  });
}

function formatComparison(input: {
  selected: number;
  buyAndHold: number;
  formatter: (value: number) => string;
}) {
  const difference = input.selected - input.buyAndHold;

  return {
    selected: input.formatter(input.selected),
    buyAndHold: input.formatter(input.buyAndHold),
    difference: input.formatter(difference),
    selectedRaw: input.selected,
    differenceRaw: difference,
  };
}

function getSignedTone(value: number, label: string) {
  if (label === "Rebalances") {
    return "text-foreground-soft";
  }

  if (value > 0) {
    return "text-emerald-200";
  }

  if (value < 0) {
    return "text-rose-200";
  }

  return "text-foreground-soft";
}

function formatReason(reason: string): string {
  if (reason === "threshold") {
    return "Threshold";
  }

  return reason.charAt(0).toUpperCase() + reason.slice(1);
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

function formatUnsignedPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
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
