import { calculateDailyReturns } from "@/lib/finance/returns";
import { calculateEwmaVolatilitySeries } from "@/lib/finance/risk/ewma";
import { calculateRiskContribution } from "@/lib/finance/risk/risk-contribution";
import { calculateDescriptiveStatistics } from "@/lib/finance/risk/statistics";
import { calculateTailRiskMetrics } from "@/lib/finance/risk/tail-risk";
import {
  TRADING_DAYS_PER_YEAR,
  type DatedRiskPoint,
  type DrawdownSummary,
  type PortfolioRiskAnalysis,
  type PortfolioRiskAnalysisInput,
} from "@/lib/finance/risk/types";

const DEFAULT_CONFIDENCE_LEVEL = 0.95;
const DEFAULT_EWMA_LAMBDA = 0.94;
const DEFAULT_ROLLING_WINDOW_DAYS = 21;
const MINIMUM_TAIL_RISK_OBSERVATIONS = 20;

export function buildPortfolioRiskAnalysis(
  input: PortfolioRiskAnalysisInput,
): PortfolioRiskAnalysis {
  const confidenceLevel = input.confidenceLevel ?? DEFAULT_CONFIDENCE_LEVEL;
  const ewmaLambda = input.ewmaLambda ?? DEFAULT_EWMA_LAMBDA;
  const rollingWindowDays =
    input.rollingWindowDays ?? DEFAULT_ROLLING_WINDOW_DAYS;
  const returnDates = input.data.points.slice(1).map((point) => point.date);
  const alignedLength = Math.min(
    input.portfolioDailyReturns.length,
    returnDates.length,
  );
  const portfolioDailyReturns = input.portfolioDailyReturns
    .slice(0, alignedLength)
    .filter((value) => Number.isFinite(value));
  const alignedReturnDates = returnDates.slice(0, portfolioDailyReturns.length);

  if (portfolioDailyReturns.length < 2) {
    throw new Error("At least two portfolio return observations are required.");
  }

  const warnings = buildMethodologyWarnings({
    observations: portfolioDailyReturns.length,
    rollingWindowDays,
    sourceReturns: input.portfolioDailyReturns,
    returnDates,
  });
  const ewma = calculateEwmaVolatilitySeries({
    returns: portfolioDailyReturns,
    dates: alignedReturnDates,
    lambda: ewmaLambda,
  });
  const latestEwmaVolatility =
    ewma.volatility[ewma.volatility.length - 1]?.value;
  const assetReturnSeries = buildAssetReturnSeries(input);

  return {
    descriptiveStats: calculateDescriptiveStatistics(portfolioDailyReturns),
    tailRisk: calculateTailRiskMetrics({
      returns: portfolioDailyReturns,
      confidenceLevel,
      volatility: latestEwmaVolatility,
    }),
    ewmaVolatilitySeries: ewma.volatility,
    rollingVolatilitySeries: calculateRollingAnnualizedVolatility({
      returns: portfolioDailyReturns,
      dates: alignedReturnDates,
      windowDays: rollingWindowDays,
    }),
    drawdownSummary: summarizeDrawdowns(input.portfolioNavPoints),
    riskContribution: calculateRiskContribution({
      tickers: input.tickers,
      weights: input.weights,
      returnSeries: assetReturnSeries,
    }),
    methodology: {
      confidenceLevel,
      ewmaLambda,
      observations: portfolioDailyReturns.length,
      startDate: alignedReturnDates[0] ?? null,
      endDate: alignedReturnDates[alignedReturnDates.length - 1] ?? null,
      rollingWindowDays,
      warnings,
    },
  };
}

