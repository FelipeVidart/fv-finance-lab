import type { DatasetStatusItem } from "@/components/risk/types";

type RiskDatasetStatusStripProps = {
  items: DatasetStatusItem[];
};

export function RiskDatasetStatusStrip({
  items,
}: RiskDatasetStatusStripProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.2rem] border border-white/10 bg-slate-950/55 px-4 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
