"use client";

import { SurfaceCard } from "@/components/ui/surface-card";
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
    description: "Load the market dataset and define portfolio weights.",
  },
  {
    id: "asset-analytics",
    step: "02",
    label: "Asset Analytics",
    description: "Review normalized price, returns, drawdowns, and summary metrics.",
  },
  {
    id: "portfolio-analytics",
    step: "03",
    label: "Portfolio Analytics",
    description: "Analyze weighted NAV, drawdown, comparison, and holdings.",
  },
];

type RiskSectionTabsProps = {
  activeSection: RiskSectionId;
  onChange: (section: RiskSectionId) => void;
};

export function RiskSectionTabs({
  activeSection,
  onChange,
}: RiskSectionTabsProps) {
  return (
    <SurfaceCard tone="elevated" padding="sm">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
              Workspace sections
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-foreground-soft">
              Move from setup into review sections only after the dataset and
              sandbox are ready.
            </p>
          </div>
        </div>

        <div
          className="grid gap-2 lg:grid-cols-3"
          role="tablist"
          aria-label="Risk analytics sections"
        >
          {sections.map((section) => {
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                id={`${section.id}-tab`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${section.id}-panel`}
                onClick={() => onChange(section.id)}
                className={`rounded-[1.45rem] border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 ${
                  isActive
                    ? "border-accent/35 bg-accent/12 text-white shadow-[0_16px_34px_rgba(196,154,74,0.12)]"
                    : "border-white/5 bg-slate-950/45 text-slate-300 hover:border-border hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{section.label}</p>
                    <p
                      className={`mt-2 text-xs leading-5 ${
                        isActive ? "text-accent-foreground/80" : "text-slate-400"
                      }`}
                    >
                      {section.description}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                      isActive
                        ? "border-accent/25 bg-accent/10 text-accent-foreground"
                        : "border-border/80 bg-background-muted/70 text-foreground-subtle"
                    }`}
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
