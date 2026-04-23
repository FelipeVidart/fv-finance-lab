import { Card } from "@/components/card";
import {
  RiskSectionEmptyState,
  RiskSeriesChartCard,
  RiskStatChip,
  getSignedValueTone,
} from "@/components/risk/risk-shared";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { RiskPortfolioAnalyticsSectionProps } from "@/components/risk/types";

export function RiskPortfolioAnalyticsSection({
  data,
  holdings,
  portfolioAnalytics,
  portfolioCharts,
  portfolioKpis,
  weightValidation,
}: RiskPortfolioAnalyticsSectionProps) {
  if (!data) {
    return (
      <div
        id="portfolio-analytics-panel"
        role="tabpanel"
        aria-labelledby="portfolio-analytics-tab"
      >
        <RiskSectionEmptyState
          eyebrow="Portfolio Analytics"
          title="Portfolio analytics are waiting on setup"
          description="Portfolio NAV, drawdown, KPI, comparison, and holdings views appear here after a dataset is loaded and weights are ready."
        />
      </div>
    );
  }

  return (
    <div
      id="portfolio-analytics-panel"
      role="tabpanel"
      aria-labelledby="portfolio-analytics-tab"
      className="space-y-6"
    >
      <SurfaceCard tone="elevated" padding="md">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,0.72fr))]">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
              Portfolio review
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
              Move from the sandbox into weighted portfolio behavior.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-soft">
              Once weights are valid, the portfolio layer converts the aligned
              asset dataset into NAV, drawdown, comparison, and holdings views.
            </p>
          </div>
          <MiniStat
            label="Weight status"
            value={weightValidation?.isValid ? "Validated" : "Pending"}
          />
          <MiniStat label="Assets in basket" value={holdings.length.toString()} />
          <MiniStat
            label="Total weight"
            value={
              weightValidation
                ? `${weightValidation.totalPercent.toFixed(2)}%`
                : "No weights"
            }
          />
        </div>
      </SurfaceCard>

      {portfolioAnalytics ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {portfolioKpis.map((item, index) => (
              <RiskStatChip
                key={item.label}
                label={item.label}
                value={item.value}
                accent={index === 0}
              />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {portfolioCharts.map((chart) => (
              <RiskSeriesChartCard key={chart.title} {...chart} />
            ))}
          </div>
        </>
      ) : (
        <Card
          eyebrow="Portfolio Analytics"
          title="Portfolio analytics are not enabled yet"
          description="The weighted portfolio views stay gated until the current dataset has enough aligned observations and the entered weights sum to 100%."
        >
          <div className="rounded-[1.45rem] border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3 text-sm text-amber-200">
            {weightValidation?.error ??
              "Load data and validate weights to enable portfolio KPI and chart views."}
          </div>
        </Card>
      )}

      <Card
        eyebrow="Portfolio Analytics"
        title="Holdings and latest portfolio snapshot"
        description="Current weights, latest aligned prices, and latest total return for each loaded asset."
      >
        <div className="overflow-x-auto rounded-[1.5rem] border border-border/80 bg-slate-950/60">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[1.1fr_0.8fr_1fr_1fr_1fr] gap-3 border-b border-white/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              <span>Ticker</span>
              <span>Obs</span>
              <span>Weight</span>
              <span>Latest price</span>
              <span>Total return</span>
            </div>
            {holdings.map((row) => (
              <div
                key={row.ticker}
                className="grid grid-cols-[1.1fr_0.8fr_1fr_1fr_1fr] gap-3 px-4 py-3 text-sm text-slate-200 not-last:border-b not-last:border-white/10"
              >
                <span className="font-semibold text-foreground">{row.ticker}</span>
                <span>{row.observations}</span>
                <span className="text-foreground">{row.weightDisplay}</span>
                <span>{row.latestPriceDisplay}</span>
                <span className={getSignedValueTone(row.totalReturnDisplay)}>
                  {row.totalReturnDisplay}
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
