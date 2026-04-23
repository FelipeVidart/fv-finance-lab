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
import type { BlackScholesInput } from "@/lib/finance/black-scholes";
import type { OptionPayoffPoint } from "@/lib/finance/option-payoff";

type OptionsPayoffChartProps = {
  data: OptionPayoffPoint[];
  inputs: BlackScholesInput;
  optionPrice: number;
  interactive?: boolean;
  showSummary?: boolean;
  heightClassName?: string;
  onChartClick?: () => void;
  expandLabel?: string;
};

type SeriesKey = "payoff" | "profit";

const CHART_WIDTH = 760;
const CHART_HEIGHT = 320;
const PADDING = {
  top: 20,
  right: 20,
  bottom: 44,
  left: 60,
};

const SERIES_CONFIG: Array<{
  key: SeriesKey;
  label: string;
  color: string;
}> = [
  {
    key: "payoff",
    label: "Payoff at expiry",
    color: "rgba(125, 211, 252, 0.95)",
  },
  {
    key: "profit",
    label: "Profit at expiry",
    color: "rgba(110, 231, 183, 0.95)",
  },
];

function formatAxisNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatSeriesValue(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildLinePath(
  values: OptionPayoffPoint[],
  getX: (point: OptionPayoffPoint) => number,
  getY: (value: number) => number,
  key: SeriesKey,
): string {
  return values
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";

      return `${command}${getX(point).toFixed(2)},${getY(point[key]).toFixed(2)}`;
    })
    .join(" ");
}

