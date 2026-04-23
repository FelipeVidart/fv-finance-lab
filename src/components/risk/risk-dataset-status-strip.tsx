import { SurfaceCard } from "@/components/ui/surface-card";
import type { DatasetStatusItem } from "@/components/risk/types";

type RiskDatasetStatusStripProps = {
  items: DatasetStatusItem[];
};

export function RiskDatasetStatusStrip({
  items,
}: RiskDatasetStatusStripProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <SurfaceCard tone="elevated" padding="sm" className="border-white/[0.08]">
      <div className="grid gap-4 xl:grid-cols-[minmax(16rem,0.9fr)_minmax(0,1.1fr)] xl:items-center">
        <div className="space-y-2">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
            Dataset status
          </p>
          <p className="text-sm leading-7 text-foreground-soft">
            Shared market data has been aligned and is now acting as the common
            analytical base for the remaining Risk workspace.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.35rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.86),rgba(10,17,26,0.62))] px-4 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                {item.label}
              </p>
              <p className="mt-3 text-sm font-semibold text-foreground">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}