export function calculateRollingAnnualizedVolatility(input: {
  returns: number[];
  dates: string[];
  windowDays?: number;
}): DatedRiskPoint[] {
  const windowDays = input.windowDays ?? DEFAULT_ROLLING_WINDOW_DAYS;

  if (!Number.isFinite(windowDays) || windowDays < 2) {
    throw new Error("Rolling volatility window must be at least two days.");
  }

  const cleanRows = input.returns
    .map((dailyReturn, index) => ({
      date: input.dates[index],
      dailyReturn,
    }))
    .filter((row) => row.date && Number.isFinite(row.dailyReturn));

  if (cleanRows.length < windowDays) {
    return [];
  }

  return cleanRows.slice(windowDays - 1).map((row, rowIndex) => {
    const windowReturns = cleanRows
      .slice(rowIndex, rowIndex + windowDays)
      .map((entry) => entry.dailyReturn);

    return {
      date: row.date,
      value: calculateSampleVolatility(windowReturns) *
        Math.sqrt(TRADING_DAYS_PER_YEAR),
    };
  });
}

function buildAssetReturnSeries(
  input: PortfolioRiskAnalysisInput,
): Record<string, number[]> {
  return Object.fromEntries(
    input.tickers.map((ticker) => [
      ticker,
      calculateDailyReturns(input.data.points.map((point) => point.prices[ticker])),
    ]),
  );
}

function summarizeDrawdowns(points: PortfolioRiskAnalysisInput["portfolioNavPoints"]): DrawdownSummary {
  if (points.length === 0) {
    return {
      maxDrawdown: 0,
      startDate: null,
      troughDate: null,
      endDate: null,
      currentDrawdown: 0,
    };
  }

  let runningPeakNav = points[0].nav;
  let runningPeakDate = points[0].date;
  let maxDrawdown = 0;
  let drawdownStartDate: string | null = null;
  let troughDate: string | null = null;
  let peakNavAtMaxDrawdown = points[0].nav;

  points.forEach((point) => {
    if (point.nav > runningPeakNav) {
      runningPeakNav = point.nav;
      runningPeakDate = point.date;
    }

    if (point.drawdown < maxDrawdown) {
      maxDrawdown = point.drawdown;
      drawdownStartDate = runningPeakDate;
      troughDate = point.date;
      peakNavAtMaxDrawdown = runningPeakNav;
    }
  });

  const troughIndex = troughDate
    ? points.findIndex((point) => point.date === troughDate)
    : -1;
  const recoveryPoint =
    troughIndex >= 0
      ? points
          .slice(troughIndex + 1)
          .find((point) => point.nav >= peakNavAtMaxDrawdown)
      : undefined;
  const latestPoint = points[points.length - 1];

  return {
    maxDrawdown,
    startDate: drawdownStartDate,
    troughDate,
    endDate: recoveryPoint?.date ?? null,
    currentDrawdown: latestPoint.drawdown,
  };
}

function buildMethodologyWarnings(input: {
  observations: number;
  rollingWindowDays: number;
  sourceReturns: number[];
  returnDates: string[];
}): string[] {
  const warnings: string[] = [];

  if (input.observations < MINIMUM_TAIL_RISK_OBSERVATIONS) {
    warnings.push(
      `Only ${input.observations} daily return observations are available; tail risk estimates are sample-limited.`,
    );
  }

  if (input.observations < input.rollingWindowDays) {
    warnings.push(
      `Rolling volatility requires at least ${input.rollingWindowDays} daily return observations.`,
    );
  }

  if (input.sourceReturns.length !== input.returnDates.length) {
    warnings.push(
      "Portfolio return and market-data date counts differ; risk analysis uses the shared overlapping portion.",
    );
  }

  return warnings;
}

function calculateSampleVolatility(values: number[]): number {
  const cleanValues = values.filter((value) => Number.isFinite(value));

  if (cleanValues.length < 2) {
    return 0;
  }

  const average =
    cleanValues.reduce((sum, value) => sum + value, 0) / cleanValues.length;
  const variance =
    cleanValues.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    (cleanValues.length - 1);

  return Math.sqrt(Math.max(variance, 0));
}
