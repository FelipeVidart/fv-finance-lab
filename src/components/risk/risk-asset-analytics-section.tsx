import { Card } from "@/components/card";
import { RiskSectionEmptyState, RiskSeriesChartCard } from "@/components/risk/risk-shared";
import type { RiskAssetAnalyticsSectionProps } from "@/components/risk/types";

export function RiskAssetAnalyticsSection({
  data,
  charts,
  metricRows,
}: RiskAssetAnalyticsSectionProps) {
  if (!data) {
    return (
      <div
        id="asset-analytics-panel"
        role="tabpanel"
        aria-labelledby="asset-analytics-tab"
      >
        <RiskSectionEmptyState
          eyebrow="Asset Analytics"
          title="Asset analytics are waiting on a loaded dataset"
          description="Normalized price, return, drawdown, and asset summary views appear here after the shared market dataset is loaded."
        />
      </div>
    );
  }

  return (
    <div
      id="asset-analytics-panel"
      role="tabpanel"
      aria-labelledby="asset-analytics-tab"
      className="space-y-4"
    >
      <div className="grid gap-4 xl:grid-cols-3">
        {charts.map((chart) => (
          <RiskSeriesChartCard key={chart.title} {...chart} />
        ))}
      </div>

      <Card
        eyebrow="Asset Analytics"
        title="Asset summary metrics"
        description="Return, volatility, and drawdown statistics computed from the aligned daily close series."
      >
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[1.1fr_repeat(4,minmax(110px,1fr))] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>Ticker</span>
              <span>Total return</span>
              <span>Annualized return</span>
              <span>Annualized vol</span>
              <span>Max drawdown</span>
            </div>
            {metricRows.map((row) => (
              <div
                key={row.ticker}
                className="grid grid-cols-[1.1fr_repeat(4,minmax(110px,1fr))] gap-3 px-4 py-3 text-sm text-slate-200 not-last:border-b not-last:border-white/10"
              >
                <div className="space-y-1">
                  <span className="font-semibold text-white">{row.ticker}</span>
                  <p className="text-xs text-slate-500">{row.observations} obs</p>
                </div>
                <span>{row.totalReturnDisplay}</span>
                <span>{row.annualizedReturnDisplay}</span>
                <span>{row.annualizedVolatilityDisplay}</span>
                <span className="text-rose-200">{row.maxDrawdownDisplay}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
