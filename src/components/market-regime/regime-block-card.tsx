import { SurfaceCard } from "@/components/ui/surface-card";
import type { MarketRegimeBlock } from "@/lib/finance/market-regime/types";
import { cn } from "@/lib/utils";

export function RegimeBlockGrid({ blocks }: { blocks: MarketRegimeBlock[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {blocks.map((block) => (
        <RegimeBlockCard key={block.id} block={block} />
      ))}
    </div>
  );
}

function RegimeBlockCard({ block }: { block: MarketRegimeBlock }) {
  const fillWidth = `${Math.min(Math.max((block.score + 1) * 50, 0), 100)}%`;

  return (
    <SurfaceCard padding="sm" className="border-white/[0.08]">
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
            {block.label}
          </p>
          <div className="flex items-start justify-between gap-3">
            <p className="text-2xl font-semibold tracking-[-0.035em] text-foreground">
              {formatSigned(block.score * 100, 0)}
            </p>
            <span className="rounded-full border border-white/[0.08] bg-background-muted/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
              {(block.weight * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs leading-6 text-foreground-muted">
            Contribution: {formatSigned(block.contribution * 100, 1)} pts
          </p>
        </div>

        <div className="space-y-2">
          <div className="relative h-2 rounded-full border border-white/[0.08] bg-slate-950/70">
            <span className="absolute left-1/2 top-1/2 h-4 w-px -translate-y-1/2 bg-white/20" />
            <span
              className={cn(
                "absolute top-0 h-full rounded-full",
                block.score >= 0 ? "bg-emerald-300/70" : "bg-rose-300/70",
              )}
              style={{
                left: block.score >= 0 ? "50%" : fillWidth,
                width:
                  block.score >= 0
                    ? `${Math.min(block.score * 50, 50)}%`
                    : `${Math.min(Math.abs(block.score) * 50, 50)}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
            <span>-1</span>
            <span>0</span>
            <span>+1</span>
          </div>
        </div>

        <div className="space-y-2">
          {block.indicators.map((indicator) => (
            <div
              key={indicator.id}
              className="rounded-[1rem] border border-white/[0.06] bg-background-muted/55 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-xs font-semibold text-foreground-soft">
                  {indicator.label}
                </p>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    indicator.score >= 0.1
                      ? "text-emerald-200"
                      : indicator.score <= -0.1
                        ? "text-rose-200"
                        : "text-amber-200",
                  )}
                >
                  {formatSigned(indicator.score, 2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}

function formatSigned(value: number, digits: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

