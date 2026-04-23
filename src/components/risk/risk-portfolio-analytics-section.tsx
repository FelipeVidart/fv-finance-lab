import { Card } from "@/components/card";
import {
  RiskSectionEmptyState,
  RiskSeriesChartCard,
  RiskStatChip,
  getSignedValueTone,
} from "@/components/risk/risk-shared";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
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

  const portfolioReady = Boolean(portfolioAnalytics);

  return (
    <div
      id="portfolio-analytics-panel"
      role="tabpanel"
      aria-labelledby="portfolio-analytics-tab"
      className="space-y-6"
    >
      <SurfaceCard tone="elevated" padding="md" className="border-white/[0.08]">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(24rem,0.84fr)]">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
              Portfolio review
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
              Move from the sandbox into weighted portfolio behavior.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-soft">
              Once the sandbox is valid, the portfolio layer converts the
              aligned asset dataset into NAV, drawdown, comparison, KPI, and
              holdings outputs built from the same daily return base.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat
              label="Weight status"
              value={weightValidation?.isValid ? "Validated" : "Pending"}
              detail="Portfolio gate"
            />
            <MiniStat
              label="Assets in basket"
              value={holdings.length.toString()}
              detail="Current sandbox breadth"
            />
            <MiniStat
              label="Total weight"
              value={
                weightValidation
                  ? `${weightValidation.totalPercent.toFixed(2)}%`
                  : "No weights"
              }
              detail="Must equal 100%"
            />
            <MiniStat
              label="Portfolio state"
              value={portfolioReady ? "Live" : "Gated"}
              detail="Depends on valid weights"
            />
          </div>
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

          <div className="grid gap-4 xl:grid-cols-2">
            {portfolioCharts.map((chart, index) => (
              <div
                key={chart.title}
                className={cn(index === 2 && "xl:col-span-2")}
              >
                <RiskSeriesChartCard {...chart} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <Card
          eyebrow="Portfolio Analytics"
          title="Portfolio analytics are not enabled yet"
          description="The weighted portfolio views stay gated until the current dataset has enough aligned observations and the entered weights sum to 100%."
        >
          <div className="rounded-[1.45rem] border border-amber-400/25 bg-amber-400/[0.08] px-4 py-4 text-sm leading-7 text-amber-200">
            {weightValidation?.error ??
              "Load data and validate weights to enable portfolio KPI and chart views."}
          </div>
        </Card>
      )}

      <Card
        eyebrow="Portfolio Analytics"
        title="Holdings and latest portfolio snapshot"
        description="Current weights, latest aligned prices, and latest total return for each loaded asset in the sandbox."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(20rem,0.84fr)]">
          <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[1.1fr_0.8fr_1fr_1fr_1fr] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                <span>Ticker</span>
                <span>Obs</span>
                <span>Weight</span>
                <span>Latest price</span>
                <span>Total return</span>
              </div>
              {holdings.map((row, index) => (
                <div
                  key={row.ticker}
                  className={cn(
                    "grid grid-cols-[1.1fr_0.8fr_1fr_1fr_1fr] gap-3 px-5 py-4 text-sm text-slate-200 not-last:border-b not-last:border-white/[0.08]",
                    index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                  )}
                >
                  <span className="font-semibold text-foreground">{row.ticker}</span>
                  <span className="text-foreground-soft">{row.observations}</span>
                  <span className="text-foreground">{row.weightDisplay}</span>
                  <span className="text-foreground-soft">{row.latestPriceDisplay}</span>
                  <span className={getSignedValueTone(row.totalReturnDisplay)}>
                    {row.totalReturnDisplay}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <SurfaceCard
              padding="sm"
              className={cn(
                "border-white/[0.08]",
                weightValidation?.isValid ? "border-emerald-400/18" : "border-amber-400/20",
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                Validation block
              </p>
              <p className="mt-3 text-sm leading-7 text-foreground-soft">
                {weightValidation?.isValid
                  ? "The sandbox is validated and the weighted portfolio outputs shown above are active."
                  : weightValidation?.error ??
                    "Portfolio outputs remain gated until the current weight mix becomes valid."}
              </p>
            </SurfaceCard>

            <SurfaceCard padding="sm" className="border-white/[0.08]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                Interpretation notes
              </p>
              <div className="mt-4 space-y-3">
                <ReadingLine
                  title="Portfolio NAV"
                  body="Read NAV as the compounded weighted path implied by the sandbox mix."
                />
                <ReadingLine
                  title="Drawdown discipline"
                  body="Portfolio drawdown helps test whether diversification actually improved the path."
                />
                <ReadingLine
                  title="Holdings context"
                  body="The holdings table connects the abstract KPI layer back to the active asset basket."
                />
              </div>
            </SurfaceCard>
          </div>
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
