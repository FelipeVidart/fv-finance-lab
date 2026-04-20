"use client";

import {
  useId,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

export type LineChartSeries = {
  label: string;
  values: number[];
  color: string;
};

type LineChartPanelProps = {
  title: string;
  dates: string[];
  series: LineChartSeries[];
  valueFormatter: (value: number) => string;
  heightClassName?: string;
  onChartClick?: () => void;
  expandLabel?: string;
  interactive?: boolean;
  showSummary?: boolean;
};

const CHART_LEFT = 50;
const CHART_RIGHT = 610;
const CHART_TOP = 20;
const CHART_BOTTOM = 230;
const CHART_WIDTH = CHART_RIGHT - CHART_LEFT;
const CHART_HEIGHT = CHART_BOTTOM - CHART_TOP;

export function LineChartPanel({
  title,
  dates,
  series,
  valueFormatter,
  heightClassName = "h-72",
  onChartClick,
  expandLabel,
  interactive = false,
  showSummary = false,
}: LineChartPanelProps) {
  const chartId = useId();
  const [hiddenSeriesLabels, setHiddenSeriesLabels] = useState<string[]>([]);
  const effectiveHiddenSeriesLabels = useMemo(
    () =>
      hiddenSeriesLabels.filter((label) =>
        series.some((entry) => entry.label === label),
      ),
    [hiddenSeriesLabels, series],
  );
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const visibleSeries = useMemo(
    () =>
      series.filter((entry) => !effectiveHiddenSeriesLabels.includes(entry.label)),
    [effectiveHiddenSeriesLabels, series],
  );
  const activeSeries = visibleSeries.length > 0 ? visibleSeries : series;
  const allValues = activeSeries.flatMap((entry) => entry.values);
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1;
  const domainPadding =
    minValue === maxValue
      ? Math.max(Math.abs(minValue) * 0.1, 1)
      : (maxValue - minValue) * 0.12;
  const yMin = minValue - domainPadding;
  const yMax = maxValue + domainPadding;
  const resolvedHoverIndex =
    hoverIndex !== null ? hoverIndex : Math.max(dates.length - 1, 0);
  const activeDate = dates[resolvedHoverIndex];
  const inspectionRows = activeSeries.map((entry) => ({
    label: entry.label,
    color: entry.color,
    value: entry.values[resolvedHoverIndex],
  }));
  const summaryRows = activeSeries.map((entry) => ({
    label: entry.label,
    color: entry.color,
    lastValue: entry.values[entry.values.length - 1],
    minValue: Math.min(...entry.values),
    maxValue: Math.max(...entry.values),
  }));
  const hoverX =
    CHART_LEFT +
    (resolvedHoverIndex / Math.max(dates.length - 1, 1)) * CHART_WIDTH;

  function handleToggleSeries(label: string) {
    setHiddenSeriesLabels((current) => {
      if (current.includes(label)) {
        return current.filter((entry) => entry !== label);
      }

      if (series.length - current.length <= 1) {
        return current;
      }

      return [...current, label];
    });
  }

  function handlePointerMove(
    event: ReactMouseEvent<SVGSVGElement> | ReactPointerEvent<SVGSVGElement>,
  ) {
    if (!interactive || dates.length === 0) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - bounds.left) / bounds.width) * CHART_WIDTH;
    const clampedX = Math.min(Math.max(relativeX, 0), CHART_WIDTH);
    const nextIndex = Math.round(
      (clampedX / CHART_WIDTH) * Math.max(dates.length - 1, 0),
    );

    setHoverIndex(nextIndex);
  }

  function handlePointerLeave() {
    if (!interactive) {
      return;
    }

    setHoverIndex(null);
  }

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
        onMouseMove={interactive ? handlePointerMove : undefined}
        onMouseLeave={interactive ? handlePointerLeave : undefined}
        onPointerMove={interactive ? handlePointerMove : undefined}
        onPointerLeave={interactive ? handlePointerLeave : undefined}
      >
        <title id={chartId}>{title}</title>
        {[0, 1, 2, 3].map((index) => {
          const y = CHART_TOP + index * 70;
          const gridValue =
            yMax - ((y - CHART_TOP) / CHART_HEIGHT) * (yMax - yMin);

          return (
            <g key={index}>
              <line
                x1={CHART_LEFT}
                y1={y}
                x2={CHART_RIGHT}
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

        {activeSeries.map((entry) => (
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

        {interactive && dates.length > 0 ? (
          <>
            <line
              x1={hoverX}
              y1={CHART_TOP}
              x2={hoverX}
              y2={CHART_BOTTOM}
              stroke="rgba(125, 211, 252, 0.55)"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            {inspectionRows.map((entry) => (
              <circle
                key={entry.label}
                cx={hoverX}
                cy={getYCoordinate(entry.value, yMin, yMax)}
                r="4"
                fill={entry.color}
                stroke="rgba(15, 23, 42, 0.95)"
                strokeWidth="2"
              />
            ))}
          </>
        ) : null}

        <line
          x1={CHART_LEFT}
          y1={CHART_BOTTOM}
          x2={CHART_RIGHT}
          y2={CHART_BOTTOM}
          stroke="rgba(148, 163, 184, 0.25)"
          strokeWidth="1"
        />
        <text
          x={CHART_LEFT}
          y="250"
          fill="rgba(148, 163, 184, 0.75)"
          fontSize="11"
        >
          {dates.length > 0 ? formatDateLabel(dates[0]) : ""}
        </text>
        <text
          x={CHART_RIGHT}
          y="250"
          textAnchor="end"
          fill="rgba(148, 163, 184, 0.75)"
          fontSize="11"
        >
          {dates.length > 0 ? formatDateLabel(dates[dates.length - 1]) : ""}
        </text>
      </svg>
    </div>
  );

  return (
    <div className="space-y-5">
      {interactive ? (
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Inspection Date
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {activeDate ? formatDateLabel(activeDate) : "No data"}
            </p>
            <p className="mt-1 text-xs leading-6 text-slate-400">
              Hover the chart to inspect exact values for the visible series.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Values At Cursor
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {inspectionRows.map((entry) => (
                <div
                  key={entry.label}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {entry.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {valueFormatter(entry.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

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
        {series.map((entry) => {
          const isVisible = !effectiveHiddenSeriesLabels.includes(entry.label);

          return (
            <button
              key={entry.label}
              type="button"
              onClick={
                interactive ? () => handleToggleSeries(entry.label) : undefined
              }
              aria-pressed={isVisible}
              disabled={!interactive}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition ${
                isVisible
                  ? "border-white/10 bg-slate-950/60 text-slate-300"
                  : "border-white/10 bg-slate-950/40 text-slate-500"
              } ${
                interactive
                  ? "hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
                  : "cursor-default"
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: entry.color,
                  opacity: isVisible ? 1 : 0.35,
                }}
              />
              <span>{entry.label}</span>
            </button>
          );
        })}
      </div>

      {showSummary ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {summaryRows.map((entry) => (
            <div
              key={entry.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <p className="text-sm font-semibold text-white">{entry.label}</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <SummaryStat
                  label="Last"
                  value={valueFormatter(entry.lastValue)}
                />
                <SummaryStat
                  label="Min"
                  value={valueFormatter(entry.minValue)}
                />
                <SummaryStat
                  label="Max"
                  value={valueFormatter(entry.maxValue)}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function buildPath(values: number[], yMin: number, yMax: number): string {
  return values
    .map((value, index) => {
      const x = CHART_LEFT + (index / Math.max(values.length - 1, 1)) * CHART_WIDTH;
      const y =
        CHART_BOTTOM -
        ((value - yMin) / Math.max(yMax - yMin, 1e-9)) * CHART_HEIGHT;
      const command = index === 0 ? "M" : "L";

      return `${command} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function getYCoordinate(value: number, yMin: number, yMax: number): number {
  return (
    CHART_BOTTOM -
    ((value - yMin) / Math.max(yMax - yMin, 1e-9)) * CHART_HEIGHT
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
