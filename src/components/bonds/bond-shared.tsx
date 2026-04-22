import { ExpandableChartCard } from "@/components/expandable-chart-card";
import { LineChartPanel } from "@/components/line-chart-panel";
import type { BondChartModel, BondMetricItem, BondStatusItem } from "@/components/bonds/types";

export function BondMetricCard({
  label,
  value,
  tone = "default",
}: BondMetricItem) {
  const toneClassMap: Record<NonNullable<BondMetricItem["tone"]>, string> = {
    default: "text-white",
    positive: "text-emerald-200",
    warning: "text-amber-200",
    muted: "text-slate-300",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-lg font-semibold ${toneClassMap[tone]}`}>
        {value}
      </p>
    </div>
  );
}

export function BondStatusStrip({ items }: { items: BondStatusItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.2rem] border border-white/10 bg-slate-950/55 px-4 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
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
      title={title}
      description={description}
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
