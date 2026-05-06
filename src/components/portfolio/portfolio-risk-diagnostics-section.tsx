import { SurfaceCard } from "@/components/ui/surface-card";
import type { PortfolioRiskDiagnostics } from "@/lib/finance/portfolio/risk-diagnostics";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PortfolioRiskDiagnosticsSectionProps = {
  diagnostics: PortfolioRiskDiagnostics;
};

export function PortfolioRiskDiagnosticsSection({
  diagnostics,
}: PortfolioRiskDiagnosticsSectionProps) {
  const primaryPortfolio = diagnostics.portfolioDiagnostics[0];

  return (
    <SurfaceCard tone="elevated" padding="md" className="border-white/[0.08]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
            Risk diagnostics
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">
            Connect portfolio behavior back to asset-level risk.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground-soft">
            Correlations, realized volatility, downside volatility, and risk
            contribution are calculated from the same aligned daily returns used
            by the performance comparison.
          </p>
        </div>
        <span className="w-fit rounded-full border border-white/[0.08] bg-background-muted/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
          Historical analytics
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {diagnostics.portfolioDiagnostics.map((portfolio) => (
          <div
            key={portfolio.portfolioId}
            className="rounded-[1.35rem] border border-white/[0.08] bg-background-muted/80 px-4 py-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              {portfolio.portfolioLabel}
            </p>
            <div className="mt-4 grid gap-3 text-sm">
              <MetricLine
                label="Best day"
                value={formatSignedPercent(portfolio.bestDailyReturn)}
              />
              <MetricLine
                label="Worst day"
                value={formatSignedPercent(portfolio.worstDailyReturn)}
              />
              <MetricLine
                label="Positive days"
                value={formatPercent(portfolio.positiveDayRatio)}
              />
              <MetricLine
                label="Downside vol"
                value={formatPercent(portfolio.downsideVolatility)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-4">
          <TablePanel
            title="Asset realized volatility"
            description="Annualized volatility and daily return breadth for every ticker in the shared union."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                    <th className="px-4 py-3">Ticker</th>
                    <th className="px-4 py-3">Asset class</th>
                    <th className="px-4 py-3">Ann. vol</th>
                    <th className="px-4 py-3">Best day</th>
                    <th className="px-4 py-3">Worst day</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnostics.assetVolatilities.map((row, index) => (
                    <tr
                      key={row.ticker}
                      className={cn(
                        "border-b border-white/[0.08] text-sm last:border-b-0",
                        index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                      )}
                    >
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {row.ticker}
                      </td>
                      <td className="px-4 py-3 text-foreground-soft">
                        {row.assetClass}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {formatPercent(row.annualizedVolatility)}
                      </td>
                      <td className="px-4 py-3 text-emerald-200">
                        {formatSignedPercent(row.bestDailyReturn)}
                      </td>
                      <td className="px-4 py-3 text-rose-200">
                        {formatSignedPercent(row.worstDailyReturn)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TablePanel>
        </div>

        <TablePanel
          title="Correlation matrix"
          description="Pairwise daily-return correlation across the selected portfolio ticker union."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-center">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                  <th className="px-3 py-3 text-left">Ticker</th>
                  {diagnostics.correlationMatrix.tickers.map((ticker) => (
                    <th key={ticker} className="px-3 py-3">
                      {ticker}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {diagnostics.correlationMatrix.rows.map((row, index) => (
                  <tr
                    key={row.ticker}
                    className={cn(
                      "border-b border-white/[0.08] text-sm last:border-b-0",
                      index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                    )}
                  >
                    <td className="px-3 py-3 text-left font-semibold text-foreground">
                      {row.ticker}
                    </td>
                    {diagnostics.correlationMatrix.tickers.map((ticker) => (
                      <td key={ticker} className="px-3 py-3 text-foreground-soft">
                        {formatRatio(row.correlations[ticker] ?? 0)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TablePanel>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
          Volatility contribution
        </p>
        <p className="max-w-3xl text-sm leading-7 text-foreground-soft">
          Contribution uses the annualized covariance matrix. Marginal
          contribution is Sigma times weights divided by portfolio volatility;
          component contribution is weight times marginal contribution.
        </p>
        <div className="grid gap-4 xl:grid-cols-2">
          {diagnostics.portfolioDiagnostics.map((portfolio, index) => (
            <details
              key={portfolio.portfolioId}
              open={portfolio.portfolioId === primaryPortfolio?.portfolioId}
              className="rounded-[1.45rem] border border-white/[0.08] bg-background-muted/75 px-4 py-4"
            >
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                {portfolio.portfolioLabel} risk contribution
              </summary>
              <div className="mt-4 overflow-x-auto rounded-[1.15rem] border border-white/[0.08]">
                <table className="w-full min-w-[680px] text-left">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                      <th className="px-4 py-3">Ticker</th>
                      <th className="px-4 py-3">Weight</th>
                      <th className="px-4 py-3">Asset vol</th>
                      <th className="px-4 py-3">Marginal vol</th>
                      <th className="px-4 py-3">Contribution</th>
                      <th className="px-4 py-3">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.riskContributions.map((row, rowIndex) => (
                      <tr
                        key={`${portfolio.portfolioId}-${row.ticker}-${index}`}
                        className={cn(
                          "border-b border-white/[0.08] text-sm last:border-b-0",
                          rowIndex % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                        )}
                      >
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {row.ticker}
                        </td>
                        <td className="px-4 py-3 text-foreground-soft">
                          {row.weight.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-foreground-soft">
                          {formatPercent(row.annualizedVolatility)}
                        </td>
                        <td className="px-4 py-3 text-foreground-soft">
                          {formatPercent(row.marginalContributionToVolatility)}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {formatPercent(row.contributionToVolatility)}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {formatPercent(row.percentContributionToVolatility)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}

function TablePanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.45rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
      <div className="border-b border-white/[0.08] px-4 py-4">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-2 text-sm leading-6 text-foreground-soft">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-foreground-muted">{label}</span>
      <span
        className={cn(
          "font-semibold text-foreground",
          value.startsWith("+") && "text-emerald-200",
          value.startsWith("-") && "text-rose-200",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatRatio(value: number): string {
  return value.toFixed(2);
}
