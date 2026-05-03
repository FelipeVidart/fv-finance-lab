"use client";

import { ExpandableChartCard } from "@/components/expandable-chart-card";
import { LineChartPanel } from "@/components/line-chart-panel";
import type { PortfolioAnalysis } from "@/lib/finance/portfolio/types";

type PortfolioGrowthChartProps = {
  analysis: PortfolioAnalysis;
};

export function PortfolioGrowthChart({ analysis }: PortfolioGrowthChartProps) {
  const comparison = analysis.benchmarkComparison;
  const dates = comparison
    ? comparison.portfolioGrowthPoints.map((point) => point.date)
    : analysis.performancePoints.map((point) => point.date);
  const series = comparison
    ? [
        {
          label: "Portfolio",
          values: comparison.portfolioGrowthPoints.map((point) => point.balance),
          color: "#e2b86b",
        },
        {
          label: "Benchmark",
          values: comparison.benchmarkGrowthPoints.map((point) => point.balance),
          color: "#7f95b3",
        },
      ]
    : [
        {
          label: "Portfolio",
          values: analysis.performancePoints.map((point) => point.balance),
          color: "#e2b86b",
        },
      ];

  return (
    <ExpandableChartCard
      eyebrow="Chart preview"
      title="Portfolio Growth"
      description={
        comparison
          ? "Portfolio and benchmark growth normalized to the same starting capital over the overlapping comparison window."
          : "Balance path compounded from fixed target-weight daily portfolio returns."
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
