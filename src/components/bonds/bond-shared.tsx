import { ExpandableChartCard } from "@/components/expandable-chart-card";
import { LineChartPanel } from "@/components/line-chart-panel";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
import type {
  BondChartModel,
  BondMetricItem,
  BondStatusItem,
} from "@/components/bonds/types";

export function BondMetricCard({
  label,
  value,
  tone = "default",
}: BondMetricItem) {
  const toneClassMap: Record<NonNullable<BondMetricItem["tone"]>, string> = {
    default: "text-foreground",
    positive: "text-emerald-200",
    warning: "text-amber-200",
    muted: "text-foreground-soft",
  };

  return (
    <SurfaceCard
      tone={tone === "default" ? "elevated" : "default"}
      padding="sm"
      className="h-full border-white/[0.08]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
            {label}
          </p>
          <p className={cn("mt-4 text-[1.85rem] font-semibold tracking-[-0.04em]", toneClassMap[tone])}>
            {value}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
            tone === "positive" &&
              "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200",
            tone === "warning" &&
              "border-amber-400/20 bg-amber-400/[0.08] text-amber-200",
            tone === "muted" &&
              "border-white/[0.08] bg-background-muted/80 text-foreground-subtle",
            tone === "default" &&
              "border-accent/20 bg-accent/10 text-accent-foreground",
          )}
        >
          Metric
        </span>
      </div>
    </SurfaceCard>
  );
}

export function BondStatusStrip({ items }: { items: BondStatusItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <SurfaceCard tone="elevated" padding="sm" className="border-white/[0.08]">
      <div className="grid gap-4 xl:grid-cols-[minmax(16rem,0.9fr)_minmax(0,1.1fr)] xl:items-center">
        <div className="space-y-2">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
            Market status
          </p>
          <p className="text-sm leading-7 text-foreground-soft">
            Aligned bond market data and registry context are separated so the
            monitor reads like a fixed-income reference surface rather than a
            raw fetch dump.
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
              <p className="mt-3 text-sm font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}

export function BondChartCard({
  title,
  description,
  dates,
  series,
  valueFormatter,
}: BondChartModel) {
  return (
    <ExpandableChartCard
      eyebrow="Market chart"
      title={title}
      description={description}
      detailDescription={`${description} Use the expanded view to inspect values, isolate series, and review chart-level summary statistics.`}
      renderPreview={({ open }) => (
        <LineChartPanel
          title={title}
          dates={dates}
          series={series}
          valueFormatter={valueFormatter}
          onChartClick={open}
        />
      )}
      detail={
        <LineChartPanel
          title={title}
          dates={dates}
          series={series}
          valueFormatter={valueFormatter}
          heightClassName="h-[24rem] sm:h-[32rem] lg:h-[40rem]"
          interactive
          showSummary
        />
      }
    />
  );
}
