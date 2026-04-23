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
        tone="elevated"
        actions={
          <button
            type="button"
            onClick={open}
            className="rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-foreground transition hover:border-accent/35 hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
          >
            Expand chart
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
