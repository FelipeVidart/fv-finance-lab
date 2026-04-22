"use client";

import type { BondsSectionId } from "@/components/bonds/types";

const sections: Array<{
  id: BondsSectionId;
  label: string;
  description: string;
}> = [
  {
    id: "pricing",
    label: "Pricing",
    description: "Manual fixed-rate bond valuation and primary result.",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Duration and cash flow analytics from the same calculation.",
  },
  {
    id: "market-monitor",
    label: "Market Monitor",
    description: "Fetched market context, benchmark spreads, and market history.",
  },
];

type BondSectionTabsProps = {
  activeSection: BondsSectionId;
  onChange: (section: BondsSectionId) => void;
};

export function BondSectionTabs({
  activeSection,
  onChange,
}: BondSectionTabsProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm">
      <div
        className="grid gap-2 lg:grid-cols-3"
        role="tablist"
        aria-label="Bond module sections"
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
