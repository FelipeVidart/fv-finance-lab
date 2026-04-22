"use client";

import type { RiskSectionId } from "@/components/risk/types";

const sections: Array<{
  id: RiskSectionId;
  label: string;
  description: string;
}> = [
  {
    id: "setup",
    label: "Setup",
    description: "Load the market dataset and define portfolio weights.",
  },
  {
    id: "asset-analytics",
    label: "Asset Analytics",
    description: "Review normalized price, returns, drawdowns, and summary metrics.",
  },
  {
    id: "portfolio-analytics",
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
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm">
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
              className={`rounded-[1.35rem] border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 ${
                isActive
                  ? "border-sky-400/30 bg-sky-400/[0.12] text-white"
                  : "border-white/5 bg-slate-950/50 text-slate-300 hover:border-white/15 hover:bg-white/[0.05]"
              }`}
            >
              <p className="text-sm font-semibold">{section.label}</p>
              <p
                className={`mt-2 text-xs leading-5 ${
                  isActive ? "text-sky-100/80" : "text-slate-400"
                }`}
              >
                {section.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
