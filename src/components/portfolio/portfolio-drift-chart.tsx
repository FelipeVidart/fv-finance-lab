"use client";

import { ExpandableChartCard } from "@/components/expandable-chart-card";
import { LineChartPanel } from "@/components/line-chart-panel";
import type { PortfolioAnalysis } from "@/lib/finance/portfolio/types";

type PortfolioDriftChartProps = {
  analysis: PortfolioAnalysis;
};

export function PortfolioDriftChart({ analysis }: PortfolioDriftChartProps) {
  const driftPoints = analysis.rebalancing.selected.driftPoints;
  const dates = driftPoints.map((point) => point.date);
  const series = [
    {
      label: "Max Drift",
      values: driftPoints.map((point) => point.maxDrift),
      color: "#e2b86b",
    },
    {
      label: "Average Drift",
      values: driftPoints.map((point) => point.averageDrift),
      color: "#7f95b3",
    },
  ];

  return (
    <ExpandableChartCard
      eyebrow="Chart preview"
      title="Allocation Drift"
      description="Maximum and average absolute drift from target weights under the selected rebalancing policy."
      detailDescription="Inspect how far portfolio weights moved away from the target allocation over the aligned market-data window."
      renderPreview={({ open }) => (
        <LineChartPanel
          title="Allocation Drift"
          dates={dates}
          series={series}
          valueFormatter={formatPercent}
          onChartClick={open}
          expandLabel="Open chart"
        />
      )}
      detail={
        <LineChartPanel
          title="Allocation Drift"
          dates={dates}
          series={series}
          valueFormatter={formatPercent}
          heightClassName="h-[24rem] sm:h-[32rem] lg:h-[40rem]"
          interactive
          showSummary
        />
      }
    />
  );
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}
