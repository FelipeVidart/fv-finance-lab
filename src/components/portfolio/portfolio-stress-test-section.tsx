import { SurfaceCard } from "@/components/ui/surface-card";
import type { PortfolioStressScenarioResult } from "@/lib/finance/portfolio/scenario-stress";
import { cn } from "@/lib/utils";

type PortfolioStressTestSectionProps = {
  results: PortfolioStressScenarioResult[];
};

export function PortfolioStressTestSection({
  results,
}: PortfolioStressTestSectionProps) {
  const portfolios = results[0]?.portfolioImpacts ?? [];

  return (
    <SurfaceCard tone="elevated" padding="md" className="border-white/[0.08]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
            Stress tests
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">
            Scenario-based portfolio impact estimates.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground-soft">
            These shocks are simplified assumptions applied to each holding by
            asset-class mapping. They are scenario analytics, not forecasts.
          </p>
        </div>
        <span className="w-fit rounded-full border border-amber-400/25 bg-amber-400/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
          Simplified shocks
        </span>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
        <table className="w-full min-w-[920px] text-left">
          <thead>
            <tr className="border-b border-white/[0.08] text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              <th className="px-5 py-3">Scenario</th>
              <th className="px-5 py-3">Assumption</th>
              {portfolios.map((portfolio) => (
                <th key={portfolio.portfolioId} className="px-5 py-3">
                  {portfolio.portfolioLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((scenario, index) => (
              <tr
                key={scenario.scenarioId}
                className={cn(
                  "border-b border-white/[0.08] last:border-b-0",
                  index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                )}
              >
                <td className="px-5 py-4 align-top text-sm font-semibold text-foreground">
                  {scenario.scenarioName}
                </td>
                <td className="px-5 py-4 align-top text-sm leading-6 text-foreground-soft">
                  {scenario.description}
                </td>
                {scenario.portfolioImpacts.map((impact) => (
                  <td
                    key={`${scenario.scenarioId}-${impact.portfolioId}`}
                    className={cn(
                      "px-5 py-4 align-top text-sm font-semibold",
                      impact.estimatedImpact > 0 && "text-emerald-200",
                      impact.estimatedImpact < 0 && "text-rose-200",
                      impact.estimatedImpact === 0 && "text-foreground",
                    )}
                  >
                    {formatSignedPercent(impact.estimatedImpact)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <p className="rounded-[1.15rem] border border-white/[0.08] bg-background-muted/75 px-4 py-3 text-sm leading-7 text-foreground-soft">
          Asset mapping is based on ticker and asset-class labels from portfolio
          holdings: equities, small caps, international equity, fixed income,
          gold, cash, and other.
        </p>
        <p className="rounded-[1.15rem] border border-white/[0.08] bg-background-muted/75 px-4 py-3 text-sm leading-7 text-foreground-soft">
          Scenario impact is the weighted sum of holding shocks. It ignores
          second-order effects, changing correlations, and path dependency.
        </p>
      </div>
    </SurfaceCard>
  );
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}
