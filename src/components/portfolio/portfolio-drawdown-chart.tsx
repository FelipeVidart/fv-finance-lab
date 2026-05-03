"use client";

import { ExpandableChartCard } from "@/components/expandable-chart-card";
import { LineChartPanel } from "@/components/line-chart-panel";
import type { PortfolioAnalysis } from "@/lib/finance/portfolio/types";

type PortfolioDrawdownChartProps = {
  analysis: PortfolioAnalysis;
};

export function PortfolioDrawdownChart({
  analysis,
}: PortfolioDrawdownChartProps) {
  const comparison = analysis.benchmarkComparison;
  const dates = comparison
    ? comparison.portfolioDrawdownPoints.map((point) => point.date)
    : analysis.drawdownPoints.map((point) => point.date);
  const series = comparison
    ? [
        {
          label: "Portfolio",
          values: comparison.portfolioDrawdownPoints.map((point) => point.drawdown),
          color: "#ef8888",
        },
        {
          label: "Benchmark",
          values: comparison.benchmarkDrawdownPoints.map((point) => point.drawdown),
          color: "#7f95b3",
        },
      ]
    : [
        {
          label: "Portfolio",
          values: analysis.drawdownPoints.map((point) => point.drawdown),
          color: "#ef8888",
        },
      ];

  return (
    <ExpandableChartCard
      eyebrow="Chart preview"
      title="Portfolio Drawdown"
      description={
        comparison
          ? "Portfolio and benchmark peak-to-trough declines over the overlapping comparison window."
          : "Peak-to-trough decline of the portfolio balance over the aligned market window."
      }
      detailDescription={
        comparison
          ? "Inspect portfolio and benchmark drawdown over the shared comparison window. Hover the expanded chart to review the nearest date and drawdown."
          : "Inspect the portfolio drawdown path across the aligned market-data window. Hover the expanded chart to review the nearest date and drawdown."
      }
      renderPreview={({ open }) => (
        <LineChartPanel
          title="Portfolio Drawdown"
          dates={dates}
          series={series}
          valueFormatter={formatPercent}
          onChartClick={open}
          expandLabel="Open chart"
        />
      )}
      detail={
        <LineChartPanel
          title="Portfolio Drawdown"
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
