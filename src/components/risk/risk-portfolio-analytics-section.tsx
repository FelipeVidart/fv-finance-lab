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
import { DEFAULT_FACTOR_DEFINITIONS } from "@/lib/finance/risk/factor-gradvar";
import type {
  CurrentVsProposedRiskComparison,
  CurrentVsProposedMetricRow,
  DescriptiveStatistics,
  DrawdownSummary,
  FactorDefinition,
  FactorGradVarAnalysis,
  InstrumentVaRContributionAnalysis,
  InstrumentVaRContributionRow,
  PortfolioRiskAnalysis,
  PortfolioScenarioAnalysis,
  ScenarioAnalysisResult,
  RiskContributionRow,
  TailRiskMetrics,
} from "@/lib/finance/risk/types";

export function RiskPortfolioAnalyticsSection({
  data,
  factorGradVarAnalysis,
  factorGradVarError,
  factorGradVarLoading,
  currentVsProposedComparison,
  holdings,
  portfolioAnalytics,
  portfolioCharts,
  portfolioKpis,
  portfolioRiskAnalysis,
  portfolioValue,
  presentationCurrency,
  riskKpis,
  scenarioAnalysis,
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
            <PortfolioRiskDiagnostics
              analysis={portfolioRiskAnalysis}
              factorGradVarAnalysis={factorGradVarAnalysis}
              factorGradVarError={factorGradVarError}
              factorGradVarLoading={factorGradVarLoading}
              currentVsProposedComparison={currentVsProposedComparison}
              portfolioValue={portfolioValue}
              presentationCurrency={presentationCurrency}
              scenarioAnalysis={scenarioAnalysis}
            />
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
  factorGradVarAnalysis,
  factorGradVarError,
  factorGradVarLoading,
  currentVsProposedComparison,
  portfolioValue,
  presentationCurrency,
  scenarioAnalysis,
}: {
  analysis: PortfolioRiskAnalysis;
  factorGradVarAnalysis: FactorGradVarAnalysis | null;
  factorGradVarError: string | null;
  factorGradVarLoading: boolean;
  currentVsProposedComparison: CurrentVsProposedRiskComparison | null;
  portfolioValue: number | null;
  presentationCurrency: RiskPortfolioAnalyticsSectionProps["presentationCurrency"];
  scenarioAnalysis: PortfolioScenarioAnalysis | null;
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
          <TailRiskTable
            tailRisk={analysis.tailRisk}
            portfolioValue={portfolioValue}
            presentationCurrency={presentationCurrency}
          />
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

      <InstrumentVaRContributionSection
        analysis={analysis.instrumentVaRContribution}
        presentationCurrency={presentationCurrency}
      />

      <FactorGradVarAttributionSection
        analysis={factorGradVarAnalysis}
        error={factorGradVarError}
        isLoading={factorGradVarLoading}
      />

      <ScenarioAnalysisSection
        analysis={scenarioAnalysis}
        presentationCurrency={presentationCurrency}
      />

      <CurrentVsProposedSection
        analysis={currentVsProposedComparison}
      />

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
            <MethodologyPoint
              title="Factor GradVaR"
              body="GradVaR decomposes factor-model VaR from ETF proxy regressions, component VaR, and marginal VaR by factor."
            />
            <MethodologyPoint
              title="Scenario Analysis"
              body="Scenario impacts apply hypothetical factor shocks to the current factor betas and weights. They are not forecasts or probabilities."
            />
            <MethodologyPoint
              title="Instrument Component VaR"
              body="Instrument Component VaR uses the daily covariance matrix and current weights. Signed contributions can be negative when a position diversifies portfolio VaR."
            />
            <MethodologyPoint
              title="Proxy limitation"
              body="ETF proxies are simplifications, not pure economic factors; results are sensitive to lookback window, factor choice, correlations, and multicollinearity."
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

function ScenarioAnalysisSection({
  analysis,
  presentationCurrency,
}: {
  analysis: PortfolioScenarioAnalysis | null;
  presentationCurrency: RiskPortfolioAnalyticsSectionProps["presentationCurrency"];
}) {
  return (
    <Card
      eyebrow="Scenario Analysis"
      title="Hypothetical portfolio stress scenarios"
      description="Applies predefined factor shocks to the current factor betas and weights to estimate portfolio impact and leading contributors."
    >
      {analysis ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            {analysis.scenarios.map((scenario) => (
              <ScenarioSummaryCard
                key={scenario.scenarioId}
                scenario={scenario}
                presentationCurrency={presentationCurrency}
              />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(20rem,0.88fr)]">
            <ScenarioContributorTables
              scenarios={analysis.scenarios}
              presentationCurrency={presentationCurrency}
            />
            <ScenarioMethodologyNotes analysis={analysis} />
          </div>
        </div>
      ) : (
        <FactorUnavailableState
          title="Scenario analysis unavailable"
          body="Scenario Analysis unlocks after factor attribution is available for the current portfolio."
        />
      )}
    </Card>
  );
}

function CurrentVsProposedSection({
  analysis,
}: {
  analysis: CurrentVsProposedRiskComparison | null;
}) {
  return (
    <Card
      eyebrow="Current vs Proposed"
      title="Risk profile comparison"
      description="Compares the current and proposed allocations using the same tickers, historical window, confidence level, and factor proxy set."
    >
      {analysis ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MiniStat
              label="Volatility change"
              value={formatSignedPercent(analysis.summary.volatilityDelta)}
              detail="Proposed minus current annualized volatility."
            />
            <MiniStat
              label="VaR change"
              value={formatSignedPercent(analysis.summary.varDelta)}
              detail="Proposed minus current daily Historical VaR."
            />
            <MiniStat
              label="Top-3 concentration"
              value={formatSignedPercent(
                analysis.summary.topThreeConcentrationDelta,
              )}
              detail="Change in share explained by the top three risk contributors."
            />
            <MiniStat
              label="Max contributor"
              value={
                analysis.summary.maxRiskContributorChanged
                  ? "Changed"
                  : "Unchanged"
              }
              detail={`${analysis.current.maxRiskContributor ?? "N/A"} -> ${
                analysis.proposed.maxRiskContributor ?? "N/A"
              }.`}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
            <CurrentVsProposedMetricTable analysis={analysis} />
            <CurrentVsProposedNotes analysis={analysis} />
          </div>

          <CurrentVsProposedFactorTable analysis={analysis} />
        </div>
      ) : (
        <FactorUnavailableState
          title="Current-vs-proposed comparison unavailable"
          body="Validate both current and proposed weights to compare risk metrics on the same market dataset."
        />
      )}
    </Card>
  );
}

function CurrentVsProposedMetricTable({
  analysis,
}: {
  analysis: CurrentVsProposedRiskComparison;
}) {
  return (
    <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
      <table className="w-full min-w-[820px] text-left">
        <thead className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
          <tr>
            <th className="px-5 py-3">Metric</th>
            <th className="px-5 py-3">Current</th>
            <th className="px-5 py-3">Proposed</th>
            <th className="px-5 py-3">Delta</th>
            <th className="px-5 py-3">Reading</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.08] text-sm">
          {analysis.metricRows.map((row, index) => (
            <tr
              key={row.key}
              className={index % 2 === 0 ? "bg-white/[0.015]" : undefined}
            >
              <td className="px-5 py-4 font-semibold text-foreground">
                {row.label}
              </td>
              <td className="px-5 py-4 text-foreground-soft">
                {formatComparisonMetric(row.key, row.current)}
              </td>
              <td className="px-5 py-4 text-foreground-soft">
                {formatComparisonMetric(row.key, row.proposed)}
              </td>
              <td className={cn("px-5 py-4", getNumberTone(row.delta))}>
                {formatComparisonMetric(row.key, row.delta, true)}
              </td>
              <td className="px-5 py-4 text-foreground-muted">
                {formatComparisonReading(row)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CurrentVsProposedNotes({
  analysis,
}: {
  analysis: CurrentVsProposedRiskComparison;
}) {
  return (
    <SurfaceCard padding="sm" className="h-full border-white/[0.08]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
        Comparison notes
      </p>
      <div className="mt-4 space-y-3">
        <ReadingLine
          title="Same base"
          body="Both profiles use the same tickers, provider, lookback window, confidence level, and return construction."
        />
        <ReadingLine
          title="Risk explanation"
          body="The comparison explains how the proposed weights change risk metrics. It does not decide whether the proposal is suitable."
        />
        <ReadingLine
          title="Contributor focus"
          body="Max contributor and top-3 concentration show whether risk becomes more or less concentrated."
        />
      </div>

      {analysis.methodology.warnings.length > 0 ? (
        <div className="mt-5 rounded-[1.2rem] border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
            Comparison notes
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-100/90">
            {analysis.methodology.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </SurfaceCard>
  );
}

function CurrentVsProposedFactorTable({
  analysis,
}: {
  analysis: CurrentVsProposedRiskComparison;
}) {
  if (analysis.factorRows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
      <table className="w-full min-w-[760px] text-left">
        <thead className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
          <tr>
            <th className="px-5 py-3">Factor</th>
            <th className="px-5 py-3">Proxy</th>
            <th className="px-5 py-3">Current share</th>
            <th className="px-5 py-3">Proposed share</th>
            <th className="px-5 py-3">Delta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.08] text-sm">
          {analysis.factorRows.map((row, index) => (
            <tr
              key={row.factorId}
              className={index % 2 === 0 ? "bg-white/[0.015]" : undefined}
            >
              <td className="px-5 py-4 font-semibold text-foreground">
                {row.factorName}
              </td>
              <td className="px-5 py-4 text-foreground-soft">
                {row.proxyTicker}
              </td>
              <td className="px-5 py-4 text-foreground-soft">
                {formatSignedPercent(row.currentContributionShare)}
              </td>
              <td className="px-5 py-4 text-foreground-soft">
                {formatSignedPercent(row.proposedContributionShare)}
              </td>
              <td
                className={cn(
                  "px-5 py-4",
                  getNumberTone(row.deltaContributionShare),
                )}
              >
                {formatSignedPercent(row.deltaContributionShare)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScenarioSummaryCard({
  scenario,
  presentationCurrency,
}: {
  scenario: ScenarioAnalysisResult;
  presentationCurrency: RiskPortfolioAnalyticsSectionProps["presentationCurrency"];
}) {
  return (
    <SurfaceCard padding="sm" className="border-white/[0.08]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
        {scenario.scenarioName}
      </p>
      <p className="mt-3 text-xl font-semibold text-foreground">
        {formatScenarioImpactAndMoney(
          scenario.estimatedImpact,
          scenario.monetaryImpact,
          presentationCurrency,
        )}
      </p>
      <p className="mt-3 text-sm leading-6 text-foreground-soft">
        {scenario.description}
      </p>
      <p className="mt-3 rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-100">
        {scenario.hypotheticalLabel}
      </p>
    </SurfaceCard>
  );
}

function ScenarioContributorTables({
  scenarios,
  presentationCurrency,
}: {
  scenarios: ScenarioAnalysisResult[];
  presentationCurrency: RiskPortfolioAnalyticsSectionProps["presentationCurrency"];
}) {
  return (
    <div className="space-y-4">
      {scenarios.map((scenario) => (
        <div
          key={scenario.scenarioId}
          className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]"
        >
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              <tr>
                <th className="px-5 py-3" colSpan={6}>
                  {scenario.scenarioName} contributors
                </th>
              </tr>
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Ticker</th>
                <th className="px-5 py-3">Weight</th>
                <th className="px-5 py-3">Instrument impact</th>
                <th className="px-5 py-3">Weighted impact</th>
                <th className="px-5 py-3">Money impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08] text-sm">
              {scenario.topContributors.map((row, index) => (
                <tr
                  key={`${scenario.scenarioId}-${row.ticker}`}
                  className={index % 2 === 0 ? "bg-white/[0.015]" : undefined}
                >
                  <td className="px-5 py-4 text-foreground-soft">
                    #{row.rankByAbsWeightedImpact}
                  </td>
                  <td className="px-5 py-4 font-semibold text-foreground">
                    {row.ticker}
                  </td>
                  <td className="px-5 py-4 text-foreground">
                    {formatPercentNoSign(row.weight)}
                  </td>
                  <td
                    className={cn(
                      "px-5 py-4",
                      getNumberTone(row.estimatedInstrumentImpact),
                    )}
                  >
                    {formatSignedPercent(row.estimatedInstrumentImpact)}
                  </td>
                  <td
                    className={cn("px-5 py-4", getNumberTone(row.weightedImpact))}
                  >
                    {formatSignedPercent(row.weightedImpact)}
                  </td>
                  <td
                    className={cn(
                      "px-5 py-4",
                      getNumberTone(row.monetaryImpact ?? 0),
                    )}
                  >
                    {formatScenarioMoney(row.monetaryImpact, presentationCurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function ScenarioMethodologyNotes({
  analysis,
}: {
  analysis: PortfolioScenarioAnalysis;
}) {
  return (
    <SurfaceCard padding="sm" className="h-full border-white/[0.08]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
        Scenario methodology
      </p>
      <div className="mt-4 space-y-3">
        <ReadingLine
          title="Shock engine"
          body="Each scenario defines factor shocks. Instrument impacts are estimated from current factor betas, then weighted by portfolio allocation."
        />
        <ReadingLine
          title="Initial scenario set"
          body="Work 4 starts with global risk-off, Argentina stress, and rates shock."
        />
        <ReadingLine
          title="Boundary"
          body="Scenario Analysis is hypothetical and deterministic. It does not assign probability, forecast timing, or recommend trades."
        />
      </div>

      {analysis.methodology.warnings.length > 0 ? (
        <div className="mt-5 rounded-[1.2rem] border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
            Scenario notes
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-100/90">
            {analysis.methodology.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </SurfaceCard>
  );
}

function InstrumentVaRContributionSection({
  analysis,
  presentationCurrency,
}: {
  analysis: InstrumentVaRContributionAnalysis;
  presentationCurrency: RiskPortfolioAnalyticsSectionProps["presentationCurrency"];
}) {
  const topTicker = analysis.summary.topContributorTicker ?? "N/A";
  const summaryCards = [
    {
      label: `Portfolio VaR ${formatPercentNoSign(analysis.summary.confidenceLevel)}`,
      value: formatLossPercentAndMoney(
        analysis.summary.portfolioVaR,
        analysis.summary.portfolioValue,
        presentationCurrency,
      ),
      detail: "Covariance-based daily VaR used for instrument decomposition.",
    },
    {
      label: "Top contributor",
      value: topTicker,
      detail:
        analysis.summary.topContributorTicker === null
          ? "No contributor available."
          : `${formatPercentNoSign(analysis.summary.topContributorShare)} of absolute component risk.`,
    },
    {
      label: "Top 3 concentration",
      value: formatPercentNoSign(analysis.summary.topThreeContributionShare),
      detail: "Share of absolute component VaR explained by the largest three contributors.",
    },
    {
      label: "Risk HHI",
      value: analysis.summary.concentrationHerfindahl.toFixed(2),
      detail: "Higher means component VaR is more concentrated in fewer instruments.",
    },
  ];

  return (
    <Card
      eyebrow="Instrument VaR Attribution"
      title="Weight vs risk contribution"
      description="Marginal VaR estimates sensitivity to each instrument weight; Component VaR translates that sensitivity into the instrument's signed daily VaR contribution."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <MiniStat
              key={item.label}
              label={item.label}
              value={item.value}
              detail={item.detail}
            />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
          <InstrumentVaRContributionTable
            rows={analysis.rows}
            presentationCurrency={presentationCurrency}
            portfolioValue={analysis.summary.portfolioValue}
          />
          <TopContributorPanel rows={analysis.topContributors} />
        </div>

        <WeightVsRiskContributionBars rows={analysis.rows} />
      </div>
    </Card>
  );
}

function InstrumentVaRContributionTable({
  rows,
  presentationCurrency,
  portfolioValue,
}: {
  rows: InstrumentVaRContributionRow[];
  presentationCurrency: RiskPortfolioAnalyticsSectionProps["presentationCurrency"];
  portfolioValue: number | null;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[1.4rem] border border-amber-400/20 bg-amber-400/[0.07] px-4 py-4 text-sm leading-7 text-amber-100">
        Instrument VaR attribution is unavailable for the current asset return
        sample.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
      <table className="w-full min-w-[880px] text-left">
        <thead className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
          <tr>
            <th className="px-5 py-3">Rank</th>
            <th className="px-5 py-3">Ticker</th>
            <th className="px-5 py-3">Weight</th>
            <th className="px-5 py-3">Marginal VaR</th>
            <th className="px-5 py-3">Component VaR</th>
            <th className="px-5 py-3">Money-at-risk</th>
            <th className="px-5 py-3">Contribution share</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.08] text-sm">
          {rows.map((row, index) => (
            <tr
              key={row.ticker}
              className={index % 2 === 0 ? "bg-white/[0.015]" : undefined}
            >
              <td className="px-5 py-4 text-foreground-soft">
                #{row.rankByAbsComponentVaR}
              </td>
              <td className="px-5 py-4 font-semibold text-foreground">
                {row.ticker}
              </td>
              <td className="px-5 py-4 text-foreground">
                {formatPercentNoSign(row.weight)}
              </td>
              <td className={cn("px-5 py-4", getNumberTone(row.marginalVaR))}>
                {formatSignedPercent(row.marginalVaR)}
              </td>
              <td className={cn("px-5 py-4", getNumberTone(row.componentVaR))}>
                {formatSignedPercent(row.componentVaR)}
              </td>
              <td
                className={cn(
                  "px-5 py-4",
                  getNumberTone(row.componentVaRAmount),
                )}
              >
                {formatSignedMoney(
                  row.componentVaRAmount,
                  presentationCurrency,
                  portfolioValue,
                )}
              </td>
              <td
                className={cn(
                  "px-5 py-4",
                  getNumberTone(row.contributionShare),
                )}
              >
                {formatSignedPercent(row.contributionShare)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopContributorPanel({
  rows,
}: {
  rows: InstrumentVaRContributionRow[];
}) {
  return (
    <SurfaceCard padding="sm" className="h-full border-white/[0.08]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
        Top 3 contributors
      </p>
      <div className="mt-4 space-y-3">
        {rows.length > 0 ? (
          rows.map((row) => (
            <ReadingLine
              key={row.ticker}
              title={`#${row.rankByAbsComponentVaR} ${row.ticker}`}
              body={`${formatSignedPercent(row.componentVaR)} Component VaR from a ${formatPercentNoSign(row.weight)} portfolio weight. Share: ${formatSignedPercent(row.contributionShare)}.`}
            />
          ))
        ) : (
          <p className="text-sm leading-7 text-foreground-soft">
            No contributors available for this sample.
          </p>
        )}
      </div>
    </SurfaceCard>
  );
}

function WeightVsRiskContributionBars({
  rows,
}: {
  rows: InstrumentVaRContributionRow[];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <SurfaceCard padding="sm" className="border-white/[0.08]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
        Weight vs risk contribution
      </p>
      <div className="mt-4 space-y-4">
        {rows.map((row) => {
          const riskBarWidth = `${Math.min(
            Math.abs(row.contributionShare) * 100,
            100,
          ).toFixed(1)}%`;
          const weightBarWidth = `${Math.min(Math.abs(row.weight) * 100, 100).toFixed(
            1,
          )}%`;

          return (
            <div key={row.ticker} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-foreground">{row.ticker}</span>
                <span className="text-foreground-soft">
                  Weight {formatPercentNoSign(row.weight)} | Risk{" "}
                  <span className={getNumberTone(row.contributionShare)}>
                    {formatSignedPercent(row.contributionShare)}
                  </span>
                </span>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <ContributionBar
                  label="Weight"
                  width={weightBarWidth}
                  tone="bg-sky-300/70"
                />
                <ContributionBar
                  label="Component VaR share"
                  width={riskBarWidth}
                  tone={
                    row.contributionShare >= 0
                      ? "bg-rose-300/75"
                      : "bg-emerald-300/75"
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </SurfaceCard>
  );
}

function ContributionBar({
  label,
  width,
  tone,
}: {
  label: string;
  width: string;
  tone: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
        <span>{label}</span>
        <span>{width}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div className={cn("h-full rounded-full", tone)} style={{ width }} />
      </div>
    </div>
  );
}

function FactorGradVarAttributionSection({
  analysis,
  error,
  isLoading,
}: {
  analysis: FactorGradVarAnalysis | null;
  error: string | null;
  isLoading: boolean;
}) {
  const factors = analysis?.factorDefinitions ?? DEFAULT_FACTOR_DEFINITIONS;

  return (
    <Card
      eyebrow="Factor Risk"
      title="Factor GradVaR Attribution"
      description="Decomposes factor-model VaR using ETF proxies and linear factor exposures."
    >
      <div className="space-y-5">
        <FactorProxySet factors={factors} />

        {isLoading ? (
          <FactorUnavailableState
            title="Loading factor attribution..."
            body="Fetching the fixed ETF proxy set and aligning factor returns with the validated portfolio."
          />
        ) : error ? (
          <FactorUnavailableState
            title="Factor attribution unavailable"
            body={error}
          />
        ) : analysis ? (
          <FactorGradVarResults analysis={analysis} />
        ) : (
          <FactorUnavailableState
            title="Factor attribution unavailable"
            body="Factor proxy data is not ready for the current portfolio."
          />
        )}
      </div>
    </Card>
  );
}

function FactorProxySet({ factors }: { factors: FactorDefinition[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {factors.map((factor) => (
        <SurfaceCard
          key={factor.id}
          padding="sm"
          className="border-white/[0.08]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
            {factor.proxyTicker}
          </p>
          <p className="mt-3 text-sm font-semibold leading-6 text-foreground">
            {factor.name}
          </p>
          <p className="mt-2 text-xs leading-5 text-foreground-muted">
            {factor.description}
          </p>
        </SurfaceCard>
      ))}
    </div>
  );
}

function FactorUnavailableState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-amber-400/20 bg-amber-400/[0.07] px-4 py-4 text-sm leading-7 text-amber-100">
      <p className="font-semibold text-amber-200">{title}</p>
      <p className="mt-2">{body}</p>
    </div>
  );
}

function FactorGradVarResults({
  analysis,
}: {
  analysis: FactorGradVarAnalysis;
}) {
  const topFactor = analysis.factorAttribution[0] ?? null;
  const topInstrument = analysis.instrumentAttribution[0] ?? null;
  const factorR2 = analysis.portfolioRegression?.rSquared ?? null;
  const kpis = [
    {
      label: `Factor-model VaR ${formatPercentNoSign(analysis.confidenceLevel)}`,
      value: formatPercentNoSign(analysis.valueAtRisk),
    },
    {
      label: "Factor-model daily vol",
      value: formatPercentNoSign(analysis.dailyVolatility),
    },
    {
      label: "Factor-model ann. vol",
      value: formatPercentNoSign(analysis.annualizedVolatility),
    },
    {
      label: "Observations",
      value: analysis.observations.toString(),
    },
    ...(analysis.portfolioRegression?.rSquared === null
      ? []
      : [
          {
            label: "Portfolio factor R2",
            value: formatPercentNoSign(
              analysis.portfolioRegression?.rSquared ?? 0,
            ),
          },
        ]),
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpis.map((item, index) => (
          <RiskStatChip
            key={item.label}
            label={item.label}
            value={item.value}
            accent={index === 0}
          />
        ))}
      </div>

      <FactorInterpretationSummary
        topFactor={topFactor}
        topInstrument={topInstrument}
        factorR2={factorR2}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(20rem,0.88fr)]">
        <FactorAttributionTable analysis={analysis} />
        <FactorModelNotes analysis={analysis} />
      </div>

      <InstrumentAttributionTable analysis={analysis} />
      <InstrumentFactorContributionMatrix analysis={analysis} />
    </div>
  );
}

function FactorInterpretationSummary({
  topFactor,
  topInstrument,
  factorR2,
}: {
  topFactor: FactorGradVarAnalysis["factorAttribution"][number] | null;
  topInstrument: FactorGradVarAnalysis["instrumentAttribution"][number] | null;
  factorR2: number | null;
}) {
  const modelFitLabel =
    factorR2 === null
      ? "N/A"
      : factorR2 >= 0.65
        ? "High"
        : factorR2 >= 0.35
          ? "Medium"
          : "Low";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MiniStat
        label="Dominant factor"
        value={topFactor?.factorName ?? "N/A"}
        detail={
          topFactor
            ? `${topFactor.proxyTicker}: ${formatSignedPercent(topFactor.contributionShare)} of signed factor VaR.`
            : "No dominant factor available."
        }
      />
      <MiniStat
        label="Dominant instrument factor"
        value={
          topInstrument
            ? `${topInstrument.ticker} / ${topInstrument.dominantFactorName ?? "N/A"}`
            : "N/A"
        }
        detail={
          topInstrument
            ? `${formatSignedPercent(topInstrument.componentVaR)} factor-model Component VaR.`
            : "No instrument attribution available."
        }
      />
      <MiniStat
        label="Model fit"
        value={modelFitLabel}
        detail={
          factorR2 === null
            ? "Portfolio regression R2 is not available for this sample."
            : `Portfolio factor R2 is ${formatPercentNoSign(factorR2)}. Treat low fit as a warning, not a failure.`
        }
      />
    </div>
  );
}

function FactorAttributionTable({
  analysis,
}: {
  analysis: FactorGradVarAnalysis;
}) {
  return (
    <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
      <table className="w-full min-w-[820px] text-left">
        <thead className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
          <tr>
            <th className="px-5 py-3">Factor</th>
            <th className="px-5 py-3">Proxy</th>
            <th className="px-5 py-3">Exposure</th>
            <th className="px-5 py-3">Marginal VaR</th>
            <th className="px-5 py-3">Component VaR</th>
            <th className="px-5 py-3">Contribution share</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.08] text-sm">
          {analysis.factorAttribution.map((row, index) => (
            <tr
              key={row.factorId}
              className={index % 2 === 0 ? "bg-white/[0.015]" : undefined}
            >
              <td className="px-5 py-4 font-semibold text-foreground">
                {row.factorName}
              </td>
              <td className="px-5 py-4 text-foreground-soft">
                {row.proxyTicker}
              </td>
              <td className={cn("px-5 py-4", getNumberTone(row.exposure))}>
                {formatSignedNumber(row.exposure)}
              </td>
              <td className={cn("px-5 py-4", getNumberTone(row.marginalVaR))}>
                {formatSignedPercent(row.marginalVaR)}
              </td>
              <td className={cn("px-5 py-4", getNumberTone(row.componentVaR))}>
                {formatSignedPercent(row.componentVaR)}
              </td>
              <td
                className={cn(
                  "px-5 py-4",
                  getNumberTone(row.contributionShare),
                )}
              >
                {formatSignedPercent(row.contributionShare)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FactorModelNotes({
  analysis,
}: {
  analysis: FactorGradVarAnalysis;
}) {
  return (
    <SurfaceCard padding="sm" className="h-full border-white/[0.08]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
        Factor methodology
      </p>
      <div className="mt-4 space-y-3">
        <ReadingLine
          title="Model form"
          body="Each asset return is regressed on a fixed ETF proxy set with an intercept."
        />
        <ReadingLine
          title="Component VaR"
          body="Component VaR estimates how much each factor contributes to the model-implied daily VaR."
        />
        <ReadingLine
          title="Argentina WM proxy set"
          body="The default factors use global equity, Argentina, growth/technology, duration, credit/risk appetite, USD/FX, and gold proxies."
        />
        <ReadingLine
          title="Interpretation boundary"
          body="ETF proxies are approximations. Use the output to explain exposure patterns, not as a standalone investment recommendation."
        />
      </div>

      {analysis.methodology.warnings.length > 0 ? (
        <div className="mt-5 rounded-[1.2rem] border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
            Factor notes
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-100/90">
            {analysis.methodology.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </SurfaceCard>
  );
}

function InstrumentAttributionTable({
  analysis,
}: {
  analysis: FactorGradVarAnalysis;
}) {
  return (
    <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
      <table className="w-full min-w-[760px] text-left">
        <thead className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
          <tr>
            <th className="px-5 py-3">Ticker</th>
            <th className="px-5 py-3">Weight</th>
            <th className="px-5 py-3">Component VaR</th>
            <th className="px-5 py-3">Contribution share</th>
            <th className="px-5 py-3">Dominant factor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.08] text-sm">
          {analysis.instrumentAttribution.map((row, index) => (
            <tr
              key={row.ticker}
              className={index % 2 === 0 ? "bg-white/[0.015]" : undefined}
            >
              <td className="px-5 py-4 font-semibold text-foreground">
                {row.ticker}
              </td>
              <td className="px-5 py-4 text-foreground">
                {formatPercentNoSign(row.weight)}
              </td>
              <td className={cn("px-5 py-4", getNumberTone(row.componentVaR))}>
                {formatSignedPercent(row.componentVaR)}
              </td>
              <td
                className={cn(
                  "px-5 py-4",
                  getNumberTone(row.contributionShare),
                )}
              >
                {formatSignedPercent(row.contributionShare)}
              </td>
              <td className="px-5 py-4 text-foreground-soft">
                {row.dominantFactorName ?? "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InstrumentFactorContributionMatrix({
  analysis,
}: {
  analysis: FactorGradVarAnalysis;
}) {
  return (
    <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
      <table className="w-full min-w-[960px] text-left">
        <thead className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
          <tr>
            <th className="px-5 py-3">Ticker</th>
            {analysis.factorDefinitions.map((factor) => (
              <th key={factor.id} className="px-5 py-3">
                {factor.proxyTicker}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.08] text-sm">
          {analysis.instrumentAttribution.map((row, index) => (
            <tr
              key={row.ticker}
              className={index % 2 === 0 ? "bg-white/[0.015]" : undefined}
            >
              <td className="px-5 py-4 font-semibold text-foreground">
                {row.ticker}
              </td>
              {analysis.factorDefinitions.map((factor) => {
                const contribution = row.factorContributions.find(
                  (item) => item.factorId === factor.id,
                )?.contribution ?? 0;

                return (
                  <td
                    key={factor.id}
                    className={cn("px-5 py-4", getNumberTone(contribution))}
                  >
                    {formatSignedPercent(contribution)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
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

function TailRiskTable({
  tailRisk,
  portfolioValue,
  presentationCurrency,
}: {
  tailRisk: TailRiskMetrics;
  portfolioValue: number | null;
  presentationCurrency: RiskPortfolioAnalyticsSectionProps["presentationCurrency"];
}) {
  const confidence = formatPercentNoSign(tailRisk.confidenceLevel);
  const rows = [
    [
      "Historical VaR",
      formatLossPercentAndMoney(
        tailRisk.historicalVaR,
        portfolioValue,
        presentationCurrency,
      ),
    ],
    [
      "Expected Shortfall",
      formatLossPercentAndMoney(
        tailRisk.historicalExpectedShortfall,
        portfolioValue,
        presentationCurrency,
      ),
    ],
    [
      "Parametric VaR",
      formatLossPercentAndMoney(
        tailRisk.parametricVaR,
        portfolioValue,
        presentationCurrency,
      ),
    ],
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

function formatLossPercentAndMoney(
  lossRate: number,
  portfolioValue: number | null,
  currency: RiskPortfolioAnalyticsSectionProps["presentationCurrency"],
): string {
  const percent = formatPercentNoSign(lossRate);

  if (!portfolioValue) {
    return percent;
  }

  const moneyAtRisk = Math.max(lossRate, 0) * portfolioValue;

  return `${percent} / ${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(moneyAtRisk)}`;
}

function formatSignedMoney(
  value: number,
  currency: RiskPortfolioAnalyticsSectionProps["presentationCurrency"],
  portfolioValue: number | null,
): string {
  if (!portfolioValue) {
    return "N/A";
  }

  const absoluteValue = Math.abs(value);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(absoluteValue);

  if (value > 0) {
    return `+${formatted}`;
  }

  if (value < 0) {
    return `-${formatted}`;
  }

  return formatted;
}

function formatComparisonMetric(
  key: CurrentVsProposedMetricRow["key"],
  value: number,
  forceSign = false,
): string {
  if (key === "maxDrawdown") {
    return forceSign ? formatSignedPercent(value) : formatSignedPercent(value);
  }

  if (forceSign) {
    return formatSignedPercent(value);
  }

  return formatPercentNoSign(value);
}

function formatComparisonReading(row: CurrentVsProposedMetricRow): string {
  if (Math.abs(row.delta) < 1e-10) {
    return "No material change.";
  }

  const movedLower = row.delta < 0;

  if (row.lowerIsBetter) {
    return movedLower
      ? "Lower under proposed weights."
      : "Higher under proposed weights.";
  }

  return movedLower
    ? "More negative under proposed weights."
    : "Less negative under proposed weights.";
}

function formatScenarioImpactAndMoney(
  impact: number,
  monetaryImpact: number | null,
  currency: RiskPortfolioAnalyticsSectionProps["presentationCurrency"],
): string {
  if (monetaryImpact === null) {
    return formatSignedPercent(impact);
  }

  return `${formatSignedPercent(impact)} / ${formatScenarioMoney(
    monetaryImpact,
    currency,
  )}`;
}

function formatScenarioMoney(
  value: number | null,
  currency: RiskPortfolioAnalyticsSectionProps["presentationCurrency"],
): string {
  if (value === null) {
    return "N/A";
  }

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));

  if (value > 0) {
    return `+${formatted}`;
  }

  if (value < 0) {
    return `-${formatted}`;
  }

  return formatted;
}

function formatSignedNumber(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function getNumberTone(value: number): string {
  if (value > 0) {
    return "text-emerald-200";
  }

  if (value < 0) {
    return "text-rose-200";
  }

  return "text-foreground";
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