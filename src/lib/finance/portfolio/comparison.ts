import { buildPortfolioDrawdownPoints } from "@/lib/finance/portfolio/drawdowns";
import { calculatePortfolioMetrics } from "@/lib/finance/portfolio/metrics";
import { PORTFOLIO_PRESETS } from "@/lib/finance/portfolio/presets";
import {
  DEFAULT_REBALANCING_STRATEGY,
  simulatePortfolioRebalancing,
} from "@/lib/finance/portfolio/rebalancing";
import { validatePortfolioInputs } from "@/lib/finance/portfolio/returns";
import type {
  PortfolioAssetInput,
  PortfolioDrawdownPoint,
  PortfolioPerformancePoint,
  RebalancingStrategyConfig,
} from "@/lib/finance/portfolio/types";
import type { MarketDataExplorerPayload, MarketDataPeriod } from "@/lib/market-data/types";

export type PortfolioComparisonPresetId =
  | "conservative"
  | "balanced"
  | "aggressive";

export type PredefinedPortfolioComparisonPreset = {
  id: PortfolioComparisonPresetId;
  label: string;
  sourcePresetId: string;
  sourcePresetName: string;
  name: string;
  description: string;
  holdings: PortfolioAssetInput[];
  validation: {
    isValid: boolean;
    totalWeight: number;
    error?: string;
  };
};

export type PortfolioComparisonMetrics = {
  cumulativeReturn: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  historicalVar95: number;
  historicalExpectedShortfall95: number;
};

export type PortfolioComparisonPortfolioResult = {
  id: PortfolioComparisonPresetId;
  label: string;
  name: string;
  description: string;
  holdings: PortfolioAssetInput[];
  metrics: PortfolioComparisonMetrics;
  performancePoints: PortfolioPerformancePoint[];
  drawdownPoints: PortfolioDrawdownPoint[];
  dailyReturns: number[];
};

export type PortfolioComparisonSeries = {
  dates: string[];
  series: Array<{
    portfolioId: PortfolioComparisonPresetId;
    label: string;
    values: number[];
  }>;
};

export type PortfolioComparisonResult = {
  period: MarketDataPeriod;
  provider: string;
  commonStartDate: string;
  commonEndDate: string;
  observations: number;
  tickers: string[];
  strategy: RebalancingStrategyConfig;
  portfolios: PortfolioComparisonPortfolioResult[];
  cumulativePerformance: PortfolioComparisonSeries;
  drawdowns: PortfolioComparisonSeries;
  providerWarnings: MarketDataExplorerPayload["meta"]["warnings"];
  providerCache: MarketDataExplorerPayload["meta"]["cache"];
};

export const DEFAULT_PORTFOLIO_COMPARISON_PERIOD: MarketDataPeriod = "1Y";
export const DEFAULT_PORTFOLIO_COMPARISON_INITIAL_CAPITAL = 100000;
export const DEFAULT_PORTFOLIO_COMPARISON_STRATEGY: RebalancingStrategyConfig = {
  id: DEFAULT_REBALANCING_STRATEGY,
};

export const DEFAULT_PORTFOLIO_COMPARISON_PRESET_IDS = [
  "conservative",
  "balanced",
  "aggressive",
] satisfies PortfolioComparisonPresetId[];

const COMPARISON_PRESET_MAPPINGS: Array<{
  id: PortfolioComparisonPresetId;
  label: string;
  sourcePresetId: string;
}> = [
  {
    id: "conservative",
    label: "Conservative",
    sourcePresetId: "conservative-income",
  },
  {
    id: "balanced",
    label: "Balanced",
    sourcePresetId: "balanced-60-40",
  },
  {
    id: "aggressive",
    label: "Aggressive",
    sourcePresetId: "aggressive-growth",
  },
];

export function getPredefinedPortfolioComparisonPresets(
  presetIds: PortfolioComparisonPresetId[] = DEFAULT_PORTFOLIO_COMPARISON_PRESET_IDS,
): PredefinedPortfolioComparisonPreset[] {
  return presetIds.map((presetId) => {
    const mapping = resolvePresetMapping(presetId);
    const sourcePreset = resolveSourcePreset(mapping.sourcePresetId);
    const validation = validatePortfolioInputs({
      initialCapital: sourcePreset.initialCapital,
      assets: sourcePreset.holdings,
    });

    return {
      id: mapping.id,
      label: mapping.label,
      sourcePresetId: sourcePreset.id,
      sourcePresetName: sourcePreset.name,
      name: sourcePreset.name,
      description: sourcePreset.description,
      holdings: sourcePreset.holdings,
      validation: validation.isValid
        ? {
            isValid: true,
            totalWeight: validation.totalWeight,
          }
        : {
            isValid: false,
            totalWeight: validation.totalWeight,
            error: validation.error,
          },
    };
  });
}

export function getPortfolioComparisonTickers(
  presetIds: PortfolioComparisonPresetId[] = DEFAULT_PORTFOLIO_COMPARISON_PRESET_IDS,
): string[] {
  const presets = getPredefinedPortfolioComparisonPresets(presetIds);

  return [
    ...new Set(
      presets.flatMap((preset) =>
        preset.holdings.map((holding) => holding.ticker.trim().toUpperCase()),
      ),
    ),
  ];
}