export function OptionsPayoffChart({
  data,
  inputs,
  optionPrice,
  interactive = false,
  showSummary = false,
  heightClassName = "h-auto",
  onChartClick,
  expandLabel,
}: OptionsPayoffChartProps) {
  const chartId = useId();
  const [hiddenSeriesKeys, setHiddenSeriesKeys] = useState<SeriesKey[]>([]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const activeSeries = useMemo(() => {
    const visible = SERIES_CONFIG.filter(
      (entry) => !hiddenSeriesKeys.includes(entry.key),
    );

    return visible.length > 0 ? visible : SERIES_CONFIG;
  }, [hiddenSeriesKeys]);
  const xValues = data.map((point) => point.spot);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yValues = data.flatMap((point) => [
    ...activeSeries.map((entry) => point[entry.key]),
    0,
  ]);
  const yMinRaw = Math.min(...yValues);
  const yMaxRaw = Math.max(...yValues);
  const yPadding = Math.max((yMaxRaw - yMinRaw) * 0.12, 1);
  const yMin = yMinRaw - yPadding;
  const yMax = yMaxRaw + yPadding;
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const defaultHoverIndex = useMemo(
    () =>
      data.reduce((closestIndex, point, index) => {
        const currentDistance = Math.abs(point.spot - inputs.spot);
        const closestDistance = Math.abs(data[closestIndex].spot - inputs.spot);

        return currentDistance < closestDistance ? index : closestIndex;
      }, 0),
    [data, inputs.spot],
  );
  const resolvedHoverIndex =
    hoverIndex !== null ? hoverIndex : Math.max(defaultHoverIndex, 0);
  const hoveredPoint = data[resolvedHoverIndex] ?? data[0];

  const scaleX = (value: number) =>
    PADDING.left +
    ((value - xMin) / Math.max(xMax - xMin, 1e-9)) * plotWidth;
  const scaleY = (value: number) =>
    PADDING.top +
    (1 - (value - yMin) / Math.max(yMax - yMin, 1e-9)) * plotHeight;

  const zeroY = scaleY(0);
  const strikeX = scaleX(inputs.strike);
  const spotX = scaleX(inputs.spot);
  const hoverX = hoveredPoint ? scaleX(hoveredPoint.spot) : PADDING.left;
  const payoffPath = buildLinePath(
    data,
    (point) => scaleX(point.spot),
    scaleY,
    "payoff",
  );
  const profitPath = buildLinePath(
    data,
    (point) => scaleX(point.spot),
    scaleY,
    "profit",
  );
  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;

    return yMax - ratio * (yMax - yMin);
  });
  const xTicks = [xMin, inputs.strike, inputs.spot, xMax].filter(
    (value, index, values) =>
      values.findIndex((candidate) => Math.abs(candidate - value) < 0.001) ===
      index,
  );
  const inspectionRows = activeSeries.map((entry) => ({
    label: entry.label,
    color: entry.color,
    value: hoveredPoint?.[entry.key] ?? 0,
  }));
  const summaryRows = activeSeries.map((entry) => ({
    label: entry.label,
    color: entry.color,
    lastValue: data[data.length - 1]?.[entry.key] ?? 0,
    minValue: Math.min(...data.map((point) => point[entry.key])),
    maxValue: Math.max(...data.map((point) => point[entry.key])),
  }));
  const windowLabel = `${formatSeriesValue(xMin)} - ${formatSeriesValue(xMax)} spot`;

  function handleToggleSeries(key: SeriesKey) {
    setHiddenSeriesKeys((current) => {
      if (current.includes(key)) {
        return current.filter((entry) => entry !== key);
      }

      if (SERIES_CONFIG.length - current.length <= 1) {
        return current;
      }

      return [...current, key];
    });
  }

  const handlePointerMove = (
    event: ReactMouseEvent<SVGSVGElement> | ReactPointerEvent<SVGSVGElement>,
  ) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - bounds.left) / bounds.width) * CHART_WIDTH;
    const clampedX = Math.min(
      Math.max(relativeX, PADDING.left),
      CHART_WIDTH - PADDING.right,
    );
    const ratio = (clampedX - PADDING.left) / plotWidth;
    const nextIndex = Math.round(ratio * Math.max(data.length - 1, 0));

    setHoverIndex(nextIndex);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  const chart = (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-border-strong/80",
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
            <MetaPill>{interactive ? "Detail workspace" : "Payoff preview"}</MetaPill>
            <MetaPill>{activeSeries.length}/{SERIES_CONFIG.length} series</MetaPill>
            <MetaPill>{windowLabel}</MetaPill>
          </div>
          {onChartClick ? (
            <span className="pointer-events-none rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
              {expandLabel ?? "Expand chart"}
            </span>
          ) : null}
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.5rem] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(8,14,22,0.88),rgba(8,14,22,0.52))] px-2 py-2 sm:px-3 sm:py-3">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-80 [background-image:linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] [background-size:32px_32px]"
          />

          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="relative z-10 h-full w-full"
            role="img"
            aria-labelledby={chartId}
            onMouseMove={interactive ? handlePointerMove : undefined}
            onMouseLeave={interactive ? handlePointerLeave : undefined}
            onPointerMove={interactive ? handlePointerMove : undefined}
            onPointerLeave={interactive ? handlePointerLeave : undefined}
          >
            <title id={chartId}>{titleForPayoffChart(inputs.optionType)}</title>
            <rect
              x={PADDING.left}
              y={PADDING.top}
              width={plotWidth}
              height={plotHeight}
              fill="rgba(15, 23, 42, 0.35)"
              rx="18"
            />

            {yTicks.map((tick) => (
              <g key={`y-${tick}`}>
                <line
                  x1={PADDING.left}
                  x2={CHART_WIDTH - PADDING.right}
                  y1={scaleY(tick)}
                  y2={scaleY(tick)}
                  stroke="rgba(148, 163, 184, 0.14)"
                  strokeWidth="1"
                />
                <text
                  x={PADDING.left - 12}
                  y={scaleY(tick) + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="rgba(148, 163, 184, 0.78)"
                >
                  {formatAxisNumber(tick)}
                </text>
              </g>
            ))}

            {xTicks.map((tick) => (
              <g key={`x-${tick}`}>
                <line
                  x1={scaleX(tick)}
                  x2={scaleX(tick)}
                  y1={PADDING.top}
                  y2={CHART_HEIGHT - PADDING.bottom}
                  stroke="rgba(148, 163, 184, 0.1)"
                  strokeWidth="1"
                />
                <text
                  x={scaleX(tick)}
                  y={CHART_HEIGHT - 14}
                  textAnchor="middle"
                  fontSize="11"
                  fill="rgba(148, 163, 184, 0.78)"
                >
                  {formatAxisNumber(tick)}
                </text>
              </g>
            ))}

            <line
              x1={PADDING.left}
              x2={CHART_WIDTH - PADDING.right}
              y1={zeroY}
              y2={zeroY}
              stroke="rgba(148, 163, 184, 0.4)"
              strokeWidth="1.5"
            />

            <line
              x1={strikeX}
              x2={strikeX}
              y1={PADDING.top}
              y2={CHART_HEIGHT - PADDING.bottom}
              stroke="rgba(253, 224, 71, 0.9)"
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />

            <line
              x1={spotX}
              x2={spotX}
              y1={PADDING.top}
              y2={CHART_HEIGHT - PADDING.bottom}
              stroke="rgba(148, 163, 184, 0.7)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />

            {activeSeries.some((entry) => entry.key === "profit") ? (
              <path
                d={profitPath}
                fill="none"
                stroke="rgba(110, 231, 183, 0.95)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {activeSeries.some((entry) => entry.key === "payoff") ? (
              <path
                d={payoffPath}
                fill="none"
                stroke="rgba(125, 211, 252, 0.95)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {activeSeries.some((entry) => entry.key === "profit") ? (
              <circle
                cx={spotX}
                cy={scaleY(0 - optionPrice)}
                r="4.5"
                fill="rgba(110, 231, 183, 1)"
              />
            ) : null}

            {interactive ? (
              <>
                <line
                  x1={hoverX}
                  x2={hoverX}
                  y1={PADDING.top}
                  y2={CHART_HEIGHT - PADDING.bottom}
                  stroke="rgba(125, 211, 252, 0.55)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                {inspectionRows.map((entry) => (
                  <circle
                    key={entry.label}
                    cx={hoverX}
                    cy={scaleY(entry.value)}
                    r="4.5"
                    fill={entry.color}
                    stroke="rgba(15, 23, 42, 0.95)"
                    strokeWidth="2"
                  />
                ))}
              </>
            ) : null}

            <text
              x={PADDING.left}
              y={14}
              fontSize="11"
              fill="rgba(148, 163, 184, 0.78)"
            >
              Payoff / Profit
            </text>
            <text
              x={CHART_WIDTH - PADDING.right}
              y={CHART_HEIGHT - 14}
              textAnchor="end"
              fontSize="11"
              fill="rgba(148, 163, 184, 0.78)"
            >
              Underlying spot at expiry
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
          <div className="rounded-[1.5rem] border border-border/80 bg-background-muted/80 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              Inspection spot
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {formatSeriesValue(hoveredPoint?.spot ?? 0)}
            </p>
            <p className="mt-1 text-xs leading-6 text-foreground-muted">
              Hover the chart to inspect payoff and profit at a specific expiry spot.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-border/80 bg-background-muted/80 px-4 py-3">
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
                    {formatSeriesValue(entry.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2.5">
        {SERIES_CONFIG.map((entry) => {
          const isVisible = !hiddenSeriesKeys.includes(entry.key);
          const lastValue = data[data.length - 1]?.[entry.key] ?? 0;

          return (
            <button
              key={entry.key}
              type="button"
              onClick={
                interactive ? () => handleToggleSeries(entry.key) : undefined
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
                {formatSeriesValue(lastValue)}
              </span>
            </button>
          );
        })}

        <LegendPill label="Strike" tone="strike" />
        <LegendPill label="Current spot" tone="spot" />
      </div>

      {onChartClick ? (
        <button
          type="button"
          onClick={onChartClick}
          aria-label={expandLabel ?? "Expand option payoff chart"}
          className="block w-full text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
        >
          {chart}
        </button>
      ) : (
        chart
      )}

      {showSummary ? (
        <div className="grid gap-3 md:grid-cols-2">
          {summaryRows.map((entry) => (
            <div
              key={entry.label}
              className="rounded-[1.5rem] border border-border/80 bg-background-muted/80 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <p className="text-sm font-semibold text-foreground">{entry.label}</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <SummaryStat
                  label="Last"
                  value={formatSeriesValue(entry.lastValue)}
                />
                <SummaryStat
                  label="Min"
                  value={formatSeriesValue(entry.minValue)}
                />
                <SummaryStat
                  label="Max"
                  value={formatSeriesValue(entry.maxValue)}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Premium paid" value={formatSeriesValue(optionPrice)} />
        <StatTile label="Strike level" value={formatSeriesValue(inputs.strike)} />
        <StatTile label="Current spot" value={formatSeriesValue(inputs.spot)} />
      </div>
    </div>
  );
}

function MetaPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border/80 bg-background-muted/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
      {children}
    </span>
  );
}

function LegendPill({
  label,
  tone,
}: {
  label: string;
  tone: "strike" | "spot";
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-background-muted/80 px-3 py-2 text-xs text-foreground-muted">
      <span
        className={cn(
          "h-px w-4 border-t",
          tone === "strike"
            ? "border-dashed border-amber-300"
            : "border-dashed border-slate-400",
        )}
      />
      <span>{label}</span>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-border/80 bg-background-muted/80 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold text-foreground">{value}</p>
    </div>
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

function titleForPayoffChart(optionType: BlackScholesInput["optionType"]) {
  return `${optionType === "call" ? "Call" : "Put"} payoff and profit at expiry`;
}
