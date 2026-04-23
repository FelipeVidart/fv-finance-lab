import { Card } from "@/components/card";
import {
  RiskSectionEmptyState,
  RiskSeriesChartCard,
  getSignedValueTone,
} from "@/components/risk/risk-shared";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
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
      <SurfaceCard tone="elevated" padding="md" className="border-white/[0.08]">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(24rem,0.84fr)]">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
              Asset review
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
              Inspect the aligned assets before any portfolio interpretation is applied.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-soft">
              The asset layer isolates normalized price, cumulative return,
              drawdown, and cross-sectional metrics so the portfolio view starts
              from a cleaner reading of each component series.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat
              label="Loaded tickers"
              value={data.tickers.length.toString()}
              detail="Aligned asset universe"
            />
            <MiniStat
              label="Observations"
              value={data.meta.observations.toString()}
              detail="Shared daily data points"
            />
            <MiniStat label="Period" value={data.period} detail="Lookback window" />
            <MiniStat
              label="Review basis"
              value="Aligned closes"
              detail="Common history across assets"
            />
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-2">
        {charts.map((chart, index) => (
          <div
            key={chart.title}
            className={cn(index === 0 && "xl:col-span-2")}
          >
            <RiskSeriesChartCard {...chart} />
          </div>
        ))}
      </div>

      <Card
        eyebrow="Asset Analytics"
        title="Cross-sectional asset metrics"
        description="Return, volatility, and drawdown statistics computed from the aligned daily close series."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(18rem,0.84fr)]">
          <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[1.1fr_repeat(4,minmax(110px,1fr))] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                <span>Ticker</span>
                <span>Total return</span>
                <span>Annualized return</span>
                <span>Annualized vol</span>
                <span>Max drawdown</span>
              </div>
              {metricRows.map((row, index) => (
                <div
                  key={row.ticker}
                  className={cn(
                    "grid grid-cols-[1.1fr_repeat(4,minmax(110px,1fr))] gap-3 px-5 py-4 text-sm text-slate-200 not-last:border-b not-last:border-white/[0.08]",
                    index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                  )}
                >
                  <div className="space-y-1">
                    <span className="font-semibold text-foreground">{row.ticker}</span>
                    <p className="text-xs text-foreground-subtle">
                      {row.observations} obs
                    </p>
                  </div>
                  <span className={getSignedValueTone(row.totalReturnDisplay)}>
                    {row.totalReturnDisplay}
                  </span>
                  <span className={getSignedValueTone(row.annualizedReturnDisplay)}>
                    {row.annualizedReturnDisplay}
                  </span>
                  <span className="text-foreground">
                    {row.annualizedVolatilityDisplay}
                  </span>
                  <span className={getSignedValueTone(row.maxDrawdownDisplay)}>
                    {row.maxDrawdownDisplay}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <SurfaceCard padding="sm" className="border-white/[0.08]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
              Reading guide
            </p>
            <div className="mt-4 space-y-3">
              <ReadingLine
                title="Return profile"
                body="Compare total and annualized return before assuming the strongest series is also the most efficient."
              />
              <ReadingLine
                title="Volatility cost"
                body="Annualized volatility helps separate smooth compounding from unstable moves."
              />
              <ReadingLine
                title="Drawdown discipline"
                body="Max drawdown shows how severe the worst peak-to-trough path became inside the same dataset."
              />
            </div>
          </SurfaceCard>
        </div>
      </Card>
    </div>
  );
}

function MiniStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.76),rgba(10,17,26,0.54))] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-3 text-base font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-xs leading-6 text-foreground-muted">{detail}</p>
    </div>
  );
}

function ReadingLine({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.76),rgba(10,17,26,0.54))] px-4 py-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-foreground-soft">{body}</p>
    </div>
  );
}
