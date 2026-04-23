import { Card } from "@/components/card";
import { ExpandableChartCard } from "@/components/expandable-chart-card";
import { LineChartPanel } from "@/components/line-chart-panel";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
import type { RiskChartModel } from "@/components/risk/types";

export function getSignedValueTone(value: string) {
  const normalized = value.trim();

  if (normalized.startsWith("+")) {
    return "text-emerald-200";
  }

  if (normalized.startsWith("-")) {
    return "text-rose-200";
  }

  return "text-foreground";
}

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
    <SurfaceCard tone={accent ? "accent" : "default"} padding="sm" className="h-full">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p
        className={cn(
          "mt-4 text-[1.75rem] font-semibold tracking-[-0.03em]",
          getSignedValueTone(value),
        )}
      >
        {value}
      </p>
    </SurfaceCard>
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
    <Card eyebrow={eyebrow} title={title} description={description} tone="elevated">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.82fr)]">
        <div className="rounded-3xl border border-dashed border-border/80 bg-slate-950/45 p-6">
          <p className="text-sm leading-7 text-foreground-soft">
            Load the dataset in Setup to unlock this section.
          </p>
        </div>
        <SurfaceCard padding="sm" className="h-full">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
            Workspace dependency
          </p>
          <p className="mt-3 text-sm leading-7 text-foreground-soft">
            The Risk workspace keeps Setup, Asset Analytics, and Portfolio
            Analytics intentionally connected so each section has the data it
            needs before it opens.
          </p>
        </SurfaceCard>
      </div>
    </Card>
  );
}
