"use client";

import {
  useId,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";
import type { StrategyPayoffPoint } from "@/lib/finance/options";

type StrategyPayoffChartProps = {
  data: StrategyPayoffPoint[];
  currentSpot: number;
  breakevenPoints: number[];
  heightClassName?: string;
  interactive?: boolean;
};

const CHART_WIDTH = 760;
const CHART_HEIGHT = 320;
const PADDING = {
  top: 20,
  right: 20,
  bottom: 44,
  left: 60,
};

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
  values: StrategyPayoffPoint[],
  getX: (point: StrategyPayoffPoint) => number,
  getY: (value: number) => number,
  key: "payoff" | "profit",
): string {
  return values
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";

      return `${command}${getX(point).toFixed(2)},${getY(point[key]).toFixed(2)}`;
    })
    .join(" ");
}

export function StrategyPayoffChart({
  data,
  currentSpot,
  breakevenPoints,
  heightClassName = "h-[22rem]",
  interactive = false,
}: StrategyPayoffChartProps) {
  const chartId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const xValues = data.map((point) => point.spot);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yValues = data.flatMap((point) => [point.payoff, point.profit, 0]);
  const yMinRaw = Math.min(...yValues);
  const yMaxRaw = Math.max(...yValues);
  const yPadding = Math.max((yMaxRaw - yMinRaw) * 0.12, 1);
  const yMin = yMinRaw - yPadding;
  const yMax = yMaxRaw + yPadding;
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const scaleX = (value: number) =>
    PADDING.left +
    ((value - xMin) / Math.max(xMax - xMin, 1e-9)) * plotWidth;
  const scaleY = (value: number) =>
    PADDING.top +
    (1 - (value - yMin) / Math.max(yMax - yMin, 1e-9)) * plotHeight;

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
  const xTicks = [xMin, currentSpot, xMax].filter(
    (value, index, values) =>
      values.findIndex((candidate) => Math.abs(candidate - value) < 0.001) ===
      index,
  );
  const defaultHoverIndex = useMemo(
    () =>
      data.reduce((closestIndex, point, index) => {
        const currentDistance = Math.abs(point.spot - currentSpot);
        const closestDistance = Math.abs(data[closestIndex].spot - currentSpot);

        return currentDistance < closestDistance ? index : closestIndex;
      }, 0),
    [currentSpot, data],
  );
  const resolvedHoverIndex =
    hoverIndex !== null ? hoverIndex : Math.max(defaultHoverIndex, 0);
  const hoveredPoint = data[resolvedHoverIndex] ?? data[0];
  const hoverX = hoveredPoint ? scaleX(hoveredPoint.spot) : PADDING.left;
  const distanceToBreakeven =
    hoveredPoint && breakevenPoints.length > 0
      ? Math.min(
          ...breakevenPoints.map((point) =>
            Math.abs(point - hoveredPoint.spot),
          ),
        )
      : null;
  const tooltipWidth = 184;
  const tooltipHeight = distanceToBreakeven === null ? 82 : 102;
  const tooltipX = Math.min(
    Math.max(hoverX + 14, PADDING.left + 8),
    CHART_WIDTH - PADDING.right - tooltipWidth - 8,
  );
  const tooltipY = Math.max(PADDING.top + 10, PADDING.top + 12);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2.5">
        <LegendPill label="Payoff at expiry" color="border-sky-300" />
        <LegendPill label="Profit / loss" color="border-emerald-300" />
        <LegendPill label="Breakeven" color="border-amber-300" dashed />
        <LegendPill label="Current spot" color="border-slate-300" dashed />
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-[1.75rem] border border-border-strong/80",
          "bg-[radial-gradient(circle_at_top_right,rgba(226,184,107,0.08),transparent_24%),linear-gradient(180deg,rgba(13,20,30,0.98),rgba(7,12,19,0.96))]",
          "shadow-[var(--shadow-card)]",
          heightClassName,
        )}
      >
        <div className="relative z-10 flex h-full flex-col p-4 sm:p-5">
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
              <title id={chartId}>Strategy payoff and profit at expiry</title>
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
                y1={scaleY(0)}
                y2={scaleY(0)}
                stroke="rgba(148, 163, 184, 0.4)"
                strokeWidth="1.5"
              />

              <line
                x1={scaleX(currentSpot)}
                x2={scaleX(currentSpot)}
                y1={PADDING.top}
                y2={CHART_HEIGHT - PADDING.bottom}
                stroke="rgba(148, 163, 184, 0.7)"
                strokeWidth="1.5"
                strokeDasharray="4 6"
              />

              {breakevenPoints.map((point) => (
                <line
                  key={`breakeven-${point}`}
                  x1={scaleX(point)}
                  x2={scaleX(point)}
                  y1={PADDING.top}
                  y2={CHART_HEIGHT - PADDING.bottom}
                  stroke="rgba(253, 224, 71, 0.85)"
                  strokeWidth="1.5"
                  strokeDasharray="6 6"
                />
              ))}

              <path
                d={payoffPath}
                fill="none"
                stroke="rgba(125, 211, 252, 0.95)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={profitPath}
                fill="none"
                stroke="rgba(110, 231, 183, 0.95)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {interactive && hoveredPoint ? (
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
                  <circle
                    cx={hoverX}
                    cy={scaleY(hoveredPoint.payoff)}
                    r="4.5"
                    fill="rgba(125, 211, 252, 0.98)"
                    stroke="rgba(15, 23, 42, 0.95)"
                    strokeWidth="2"
                  />
                  <circle
                    cx={hoverX}
                    cy={scaleY(hoveredPoint.profit)}
                    r="4.5"
                    fill="rgba(110, 231, 183, 0.98)"
                    stroke="rgba(15, 23, 42, 0.95)"
                    strokeWidth="2"
                  />
                  <g>
                    <rect
                      x={tooltipX}
                      y={tooltipY}
                      width={tooltipWidth}
                      height={tooltipHeight}
                      rx="14"
                      fill="rgba(8, 14, 22, 0.96)"
                      stroke="rgba(148, 163, 184, 0.22)"
                    />
                    <text
                      x={tooltipX + 14}
                      y={tooltipY + 24}
                      fontSize="11"
                      fontWeight="700"
                      letterSpacing="0.12em"
                      fill="rgba(226, 184, 107, 0.92)"
                    >
                      INSPECTION
                    </text>
                    <text
                      x={tooltipX + 14}
                      y={tooltipY + 44}
                      fontSize="12"
                      fill="rgba(226, 232, 240, 0.94)"
                    >
                      Underlying: {formatSeriesValue(hoveredPoint.spot)}
                    </text>
                    <text
                      x={tooltipX + 14}
                      y={tooltipY + 62}
                      fontSize="12"
                      fill="rgba(125, 211, 252, 0.96)"
                    >
                      Payoff: {formatSeriesValue(hoveredPoint.payoff)}
                    </text>
                    <text
                      x={tooltipX + 14}
                      y={tooltipY + 80}
                      fontSize="12"
                      fill="rgba(110, 231, 183, 0.96)"
                    >
                      P/L: {formatSeriesValue(hoveredPoint.profit)}
                    </text>
                    {distanceToBreakeven !== null ? (
                      <text
                        x={tooltipX + 14}
                        y={tooltipY + 98}
                        fontSize="12"
                        fill="rgba(253, 224, 71, 0.94)"
                      >
                        To breakeven: {formatSeriesValue(distanceToBreakeven)}
                      </text>
                    ) : null}
                  </g>
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
    </div>
  );
}

function LegendPill({
  label,
  color,
  dashed = false,
}: {
  label: string;
  color: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-background-muted/80 px-3 py-2 text-xs text-foreground-muted">
      <span
        className={cn(
          "h-px w-4 border-t",
          color,
          dashed ? "border-dashed" : "border-solid",
        )}
      />
      <span>{label}</span>
    </div>
  );
}
