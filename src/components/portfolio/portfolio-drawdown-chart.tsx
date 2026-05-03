"use client";

import { Card } from "@/components/card";
import { LineChartPanel } from "@/components/line-chart-panel";
import type { PortfolioAnalysis } from "@/lib/finance/portfolio/types";

type PortfolioDrawdownChartProps = {
  analysis: PortfolioAnalysis;
};

export function PortfolioDrawdownChart({
  analysis,
}: PortfolioDrawdownChartProps) {
  return (
    <Card
      eyebrow="Risk path"
      title="Portfolio Drawdown"
      description="Peak-to-trough decline of the portfolio balance over the aligned market window."
      tone="elevated"
    >
      <LineChartPanel
        title="Portfolio Drawdown"
        dates={analysis.drawdownPoints.map((point) => point.date)}
        series={[
          {
            label: "Drawdown",
            values: analysis.drawdownPoints.map((point) => point.drawdown),
            color: "#ef8888",
          },
        ]}
        valueFormatter={formatPercent}
      />
    </Card>
  );
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}
