"use client";

import { ExpandableChartCard } from "@/components/expandable-chart-card";
import { LineChartPanel } from "@/components/line-chart-panel";
import type { PortfolioComparisonResult } from "@/lib/finance/portfolio/comparison";

type PortfolioComparisonChartsProps = {
  comparison: PortfolioComparisonResult;
};

const SERIES_COLORS = [
  "#8fb8ff",
  "#e2b86b",
  "#7dd3a8",
  "#d99adf",
  "#f59e8b",
];

export function PortfolioComparisonCharts({
  comparison,
}: PortfolioComparisonChartsProps) {
  const cumulativeSeries = comparison.cumulativePerformance.series.map(
    (entry, index) => ({
      label: entry.label,
      values: entry.values,
      color: SERIES_COLORS[index % SERIES_COLORS.length],
    }),
  );
  const drawdownSeries = comparison.drawdowns.series.map((entry, index) => ({
    label: entry.label,
    values: entry.values,
    color: SERIES_COLORS[index % SERIES_COLORS.length],
  }));
  const rollingVolatilitySeries = comparison.rollingVolatility.series.map(
    (entry, index) => ({
      label: entry.label,
      values: entry.values,
      color: SERIES_COLORS[index % SERIES_COLORS.length],
    }),
  );
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
        eyebrow="Performance comparison"
        title="Cumulative Performance"
        description="Historical cumulative return paths, normalized to 0% at the shared start date."
        detailDescription="Inspect selected portfolios over the same aligned market-data window. Values are historical cumulative returns, not forecasts."
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
        eyebrow="Risk path"
        title="Drawdown Comparison"
        description="Peak-to-trough declines for each selected portfolio across the same historical window."
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

      {comparison.rollingVolatility.dates.length > 0 ? (
        <div className="xl:col-span-2">
          <ExpandableChartCard
            eyebrow="Risk diagnostics"
            title="Rolling Volatility"
            description="Trailing 21-trading-day annualized realized volatility for each selected portfolio."
            detailDescription="Rolling volatility is calculated from each portfolio's simulated daily returns and annualized with 252 trading days."
            renderPreview={({ open }) => (
              <LineChartPanel
                title="Portfolio Rolling Volatility"
                dates={comparison.rollingVolatility.dates}
                series={rollingVolatilitySeries}
                valueFormatter={formatPercent}
                onChartClick={open}
                expandLabel="Open chart"
              />
            )}
            detail={
              <LineChartPanel
                title="Portfolio Rolling Volatility"
                dates={comparison.rollingVolatility.dates}
                series={rollingVolatilitySeries}
                valueFormatter={formatPercent}
                heightClassName="h-[24rem] sm:h-[32rem] lg:h-[40rem]"
                interactive
                showSummary
              />
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}
