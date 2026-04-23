import { Card } from "@/components/card";
import {
  RiskSectionEmptyState,
  RiskSeriesChartCard,
  getSignedValueTone,
} from "@/components/risk/risk-shared";
import { SurfaceCard } from "@/components/ui/surface-card";
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
      className="space-y-6"
    >
      <SurfaceCard tone="elevated" padding="md">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,0.72fr))]">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
              Asset review
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
              Inspect how the aligned assets behave before combining them.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-soft">
              The asset section isolates normalized price, cumulative return,
              drawdown, and summary metrics so the portfolio layer starts from a
              cleaner interpretation of each component series.
            </p>
          </div>
          <MiniStat label="Loaded tickers" value={data.tickers.length.toString()} />
          <MiniStat label="Observations" value={data.meta.observations.toString()} />
          <MiniStat label="Period" value={data.period} />
        </div>
      </SurfaceCard>

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
        <div className="overflow-x-auto rounded-[1.5rem] border border-border/80 bg-slate-950/60">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[1.1fr_repeat(4,minmax(110px,1fr))] gap-3 border-b border-white/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
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
                  <span className="font-semibold text-foreground">{row.ticker}</span>
                  <p className="text-xs text-foreground-subtle">{row.observations} obs</p>
                </div>
                <span className={getSignedValueTone(row.totalReturnDisplay)}>
                  {row.totalReturnDisplay}
                </span>
                <span className={getSignedValueTone(row.annualizedReturnDisplay)}>
                  {row.annualizedReturnDisplay}
                </span>
                <span className="text-foreground">{row.annualizedVolatilityDisplay}</span>
                <span className={getSignedValueTone(row.maxDrawdownDisplay)}>
                  {row.maxDrawdownDisplay}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/45 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-3 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
