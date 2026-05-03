import { SurfaceCard } from "@/components/ui/surface-card";
import type { PortfolioAnalysis } from "@/lib/finance/portfolio/types";
import { cn } from "@/lib/utils";

type PortfolioAssetsTableProps = {
  analysis: PortfolioAnalysis | null;
};

export function PortfolioAssetsTable({ analysis }: PortfolioAssetsTableProps) {
  const assets = analysis?.assets ?? [];

  return (
    <SurfaceCard padding="md" className="border-white/[0.08]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
            Asset allocation
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">
            ETF holdings and aligned asset statistics
          </h2>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-background-muted/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
          {assets.length} assets
        </span>
      </div>

      {assets.length === 0 ? (
        <div className="mt-6 rounded-[1.45rem] border border-dashed border-border/80 bg-background-muted/60 px-5 py-5 text-sm leading-7 text-foreground-soft">
          The asset table will show ticker, asset class, weight, aligned date
          range, cumulative return, and annualized volatility after a backtest
          runs.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
          <div className="min-w-[920px]">
            <div className="grid grid-cols-[0.7fr_1.45fr_0.72fr_1fr_1fr_1fr_1fr] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              <span>Ticker</span>
              <span>Asset class</span>
              <span>Weight</span>
              <span>Start</span>
              <span>End</span>
              <span>Cum. return</span>
              <span>Ann. vol</span>
            </div>
            {assets.map((asset, index) => (
              <div
                key={asset.ticker}
                className={cn(
                  "grid grid-cols-[0.7fr_1.45fr_0.72fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-4 text-sm not-last:border-b not-last:border-white/[0.08]",
                  index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                )}
              >
                <span className="font-semibold text-foreground">{asset.ticker}</span>
                <span className="text-foreground-soft">{asset.assetClass}</span>
                <span className="text-foreground">{asset.weight.toFixed(2)}%</span>
                <span className="text-foreground-soft">{formatDate(asset.startDate)}</span>
                <span className="text-foreground-soft">{formatDate(asset.endDate)}</span>
                <span className={getSignedValueTone(asset.cumulativeReturn)}>
                  {formatPercent(asset.cumulativeReturn)}
                </span>
                <span className="text-foreground-soft">
                  {formatPercent(asset.annualizedVolatility)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SurfaceCard>
  );
}

function getSignedValueTone(value: number) {
  if (value > 0) {
    return "text-emerald-200";
  }

  if (value < 0) {
    return "text-rose-200";
  }

  return "text-foreground";
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
