"use client";

import { useState, type ReactNode } from "react";
import { Card } from "@/components/card";
import { ChartDetailModal } from "@/components/chart-detail-modal";

type ExpandableChartCardProps = {
  eyebrow?: string;
  title: string;
  description: string;
  detailDescription?: string;
  renderPreview: (controls: { open: () => void }) => ReactNode;
  detail: ReactNode;
};

export function ExpandableChartCard({
  eyebrow = "Chart",
  title,
  description,
  detailDescription,
  renderPreview,
  detail,
}: ExpandableChartCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  function open() {
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  return (
    <>
      <Card
        eyebrow={eyebrow}
        title={title}
        description={description}
        className="h-full"
        actions={
          <button
            type="button"
            onClick={open}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
          >
            Expand
          </button>
        }
      >
        {renderPreview({ open })}
      </Card>

      <ChartDetailModal
        isOpen={isOpen}
        onClose={close}
        title={title}
        description={detailDescription ?? description}
      >
        {detail}
      </ChartDetailModal>
    </>
  );
}
