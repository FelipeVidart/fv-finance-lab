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
    <SurfaceCard tone="elevated" padding="sm">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
              Dataset status
            </p>
            <p className="mt-2 text-sm leading-7 text-foreground-soft">
              Shared market data is aligned before the workspace opens the
              analytics views.
            </p>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.3rem] border border-border/80 bg-slate-950/55 px-4 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                {item.label}
              </p>
              <p className="mt-3 text-sm font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}
