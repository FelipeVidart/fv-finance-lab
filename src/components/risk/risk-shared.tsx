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
    <SurfaceCard
      tone={accent ? "accent" : "elevated"}
      padding="sm"
      className="h-full border-white/[0.08]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
            {label}
          </p>
          <p
            className={cn(
              "mt-4 text-[1.95rem] font-semibold tracking-[-0.04em]",
              getSignedValueTone(value),
            )}
          >
            {value}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
            accent
              ? "border-accent/25 bg-accent/12 text-accent-foreground"
              : "border-white/[0.08] bg-background-muted/80 text-foreground-subtle",
          )}
        >
          KPI
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-foreground-soft">
        Portfolio-level output derived from the validated sandbox and aligned
        daily return history.
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
      eyebrow="Analytics chart"
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
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
        <div className="rounded-[1.7rem] border border-dashed border-border/80 bg-[linear-gradient(180deg,rgba(10,17,26,0.8),rgba(8,13,20,0.56))] p-6">
          <p className="text-sm leading-7 text-foreground-soft">
            Load the dataset in Setup to unlock this section.
          </p>
        </div>
        <SurfaceCard padding="sm" className="h-full border-white/[0.08]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
            Workspace dependency
          </p>
          <p className="mt-3 text-sm leading-7 text-foreground-soft">
            The Risk workspace keeps Setup, Asset Analytics, and Portfolio
            Analytics intentionally connected so each section inherits the data
            and validation it needs before opening fully.
          </p>
        </SurfaceCard>
      </div>
    </Card>
  );
}
