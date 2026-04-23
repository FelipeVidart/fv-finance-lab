"use client";

import {
  useId,
  useMemo,
  useState,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";

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
    value: entry.values[resolvedHoverIndex] ?? 0,
  }));
  const summaryRows = activeSeries.map((entry) => ({
    label: entry.label,
    color: entry.color,
    lastValue: entry.values[entry.values.length - 1] ?? 0,
    minValue: entry.values.length > 0 ? Math.min(...entry.values) : 0,
    maxValue: entry.values.length > 0 ? Math.max(...entry.values) : 0,
  }));
  const hoverX =
    CHART_LEFT +
    (resolvedHoverIndex / Math.max(dates.length - 1, 1)) * CHART_WIDTH;
  const windowLabel =
    dates.length > 0
      ? `${formatDateLabel(dates[0])} - ${formatDateLabel(dates[dates.length - 1])}`
      : "No data window";

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
      className={cn(
        "relative overflow-hidden rounded-[1.8rem] border border-border-strong/80",
        "bg-[radial-gradient(circle_at_top_right,rgba(226,184,107,0.08),transparent_24%),linear-gradient(180deg,rgba(13,20,30,0.98),rgba(7,12,19,0.96))]",
        "shadow-[var(--shadow-card)]",
        heightClassName,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(226,184,107,0.52),transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative z-10 flex h-full flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="flex flex-wrap gap-2">
            <MetaPill>{interactive ? "Detail workspace" : "Chart preview"}</MetaPill>
            <MetaPill>
              {activeSeries.length}/{series.length} series
            </MetaPill>
            <MetaPill>{windowLabel}</MetaPill>
          </div>
          {onChartClick ? (
            <span className="pointer-events-none rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
              {expandLabel ?? "Expand chart"}
            </span>
          ) : null}
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.45rem] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(8,14,22,0.88),rgba(8,14,22,0.52))] px-2 py-2 sm:px-3 sm:py-3">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-80 [background-image:linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] [background-size:32px_32px]"
          />

          <svg
            viewBox="0 0 640 260"
            className="relative z-10 h-full w-full"
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
                    stroke="rgba(148, 163, 184, 0.14)"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y={y + 4}
                    fill="rgba(202, 211, 222, 0.72)"
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
                  stroke="rgba(217, 176, 107, 0.48)"
                  strokeWidth="1.2"
                  strokeDasharray="5 4"
                />
                {inspectionRows.map((entry) => (
                  <circle
                    key={entry.label}
                    cx={hoverX}
                    cy={getYCoordinate(entry.value, yMin, yMax)}
                    r="4"
                    fill={entry.color}
                    stroke="rgba(7, 16, 25, 0.96)"
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
              stroke="rgba(148, 163, 184, 0.22)"
              strokeWidth="1"
            />
            <text
              x={CHART_LEFT}
              y="250"
              fill="rgba(148, 163, 184, 0.72)"
              fontSize="11"
            >
              {dates.length > 0 ? formatDateLabel(dates[0]) : ""}
            </text>
            <text
              x={CHART_RIGHT}
              y="250"
              textAnchor="end"
              fill="rgba(148, 163, 184, 0.72)"
              fontSize="11"
            >
              {dates.length > 0 ? formatDateLabel(dates[dates.length - 1]) : ""}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {interactive ? (
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]">
          <div className="rounded-[1.45rem] border border-border/80 bg-background-muted/80 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              Inspection date
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {activeDate ? formatDateLabel(activeDate) : "No data"}
            </p>
            <p className="mt-1 text-xs leading-6 text-foreground-muted">
              Hover the chart to inspect exact values for the visible series.
            </p>
          </div>

          <div className="rounded-[1.45rem] border border-border/80 bg-background-muted/80 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              Values at cursor
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {inspectionRows.map((entry) => (
                <div
                  key={entry.label}
                  className="rounded-[1.1rem] border border-border/80 bg-slate-950/65 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                      {entry.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">
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
          className="block w-full text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
        >
          {chart}
        </button>
      ) : (
        chart
      )}

      <div className="flex flex-wrap gap-2.5">
        {series.map((entry) => {
          const isVisible = !effectiveHiddenSeriesLabels.includes(entry.label);
          const lastValue = entry.values[entry.values.length - 1] ?? 0;

          return (
            <button
              key={entry.label}
              type="button"
              onClick={
                interactive ? () => handleToggleSeries(entry.label) : undefined
              }
              aria-pressed={isVisible}
              disabled={!interactive}
              className={cn(
                "flex items-center gap-3 rounded-full border px-3 py-2 text-left transition",
                isVisible
                  ? "border-border-strong/85 bg-background-muted/80 text-foreground"
                  : "border-white/[0.08] bg-slate-950/35 text-foreground-subtle",
                interactive
                  ? "hover:border-accent/25 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                  : "cursor-default",
              )}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: entry.color,
                  opacity: isVisible ? 1 : 0.35,
                }}
              />
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                {entry.label}
              </span>
              <span className="text-xs text-foreground-muted">
                {valueFormatter(lastValue)}
              </span>
            </button>
          );
        })}
      </div>

      {showSummary ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {summaryRows.map((entry) => (
            <div
              key={entry.label}
              className="rounded-[1.45rem] border border-border/80 bg-background-muted/80 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <p className="text-sm font-semibold text-foreground">
                  {entry.label}
                </p>
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

function MetaPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border/80 bg-background-muted/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
      {children}
    </span>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
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
