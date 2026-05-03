"use client";

import { Card } from "@/components/card";
import { LineChartPanel } from "@/components/line-chart-panel";
import type { PortfolioAnalysis } from "@/lib/finance/portfolio/types";

type PortfolioGrowthChartProps = {
  analysis: PortfolioAnalysis;
};

export function PortfolioGrowthChart({ analysis }: PortfolioGrowthChartProps) {
  return (
    <Card
      eyebrow="Performance"
      title="Portfolio Growth"
      description="Balance path compounded from fixed target-weight daily portfolio returns."
      tone="elevated"
    >
      <LineChartPanel
        title="Portfolio Growth"
        dates={analysis.performancePoints.map((point) => point.date)}
        series={[
          {
            label: "Portfolio",
            values: analysis.performancePoints.map((point) => point.balance),
            color: "#e2b86b",
          },
        ]}
        valueFormatter={formatCurrency}
      />
    </Card>
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
