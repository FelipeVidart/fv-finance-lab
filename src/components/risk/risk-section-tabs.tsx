"use client";

import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
import type { RiskSectionId } from "@/components/risk/types";

const sections: Array<{
  id: RiskSectionId;
  label: string;
  description: string;
  step: string;
}> = [
  {
    id: "setup",
    step: "01",
    label: "Setup",
    description: "Load the aligned market dataset and define the sandbox weights.",
  },
  {
    id: "asset-analytics",
    step: "02",
    label: "Asset Analytics",
    description: "Inspect normalized price, return, drawdown, and cross-sectional metrics.",
  },
  {
    id: "portfolio-analytics",
    step: "03",
    label: "Portfolio Analytics",
    description: "Review weighted NAV, drawdown, holdings, and portfolio comparison views.",
  },
];

type RiskSectionTabsProps = {
  activeSection: RiskSectionId;
  datasetReady: boolean;
  sandboxReady: boolean;
  onChange: (section: RiskSectionId) => void;
};

export function RiskSectionTabs({
  activeSection,
  datasetReady,
  sandboxReady,
  onChange,
}: RiskSectionTabsProps) {
  return (
    <SurfaceCard tone="elevated" padding="sm" className="border-white/[0.08]">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
              Workspace sections
            </p>
            <p className="max-w-2xl text-sm leading-7 text-foreground-soft">
              Move through the workflow as the dataset and sandbox become
              operational. Each section stays visible so the module reads like a
              connected workstation, not a disconnected stack of cards.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SectionStatusPill
              label="Dataset"
              value={datasetReady ? "Ready" : "Pending"}
              tone={datasetReady ? "ready" : "pending"}
            />
            <SectionStatusPill
              label="Sandbox"
              value={sandboxReady ? "Validated" : "Pending"}
              tone={sandboxReady ? "ready" : "pending"}
            />
          </div>
        </div>

        <div
          className="grid gap-3 xl:grid-cols-3"
          role="tablist"
          aria-label="Risk analytics sections"
        >
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            const status = getSectionStatus(section.id, datasetReady, sandboxReady);

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
                      <StatusBadge {...status} current={isActive} />
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

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4 text-xs uppercase tracking-[0.16em]">
                  <span className="text-foreground-subtle">{status.detail}</span>
                  <span
                    className={cn(
                      "font-semibold",
                      isActive ? "text-accent-foreground" : "text-foreground-muted",
                    )}
                  >
                    {isActive ? "Open section" : "View section"}
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

function getSectionStatus(
  id: RiskSectionId,
  datasetReady: boolean,
  sandboxReady: boolean,
) {
  if (id === "setup") {
    return {
      label: "Control center",
      tone: "active" as const,
      detail: "Dataset request and sandbox controls live here.",
    };
  }

  if (id === "asset-analytics") {
    return datasetReady
      ? {
          label: "Ready",
          tone: "ready" as const,
          detail: "Aligned asset views are available.",
        }
      : {
          label: "Locked",
          tone: "pending" as const,
          detail: "Load the shared dataset first.",
        };
  }

  return sandboxReady
    ? {
        label: "Ready",
        tone: "ready" as const,
        detail: "Weighted portfolio review is available.",
      }
    : datasetReady
      ? {
          label: "Awaiting weights",
          tone: "active" as const,
          detail: "Validate the sandbox weights to continue.",
        }
      : {
          label: "Locked",
          tone: "pending" as const,
          detail: "Setup must unlock the portfolio layer.",
        };
}

function StatusBadge({
  label,
  tone,
  current,
}: {
  label: string;
  tone: "ready" | "active" | "pending";
  current: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
        current && "border-accent/25 bg-accent/10 text-accent-foreground",
        !current &&
          tone === "ready" &&
          "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200",
        !current &&
          tone === "active" &&
          "border-amber-400/20 bg-amber-400/[0.08] text-amber-200",
        !current &&
          tone === "pending" &&
          "border-white/[0.08] bg-background-muted/80 text-foreground-subtle",
      )}
    >
      {current ? "Current" : label}
    </span>
  );
}

function SectionStatusPill({
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
