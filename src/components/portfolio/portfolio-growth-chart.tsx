"use client";

import { ExpandableChartCard } from "@/components/expandable-chart-card";
import { LineChartPanel } from "@/components/line-chart-panel";
import { getRebalancingStrategyLabel } from "@/lib/finance/portfolio/rebalancing";
import type {
  PortfolioAnalysis,
  PortfolioPerformancePoint,
} from "@/lib/finance/portfolio/types";

type PortfolioGrowthChartProps = {
  analysis: PortfolioAnalysis;
};

export function PortfolioGrowthChart({ analysis }: PortfolioGrowthChartProps) {
  const comparison = analysis.benchmarkComparison;
  const strategyLabel = getRebalancingStrategyLabel(
    analysis.rebalancing.strategy,
  );
  const dates = comparison
    ? comparison.portfolioGrowthPoints.map((point) => point.date)
    : analysis.performancePoints.map((point) => point.date);
  const series = [
    {
      label: strategyLabel,
      values: comparison
        ? comparison.portfolioGrowthPoints.map((point) => point.balance)
        : analysis.performancePoints.map((point) => point.balance),
      color: "#e2b86b",
    },
    ...(analysis.rebalancing.strategy.id !== "none"
      ? [
          {
            label: "Buy & Hold",
            values: buildScaledValuesForDates({
              points: analysis.rebalancing.buyAndHold.performancePoints,
              dates,
              initialCapital: analysis.metrics.initialBalance,
            }),
            color: "#94a3b8",
          },
        ]
      : []),
    ...(comparison
      ? [
          {
            label: "Benchmark",
            values: comparison.benchmarkGrowthPoints.map((point) => point.balance),
            color: "#7f95b3",
          },
        ]
      : []),
  ];

  return (
    <ExpandableChartCard
      eyebrow="Chart preview"
      title="Portfolio Growth"
      description={
        comparison
          ? "Portfolio and benchmark growth normalized to the same starting capital over the overlapping comparison window."
          : "Balance path simulated from the selected portfolio rebalancing policy."
      }
      detailDescription={
        comparison
          ? "Inspect portfolio and benchmark growth over the shared comparison window. Hover the expanded chart to read the nearest date and value."
          : "Inspect the compounded portfolio balance path across the aligned market-data window. Hover the expanded chart to read the nearest date and value."
      }
      renderPreview={({ open }) => (
        <LineChartPanel
          title="Portfolio Growth"
          dates={dates}
          series={series}
          valueFormatter={formatCurrency}
          onChartClick={open}
          expandLabel="Open chart"
        />
      )}
      detail={
        <LineChartPanel
          title="Portfolio Growth"
          dates={dates}
          series={series}
          valueFormatter={formatCurrency}
          heightClassName="h-[24rem] sm:h-[32rem] lg:h-[40rem]"
          interactive
          showSummary
        />
      }
    />
  );
}

function buildScaledValuesForDates(input: {
  points: PortfolioPerformancePoint[];
  dates: string[];
  initialCapital: number;
}): number[] {
  const balanceByDate = new Map(
    input.points.map((point) => [point.date, point.balance] as const),
  );
  const firstBalance =
    input.dates
      .map((date) => balanceByDate.get(date))
      .find((value) => Number.isFinite(value) && (value ?? 0) > 0) ??
    input.points[0]?.balance ??
    input.initialCapital;

  if (!Number.isFinite(firstBalance) || firstBalance <= 0) {
    return input.dates.map(() => input.initialCapital);
  }

  return input.dates.map((date) => {
    const balance = balanceByDate.get(date);

    if (!Number.isFinite(balance) || (balance ?? 0) <= 0) {
      return input.initialCapital;
    }

    return ((balance ?? firstBalance) / firstBalance) * input.initialCapital;
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
