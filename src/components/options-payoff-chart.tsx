import type { BlackScholesInput } from "@/lib/finance/black-scholes";
import type { OptionPayoffPoint } from "@/lib/finance/option-payoff";

type OptionsPayoffChartProps = {
  data: OptionPayoffPoint[];
  inputs: BlackScholesInput;
  optionPrice: number;
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
  values: OptionPayoffPoint[],
  getX: (point: OptionPayoffPoint) => number,
  getY: (point: OptionPayoffPoint) => number,
): string {
  return values
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";

      return `${command}${getX(point).toFixed(2)},${getY(point).toFixed(2)}`;
    })
    .join(" ");
}

export function OptionsPayoffChart({
  data,
  inputs,
  optionPrice,
}: OptionsPayoffChartProps) {
  const xValues = data.map((point) => point.spot);
  const yValues = data.flatMap((point) => [point.payoff, point.profit, 0]);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMinRaw = Math.min(...yValues);
  const yMaxRaw = Math.max(...yValues);
  const yPadding = Math.max((yMaxRaw - yMinRaw) * 0.12, 1);
  const yMin = yMinRaw - yPadding;
  const yMax = yMaxRaw + yPadding;
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const scaleX = (value: number) =>
    PADDING.left + ((value - xMin) / (xMax - xMin)) * plotWidth;
  const scaleY = (value: number) =>
    PADDING.top + (1 - (value - yMin) / (yMax - yMin)) * plotHeight;

  const payoffPath = buildLinePath(data, (point) => scaleX(point.spot), (point) =>
    scaleY(point.payoff),
  );
  const profitPath = buildLinePath(data, (point) => scaleX(point.spot), (point) =>
    scaleY(point.profit),
  );

  const zeroY = scaleY(0);
  const strikeX = scaleX(inputs.strike);
  const spotX = scaleX(inputs.spot);
  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;

    return yMax - ratio * (yMax - yMin);
  });
  const xTicks = [xMin, inputs.strike, inputs.spot, xMax].filter(
    (value, index, values) =>
      values.findIndex((candidate) => Math.abs(candidate - value) < 0.001) === index,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-300" />
          <span>Payoff at expiry</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span>Profit at expiry</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-px w-4 border-t border-dashed border-amber-300" />
          <span>Strike</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-px w-4 border-t border-dashed border-slate-400" />
          <span>Current spot</span>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label="Option payoff and profit at expiry chart"
        >
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

          <path
            d={profitPath}
            fill="none"
            stroke="rgba(110, 231, 183, 0.95)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={payoffPath}
            fill="none"
            stroke="rgba(125, 211, 252, 0.95)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <circle
            cx={spotX}
            cy={scaleY(0 - optionPrice)}
            r="4.5"
            fill="rgba(110, 231, 183, 1)"
          />

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

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Premium paid
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {formatSeriesValue(optionPrice)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Strike level
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {formatSeriesValue(inputs.strike)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Current spot
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {formatSeriesValue(inputs.spot)}
          </p>
        </div>
      </div>
    </div>
  );
}
