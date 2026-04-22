import { Card } from "@/components/card";
import { ExpandableChartCard } from "@/components/expandable-chart-card";
import { LineChartPanel } from "@/components/line-chart-panel";
import type { RiskChartModel } from "@/components/risk/types";

export function RiskStatChip({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm ${
        accent
          ? "border-sky-400/25 bg-sky-400/[0.08]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export function RiskSeriesChartCard({
  title,
  description,
  dates,
  series,
  valueFormatter,
}: RiskChartModel) {
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

export function RiskSectionEmptyState({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Card eyebrow={eyebrow} title={title} description={description}>
      <div className="rounded-3xl border border-dashed border-white/15 bg-slate-950/45 p-6">
        <p className="text-sm leading-7 text-slate-300">
          Load the dataset in Setup to unlock this section.
        </p>
      </div>
    </Card>
  );
}
