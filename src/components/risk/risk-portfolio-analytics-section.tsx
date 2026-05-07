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
import type {
  DescriptiveStatistics,
  DrawdownSummary,
  PortfolioRiskAnalysis,
  RiskContributionRow,
  TailRiskMetrics,
} from "@/lib/finance/risk/types";

export function RiskPortfolioAnalyticsSection({
  data,
  holdings,
  portfolioAnalytics,
  portfolioCharts,
  portfolioKpis,
  portfolioRiskAnalysis,
  riskKpis,
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
  const riskReady = Boolean(portfolioRiskAnalysis);

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
              Portfolio Market Risk Lab
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
              Evaluate weighted portfolio behavior through performance, tail
              risk, volatility, and instrument contribution.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-soft">
              Once the sandbox is valid, the portfolio layer converts the
              aligned asset dataset into NAV, drawdown, tail-risk, EWMA
              volatility, rolling volatility, and contribution outputs built
              from the same daily return base.
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
              label="Risk observations"
              value={
                portfolioRiskAnalysis
                  ? portfolioRiskAnalysis.methodology.observations.toString()
                  : "Gated"
              }
              detail="Daily portfolio returns"
            />
            <MiniStat
              label="Risk engine"
              value={riskReady ? "Live" : portfolioReady ? "Pending" : "Gated"}
              detail="Requires valid weights and returns"
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

          {riskKpis.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {riskKpis.map((item, index) => (
                <RiskStatChip
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  accent={index === 0}
                />
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            {portfolioCharts.map((chart) => (
              <div
                key={chart.title}
                className={cn(
                  chart.title === "Portfolio vs Assets" && "xl:col-span-2",
                )}
              >
                <RiskSeriesChartCard {...chart} />
              </div>
            ))}
          </div>

          {portfolioRiskAnalysis ? (
            <PortfolioRiskDiagnostics analysis={portfolioRiskAnalysis} />
          ) : (
            <SurfaceCard padding="sm" className="border-amber-400/20">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                Risk analysis pending
              </p>
              <p className="mt-3 text-sm leading-7 text-foreground-soft">
                The performance layer is available, but the risk engine could
                not produce a full analysis for the current sample.
              </p>
            </SurfaceCard>
          )}
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
                  <span className="font-semibold text-foreground">
                    {row.ticker}
                  </span>
                  <span className="text-foreground-soft">{row.observations}</span>
                  <span className="text-foreground">{row.weightDisplay}</span>
                  <span className="text-foreground-soft">
                    {row.latestPriceDisplay}
                  </span>
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
                weightValidation?.isValid
                  ? "border-emerald-400/18"
                  : "border-amber-400/20",
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
                  title="Historical measures"
                  body="Returns, volatility, VaR, and expected tail loss come from the selected historical window."
                />
                <ReadingLine
                  title="Tail-risk discipline"
                  body="VaR and expected tail loss are shown as positive daily loss measures for readability."
                />
                <ReadingLine
                  title="Analytics boundary"
                  body="The workspace supports portfolio analytics and education; it is not investment advice."
                />
              </div>
            </SurfaceCard>
          </div>
        </div>
      </Card>
    </div>
  );
}

function PortfolioRiskDiagnostics({
  analysis,
}: {
  analysis: PortfolioRiskAnalysis;
}) {
  return (
    <div className="space-y-4">
      <Card
        eyebrow="Risk Diagnostics"
        title="Portfolio return diagnostics and tail-risk profile"
        description="Daily return statistics, empirical loss measures, parametric VaR, and drawdown context for the validated portfolio."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <DescriptiveStatisticsTable stats={analysis.descriptiveStats} />
          <TailRiskTable tailRisk={analysis.tailRisk} />
          <DrawdownDiagnostics drawdown={analysis.drawdownSummary} />
        </div>
      </Card>

      <Card
        eyebrow="Risk Contribution"
        title="Instrument contribution to annualized portfolio volatility"
        description="Risk contribution uses the annualized covariance matrix of aligned asset returns and the current portfolio weights."
      >
        <RiskContributionTable rows={analysis.riskContribution} />
      </Card>

      <Card
        eyebrow="Methodology"
        title="Methodology and limitations"
        description="The risk lab adapts the portfolio-risk-pipeline methodology into browser-based TypeScript analytics."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
          <div className="grid gap-3 sm:grid-cols-2">
            <MethodologyPoint
              title="Historical VaR and ETL"
              body="Empirical daily loss measures from the selected return sample. Losses are displayed as positive percentages."
            />
            <MethodologyPoint
              title="Parametric VaR"
              body="Normal-approximation daily VaR using the sample mean and latest EWMA daily volatility."
            />
            <MethodologyPoint
              title="EWMA daily volatility"
              body={`Lambda ${analysis.methodology.ewmaLambda.toFixed(2)} gives more weight to recent squared daily returns.`}
            />
            <MethodologyPoint
              title="Data dependency"
              body="Outputs depend on selected tickers, provider, lookback window, common-date alignment, and data quality."
            />
          </div>

          <SurfaceCard padding="sm" className="border-white/[0.08]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
              Analysis metadata
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <MetadataLine
                label="Confidence"
                value={formatPercentNoSign(analysis.methodology.confidenceLevel)}
              />
              <MetadataLine
                label="Observations"
                value={analysis.methodology.observations.toString()}
              />
              <MetadataLine
                label="Return window"
                value={`${formatDateLabel(analysis.methodology.startDate)} - ${formatDateLabel(
                  analysis.methodology.endDate,
                )}`}
              />
              <MetadataLine
                label="Rolling window"
                value={`${analysis.methodology.rollingWindowDays} trading days`}
              />
            </div>

            {analysis.methodology.warnings.length > 0 ? (
              <div className="mt-5 rounded-[1.2rem] border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                  Sample notes
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-100/90">
                  {analysis.methodology.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </SurfaceCard>
        </div>
      </Card>
    </div>
  );
}

function DescriptiveStatisticsTable({
  stats,
}: {
  stats: DescriptiveStatistics;
}) {
  const rows = [
    ["Observations", stats.observations.toString()],
    ["Mean daily return", formatSignedPercent(stats.mean)],
    ["Sample daily volatility", formatPercentNoSign(stats.sampleStandardDeviation)],
    ["Best daily return", formatSignedPercent(stats.bestDailyReturn)],
    ["Worst daily return", formatSignedPercent(stats.worstDailyReturn)],
    ["Positive-day ratio", formatPercentNoSign(stats.positiveDayRatio)],
    ["Skewness", formatOptionalNumber(stats.skewness)],
    ["Excess kurtosis", formatOptionalNumber(stats.excessKurtosis)],
  ];

  return (
    <DiagnosticsPanel
      eyebrow="Descriptive statistics"
      body="Central tendency, dispersion, asymmetry, and realized daily-return extremes."
      rows={rows}
    />
  );
}

function TailRiskTable({ tailRisk }: { tailRisk: TailRiskMetrics }) {
  const confidence = formatPercentNoSign(tailRisk.confidenceLevel);
  const rows = [
    ["Historical VaR", formatPercentNoSign(tailRisk.historicalVaR)],
    [
      "Expected tail loss",
      formatPercentNoSign(tailRisk.historicalExpectedShortfall),
    ],
    ["Parametric VaR", formatPercentNoSign(tailRisk.parametricVaR)],
    ["Confidence level", confidence],
  ];

  return (
    <DiagnosticsPanel
      eyebrow="Tail risk"
      body={`${confidence} daily loss estimates. Historical measures use empirical returns; parametric VaR uses a normal approximation.`}
      rows={rows}
    />
  );
}

function DrawdownDiagnostics({ drawdown }: { drawdown: DrawdownSummary }) {
  const rows = [
    ["Max drawdown", formatSignedPercent(drawdown.maxDrawdown)],
    ["Drawdown start", formatDateLabel(drawdown.startDate)],
    ["Trough date", formatDateLabel(drawdown.troughDate)],
    [
      "Recovery date",
      drawdown.endDate ? formatDateLabel(drawdown.endDate) : "Not recovered",
    ],
    ["Current drawdown", formatSignedPercent(drawdown.currentDrawdown)],
  ];

  return (
    <DiagnosticsPanel
      eyebrow="Drawdown path"
      body="Peak-to-trough behavior of the normalized portfolio NAV."
      rows={rows}
    />
  );
}

function DiagnosticsPanel({
  eyebrow,
  body,
  rows,
}: {
  eyebrow: string;
  body: string;
  rows: string[][];
}) {
  return (
    <SurfaceCard padding="sm" className="h-full border-white/[0.08]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
        {eyebrow}
      </p>
      <p className="mt-3 text-sm leading-6 text-foreground-soft">{body}</p>
      <div className="mt-4 divide-y divide-white/[0.08] rounded-[1.2rem] border border-white/[0.08] bg-background-muted/70">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-4 py-3 text-sm"
          >
            <span className="text-foreground-soft">{label}</span>
            <span className={cn("font-semibold", getSignedValueTone(value))}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}

function RiskContributionTable({ rows }: { rows: RiskContributionRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[1.4rem] border border-amber-400/20 bg-amber-400/[0.07] px-4 py-4 text-sm leading-7 text-amber-100">
        Risk contribution is unavailable for the current asset return sample.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
      <div className="min-w-[860px]">
        <div className="grid grid-cols-[0.9fr_0.8fr_1fr_1fr_1fr_1fr] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
          <span>Ticker</span>
          <span>Weight</span>
          <span>Ann. vol</span>
          <span>Marginal ann. vol</span>
          <span>Ann. vol contribution</span>
          <span>Contribution share</span>
        </div>
        {rows.map((row, index) => (
          <div
            key={row.ticker}
            className={cn(
              "grid grid-cols-[0.9fr_0.8fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-4 text-sm text-slate-200 not-last:border-b not-last:border-white/[0.08]",
              index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
            )}
          >
            <span className="font-semibold text-foreground">{row.ticker}</span>
            <span className="text-foreground">{formatPercentNoSign(row.weight)}</span>
            <span className="text-foreground-soft">
              {formatPercentNoSign(row.annualizedVolatility)}
            </span>
            <span
              className={getSignedValueTone(
                formatSignedPercent(row.marginalContributionToVolatility),
              )}
            >
              {formatSignedPercent(row.marginalContributionToVolatility)}
            </span>
            <span
              className={getSignedValueTone(
                formatSignedPercent(row.contributionToVolatility),
              )}
            >
              {formatSignedPercent(row.contributionToVolatility)}
            </span>
            <span
              className={getSignedValueTone(
                formatSignedPercent(row.percentContributionToVolatility),
              )}
            >
              {formatSignedPercent(row.percentContributionToVolatility)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MethodologyPoint({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.76),rgba(10,17,26,0.54))] px-4 py-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-foreground-soft">{body}</p>
    </div>
  );
}

function MetadataLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1rem] border border-white/[0.08] bg-background-muted/70 px-3 py-2.5">
      <span className="text-foreground-soft">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
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

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

function formatPercentNoSign(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatOptionalNumber(value: number | null): string {
  return value === null ? "N/A" : value.toFixed(2);
}

function formatDateLabel(value: string | null): string {
  if (!value) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
