import { SurfaceCard } from "@/components/ui/surface-card";
import type { AssetClassAllocationSummary } from "@/lib/finance/portfolio/types";

type PortfolioAllocationSummaryProps = {
  allocation: AssetClassAllocationSummary;
};

export function PortfolioAllocationSummary({
  allocation,
}: PortfolioAllocationSummaryProps) {
  return (
    <SurfaceCard padding="md" className="border-white/[0.08]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
            Asset Class Allocation
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">
            Economic exposure by asset class
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-foreground-soft">
            Allocation is grouped from the current editable portfolio rows, so
            exposure updates as tickers, asset classes, or weights change.
          </p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-background-muted/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
          {formatPercent(allocation.groupedWeight)} grouped
        </span>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.28fr)]">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
            Broad Allocation
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {allocation.broadCategories.length > 0 ? (
              allocation.broadCategories.map((row) => (
                <div
                  key={row.category}
                  className="rounded-[1.25rem] border border-white/[0.08] bg-background-muted/80 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {row.category}
                    </p>
                    <p className="text-sm font-semibold text-accent-foreground">
                      {formatPercent(row.weight)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-foreground-muted">
                    {row.holdingCount} {pluralize("holding", row.holdingCount)}
                    {" across "}
                    {row.assetClassCount}{" "}
                    {pluralize("asset class", row.assetClassCount)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyAllocationState />
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-[1.5rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[1.5fr_0.9fr_0.75fr_1.2fr] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              <span>Asset class</span>
              <span>Broad group</span>
              <span>Weight</span>
              <span>Holdings</span>
            </div>
            {allocation.assetClasses.length > 0 ? (
              allocation.assetClasses.map((row, index) => (
                <div
                  key={row.assetClass}
                  className={[
                    "grid grid-cols-[1.5fr_0.9fr_0.75fr_1.2fr] gap-3 px-5 py-4 text-sm not-last:border-b not-last:border-white/[0.08]",
                    index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                  ].join(" ")}
                >
                  <span className="font-semibold text-foreground">
                    {row.assetClass}
                  </span>
                  <span className="text-foreground-soft">{row.broadCategory}</span>
                  <span className="text-foreground">
                    {formatPercent(row.weight)}
                  </span>
                  <span className="text-foreground-soft">
                    {row.holdingCount} {pluralize("holding", row.holdingCount)}
                    {" · "}
                    {row.tickers.join(", ")}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-5">
                <EmptyAllocationState />
              </div>
            )}
          </div>
        </div>
      </div>

      {!allocation.isWeightConsistent ? (
        <p className="mt-4 rounded-[1.15rem] border border-amber-400/25 bg-amber-400/[0.08] px-4 py-3 text-sm leading-6 text-amber-200">
          Allocation grouping did not reconcile to the valid portfolio weight.
        </p>
      ) : null}
    </SurfaceCard>
  );
}

function EmptyAllocationState() {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-border/80 bg-background-muted/55 px-4 py-4 text-sm leading-7 text-foreground-soft">
      Add tickers, asset classes, and positive weights to see allocation
      exposure.
    </div>
  );
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function pluralize(label: string, count: number): string {
  return count === 1 ? label : `${label}s`;
}
