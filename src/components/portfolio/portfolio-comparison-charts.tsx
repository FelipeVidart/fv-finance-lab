"use client";

import { ExpandableChartCard } from "@/components/expandable-chart-card";
import { LineChartPanel } from "@/components/line-chart-panel";
import type {
  PortfolioComparisonPresetId,
  PortfolioComparisonResult,
} from "@/lib/finance/portfolio/comparison";

type PortfolioComparisonChartsProps = {
  comparison: PortfolioComparisonResult;
};

const SERIES_COLORS: Record<PortfolioComparisonPresetId, string> = {
  conservative: "#8fb8ff",
  balanced: "#e2b86b",
  aggressive: "#7dd3a8",
};

export function PortfolioComparisonCharts({
  comparison,
}: PortfolioComparisonChartsProps) {
  const cumulativeSeries = comparison.cumulativePerformance.series.map(
    (entry) => ({
      label: entry.label,
      values: entry.values,
      color: SERIES_COLORS[entry.portfolioId],
    }),
  );
  const drawdownSeries = comparison.drawdowns.series.map((entry) => ({
    label: entry.label,
    values: entry.values,
    color: SERIES_COLORS[entry.portfolioId],
  }));
  const worstDrawdownPortfolio = comparison.portfolios.reduce(
    (selected, portfolio) =>
      portfolio.metrics.maxDrawdown < selected.metrics.maxDrawdown
        ? portfolio
        : selected,
    comparison.portfolios[0],
  );

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ExpandableChartCard
        eyebrow="Comparison chart"
        title="Cumulative Performance"
        description="Historical cumulative return paths, normalized to 0% at the shared start date."
        detailDescription="Inspect the three predefined portfolios over the same aligned market-data window. Values are historical cumulative returns, not forecasts."
        renderPreview={({ open }) => (
          <LineChartPanel
            title="Portfolio Comparison Cumulative Performance"
            dates={comparison.cumulativePerformance.dates}
            series={cumulativeSeries}
            valueFormatter={formatSignedPercent}
            onChartClick={open}
            expandLabel="Open chart"
          />
        )}
        detail={
          <LineChartPanel
            title="Portfolio Comparison Cumulative Performance"
            dates={comparison.cumulativePerformance.dates}
            series={cumulativeSeries}
            valueFormatter={formatSignedPercent}
            heightClassName="h-[24rem] sm:h-[32rem] lg:h-[40rem]"
            interactive
            showSummary
          />
        }
      />

      <ExpandableChartCard
        eyebrow="Comparison chart"
        title="Drawdown Comparison"
        description="Peak-to-trough declines for each predefined portfolio across the same historical window."
        detailDescription="Inspect portfolio drawdowns over the shared date range. Drawdown is measured from each portfolio's prior peak."
        renderPreview={({ open }) => (
          <LineChartPanel
            title="Portfolio Comparison Drawdowns"
            dates={comparison.drawdowns.dates}
            series={drawdownSeries}
            valueFormatter={formatPercent}
            onChartClick={open}
            expandLabel="Open chart"
          />
        )}
        detail={
          <div className="space-y-4">
            <p className="rounded-[1.15rem] border border-white/[0.08] bg-background-muted/75 px-4 py-3 text-sm leading-7 text-foreground-soft">
              Deepest drawdown in this comparison:{" "}
              <span className="font-semibold text-foreground">
                {worstDrawdownPortfolio.label}
              </span>{" "}
              at {formatPercent(worstDrawdownPortfolio.metrics.maxDrawdown)}.
            </p>
            <LineChartPanel
              title="Portfolio Comparison Drawdowns"
              dates={comparison.drawdowns.dates}
              series={drawdownSeries}
              valueFormatter={formatPercent}
              heightClassName="h-[24rem] sm:h-[32rem] lg:h-[40rem]"
              interactive
              showSummary
            />
          </div>
        }
      />
    </div>
  );
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}
