"use client";

import { useId } from "react";

export type LineChartSeries = {
  label: string;
  values: number[];
  color: string;
};

type LineChartPanelProps = {
  title: string;
  startDate: string;
  endDate: string;
  series: LineChartSeries[];
  valueFormatter: (value: number) => string;
  heightClassName?: string;
  onChartClick?: () => void;
  expandLabel?: string;
};

export function LineChartPanel({
  title,
  startDate,
  endDate,
  series,
  valueFormatter,
  heightClassName = "h-72",
  onChartClick,
  expandLabel,
}: LineChartPanelProps) {
  const chartId = useId();
  const allValues = series.flatMap((entry) => entry.values);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const domainPadding =
    minValue === maxValue
      ? Math.max(Math.abs(minValue) * 0.1, 1)
      : (maxValue - minValue) * 0.12;
  const yMin = minValue - domainPadding;
  const yMax = maxValue + domainPadding;
  const chart = (
    <div
      className={`relative rounded-2xl border border-white/10 bg-slate-950/60 p-4 ${heightClassName}`.trim()}
    >
      {onChartClick ? (
        <span className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
          Open detail
        </span>
      ) : null}

      <svg
        viewBox="0 0 640 260"
        className="h-full w-full"
        role="img"
        aria-labelledby={chartId}
      >
        <title id={chartId}>{title}</title>
        {[0, 1, 2, 3].map((index) => {
          const y = 20 + index * 70;
          const gridValue = yMax - ((y - 20) / 210) * (yMax - yMin);

          return (
            <g key={index}>
              <line
                x1="50"
                y1={y}
                x2="610"
                y2={y}
                stroke="rgba(148, 163, 184, 0.16)"
                strokeWidth="1"
              />
              <text
                x="0"
                y={y + 4}
                fill="rgba(203, 213, 225, 0.75)"
                fontSize="11"
              >
                {valueFormatter(gridValue)}
              </text>
            </g>
          );
        })}

        {series.map((entry) => (
          <path
            key={entry.label}
            d={buildPath(entry.values, yMin, yMax)}
            fill="none"
            stroke={entry.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        <line
          x1="50"
          y1="230"
          x2="610"
          y2="230"
          stroke="rgba(148, 163, 184, 0.25)"
          strokeWidth="1"
        />
        <text
          x="50"
          y="250"
          fill="rgba(148, 163, 184, 0.75)"
          fontSize="11"
        >
          {formatDateLabel(startDate)}
        </text>
        <text
          x="610"
          y="250"
          textAnchor="end"
          fill="rgba(148, 163, 184, 0.75)"
          fontSize="11"
        >
          {formatDateLabel(endDate)}
        </text>
      </svg>
    </div>
  );

  return (
    <div className="space-y-5">
      {onChartClick ? (
        <button
          type="button"
          onClick={onChartClick}
          aria-label={expandLabel ?? `Expand ${title} chart`}
          className="block w-full text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
        >
          {chart}
        </button>
      ) : (
        chart
      )}

      <div className="flex flex-wrap gap-3">
        {series.map((entry) => (
          <div
            key={entry.label}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-300"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildPath(values: number[], yMin: number, yMax: number): string {
  return values
    .map((value, index) => {
      const x = 50 + (index / Math.max(values.length - 1, 1)) * 560;
      const y = 230 - ((value - yMin) / Math.max(yMax - yMin, 1e-9)) * 210;
      const command = index === 0 ? "M" : "L";

      return `${command} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
