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
  const dates = analysis.drawdownPoints.map((point) => point.date);
  const series = [
    {
      label: "Drawdown",
      values: analysis.drawdownPoints.map((point) => point.drawdown),
      color: "#ef8888",
    },
  ];

  return (
    <ExpandableChartCard
      eyebrow="Chart preview"
      title="Portfolio Drawdown"
      description="Peak-to-trough decline of the portfolio balance over the aligned market window."
      detailDescription="Inspect the portfolio drawdown path across the aligned market-data window. Hover the expanded chart to review the nearest date and drawdown."
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