export function buildPortfolioComparison(input: {
  data: MarketDataExplorerPayload;
  presetIds?: PortfolioComparisonPresetId[];
  initialCapital?: number;
  strategy?: RebalancingStrategyConfig;
  riskFreeRate?: number;
}): PortfolioComparisonResult {
  const presetIds =
    input.presetIds ?? DEFAULT_PORTFOLIO_COMPARISON_PRESET_IDS;
  const initialCapital =
    input.initialCapital ?? DEFAULT_PORTFOLIO_COMPARISON_INITIAL_CAPITAL;
  const strategy = input.strategy ?? DEFAULT_PORTFOLIO_COMPARISON_STRATEGY;
  const riskFreeRate = input.riskFreeRate ?? 0;
  const dates = input.data.points.map((point) => point.date);

  if (input.data.points.length < 3) {
    throw new Error(
      "Not enough overlapping market data was found for portfolio comparison.",
    );
  }

  const portfolios = getPredefinedPortfolioComparisonPresets(presetIds).map(
    (preset) => {
      const validation = validatePortfolioInputs({
        initialCapital,
        assets: preset.holdings,
      });

      if (!validation.isValid) {
        throw new Error(`${preset.label} portfolio is invalid: ${validation.error}`);
      }

      const simulation = simulatePortfolioRebalancing({
        data: input.data,
        assets: validation.assets,
        initialCapital,
        strategy,
      });
      const drawdownPoints = buildPortfolioDrawdownPoints(
        simulation.performancePoints,
      );
      const maxDrawdown = drawdownPoints.reduce(
        (minimum, point) => Math.min(minimum, point.drawdown),
        0,
      );
      const metrics = calculatePortfolioMetrics({
        performancePoints: simulation.performancePoints,
        dailyReturns: simulation.dailyReturns,
        maxDrawdown,
        riskFreeRate,
      });
      const tailRisk = calculateHistoricalTailRisk95(simulation.dailyReturns);

      return {
        id: preset.id,
        label: preset.label,
        name: preset.name,
        description: preset.description,
        holdings: validation.assets,
        metrics: {
          cumulativeReturn: metrics.cumulativeReturn,
          annualizedReturn: metrics.cagr,
          annualizedVolatility: metrics.annualizedVolatility,
          sharpeRatio: metrics.sharpeRatio,
          maxDrawdown: metrics.maxDrawdown,
          historicalVar95: tailRisk.var95,
          historicalExpectedShortfall95: tailRisk.expectedShortfall95,
        },
        performancePoints: simulation.performancePoints,
        drawdownPoints,
        dailyReturns: simulation.dailyReturns,
      };
    },
  );

  return {
    period: input.data.period,
    provider: input.data.meta.provider,
    commonStartDate: input.data.meta.commonStartDate,
    commonEndDate: input.data.meta.commonEndDate,
    observations: input.data.meta.observations,
    tickers: getPortfolioComparisonTickers(presetIds),
    strategy,
    portfolios,
    cumulativePerformance: {
      dates,
      series: portfolios.map((portfolio) => ({
        portfolioId: portfolio.id,
        label: portfolio.label,
        values: portfolio.performancePoints.map((point) => point.cumulativeReturn),
      })),
    },
    drawdowns: {
      dates,
      series: portfolios.map((portfolio) => ({
        portfolioId: portfolio.id,
        label: portfolio.label,
        values: portfolio.drawdownPoints.map((point) => point.drawdown),
      })),
    },
    providerWarnings: input.data.meta.warnings,
    providerCache: input.data.meta.cache,
  };
}

export function calculateHistoricalTailRisk95(dailyReturns: number[]): {
  var95: number;
  expectedShortfall95: number;
} {
  const sortedReturns = dailyReturns.filter((value) => Number.isFinite(value));

  sortedReturns.sort((a, b) => a - b);

  if (sortedReturns.length === 0) {
    return {
      var95: 0,
      expectedShortfall95: 0,
    };
  }

  const tailCount = Math.max(1, Math.ceil(sortedReturns.length * 0.05));
  const tailReturns = sortedReturns.slice(0, tailCount);
  const varReturn = tailReturns[tailReturns.length - 1] ?? 0;
  const expectedShortfallReturn =
    tailReturns.reduce((sum, value) => sum + value, 0) / tailReturns.length;

  return {
    var95: Math.max(0, -varReturn),
    expectedShortfall95: Math.max(0, -expectedShortfallReturn),
  };
}

function resolvePresetMapping(presetId: PortfolioComparisonPresetId) {
  const mapping = COMPARISON_PRESET_MAPPINGS.find(
    (entry) => entry.id === presetId,
  );

  if (!mapping) {
    throw new Error(`Unknown comparison portfolio: ${presetId}.`);
  }

  return mapping;
}

function resolveSourcePreset(sourcePresetId: string) {
  const preset = PORTFOLIO_PRESETS.find((entry) => entry.id === sourcePresetId);

  if (!preset) {
    throw new Error(`Missing source portfolio preset: ${sourcePresetId}.`);
  }

  return preset;
}
