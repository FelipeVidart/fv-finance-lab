"use client";

import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
import type { BondsSectionId } from "@/components/bonds/types";

const sections: Array<{
  id: BondsSectionId;
  label: string;
  description: string;
  step: string;
}> = [
  {
    id: "pricing",
    step: "01",
    label: "Pricing",
    description: "Manual fixed-rate valuation and primary pricing posture.",
  },
  {
    id: "analytics",
    step: "02",
    label: "Analytics",
    description: "Duration, cash-flow structure, and bond sensitivity outputs.",
  },
  {
    id: "market-monitor",
    step: "03",
    label: "Market Monitor",
    description: "Aligned market history, spread context, and registry reference views.",
  },
];

type BondSectionTabsProps = {
  activeSection: BondsSectionId;
  marketReady: boolean;
  onChange: (section: BondsSectionId) => void;
};

export function BondSectionTabs({
  activeSection,
  marketReady,
  onChange,
}: BondSectionTabsProps) {
  return (
    <SurfaceCard tone="elevated" padding="sm" className="border-white/[0.08]">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
              Workspace sections
            </p>
            <p className="max-w-2xl text-sm leading-7 text-foreground-soft">
              Move from manual bond pricing into analytics and then into the
              more desk-style market monitor through one consistent shell.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SectionSignal label="Pricing" value="Live" tone="ready" />
            <SectionSignal label="Analytics" value="Live" tone="ready" />
            <SectionSignal
              label="Monitor"
              value={marketReady ? "Loaded" : "Awaiting data"}
              tone={marketReady ? "ready" : "pending"}
            />
          </div>
        </div>

        <div
          className="grid gap-3 xl:grid-cols-3"
          role="tablist"
          aria-label="Bond module sections"
        >
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            const status =
              section.id === "market-monitor"
                ? marketReady
                  ? "loaded"
                  : "pending"
                : "live";

            return (
              <button
                key={section.id}
                id={`${section.id}-tab`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${section.id}-panel`}
                onClick={() => onChange(section.id)}
                className={cn(
                  "group rounded-[1.6rem] border px-5 py-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                  isActive
                    ? "border-accent/30 bg-[radial-gradient(circle_at_top_right,rgba(226,184,107,0.12),transparent_28%),linear-gradient(180deg,rgba(25,34,47,0.96),rgba(12,18,27,0.96))] shadow-[0_18px_42px_rgba(196,154,74,0.12)]"
                    : "border-white/[0.06] bg-[linear-gradient(180deg,rgba(11,18,28,0.86),rgba(8,13,21,0.8))] hover:border-border-strong/80 hover:bg-[linear-gradient(180deg,rgba(15,23,35,0.92),rgba(9,15,23,0.88))]",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                        Step {section.step}
                      </span>
                      <StatusBadge
                        current={isActive}
                        status={status}
                      />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        {section.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-foreground-soft">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold transition",
                      isActive
                        ? "border-accent/30 bg-accent/12 text-accent-foreground"
                        : "border-white/[0.08] bg-slate-950/55 text-foreground-muted group-hover:border-border-strong/80 group-hover:text-foreground",
                    )}
                  >
                    {section.step}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </SurfaceCard>
  );
}

function StatusBadge({
  status,
  current,
}: {
  status: "live" | "loaded" | "pending";
  current: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
        current && "border-accent/25 bg-accent/10 text-accent-foreground",
        !current &&
          status === "live" &&
          "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200",
        !current &&
          status === "loaded" &&
          "border-sky-400/20 bg-sky-400/[0.08] text-sky-200",
        !current &&
          status === "pending" &&
          "border-white/[0.08] bg-background-muted/80 text-foreground-subtle",
      )}
    >
      {current ? "Current" : status === "live" ? "Live" : status === "loaded" ? "Loaded" : "Pending"}
    </span>
  );
}

function SectionSignal({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ready" | "pending";
}) {
  return (
    <div
      className={cn(
        "rounded-full border px-3 py-2 text-xs",
        tone === "ready"
          ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-100"
          : "border-white/[0.08] bg-background-muted/80 text-foreground-subtle",
      )}
    >
      <span className="font-semibold uppercase tracking-[0.16em]">{label}</span>
      <span className="ml-2 text-foreground-soft">{value}</span>
    </div>
  );
}
