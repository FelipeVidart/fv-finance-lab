import { Card } from "@/components/card";
import type { MarketRegimeIndicator } from "@/lib/finance/market-regime/types";
import { cn } from "@/lib/utils";

export function RegimeInputsTable({
  indicators,
}: {
  indicators: MarketRegimeIndicator[];
}) {
  return (
    <Card
      eyebrow="Inputs"
      title="Observable market inputs"
      description="Every indicator is converted into a score from -1 to +1 before the block weights are applied."
      tone="elevated"
    >
      <div className="overflow-x-auto rounded-[1.55rem] border border-white/[0.08]">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[1.25fr_0.72fr_0.72fr_1.1fr_0.55fr_0.9fr_1.7fr] gap-3 border-b border-white/[0.08] bg-background-muted/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
            <span>Indicator</span>
            <span>Source</span>
            <span>Value</span>
            <span>Metric</span>
            <span>Score</span>
            <span>Block</span>
            <span>Explanation</span>
          </div>
          {indicators.map((indicator, index) => (
            <div
              key={indicator.id}
              className={cn(
                "grid grid-cols-[1.25fr_0.72fr_0.72fr_1.1fr_0.55fr_0.9fr_1.7fr] gap-3 px-5 py-4 text-sm not-last:border-b not-last:border-white/[0.08]",
                index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
              )}
            >
              <span className="font-semibold text-foreground">
                {indicator.label}
              </span>
              <span className="text-foreground-soft">{indicator.source}</span>
              <span className="font-semibold text-foreground">
                {indicator.valueDisplay}
              </span>
              <span className="text-foreground-muted">
                {indicator.metricLabel}
              </span>
              <span
                className={cn(
                  "font-semibold",
                  indicator.score >= 0.1
                    ? "text-emerald-200"
                    : indicator.score <= -0.1
                      ? "text-rose-200"
                      : "text-amber-200",
                )}
              >
                {formatSigned(indicator.score)}
              </span>
              <span className="text-foreground-soft">
                {indicator.blockLabel}
              </span>
              <span className="text-xs leading-6 text-foreground-muted">
                {indicator.explanation}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

