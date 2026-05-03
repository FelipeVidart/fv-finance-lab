import { calculateAnnualizedVolatility } from "@/lib/finance/metrics";
import type {
  PortfolioMetrics,
  PortfolioPerformancePoint,
} from "@/lib/finance/portfolio/types";

const TRADING_DAYS_PER_YEAR = 252;

export function calculatePortfolioMetrics(input: {
  performancePoints: PortfolioPerformancePoint[];
  dailyReturns: number[];
  maxDrawdown: number;
  riskFreeRate?: number;
}): PortfolioMetrics {
  const riskFreeRate = input.riskFreeRate ?? 0;
  const firstPoint = input.performancePoints[0];
  const lastPoint = input.performancePoints[input.performancePoints.length - 1];
  const initialBalance = firstPoint?.balance ?? 0;
  const finalBalance = lastPoint?.balance ?? 0;
  const cumulativeReturn =
    initialBalance > 0 ? finalBalance / initialBalance - 1 : 0;
  const periods = input.dailyReturns.length;
  const cagr =
    initialBalance > 0 && finalBalance > 0 && periods > 0
      ? (finalBalance / initialBalance) ** (TRADING_DAYS_PER_YEAR / periods) - 1
      : 0;
  const annualizedVolatility = calculateAnnualizedVolatility(
    input.dailyReturns,
    TRADING_DAYS_PER_YEAR,
  );
  const excessReturn = cagr - riskFreeRate;
  const sharpeRatio =
    annualizedVolatility > 0 ? excessReturn / annualizedVolatility : 0;
  const downsideVolatility = calculateDownsideVolatility(input.dailyReturns);
  const sortinoRatio =
    downsideVolatility > 0 ? excessReturn / downsideVolatility : 0;
  const yearlyReturns = calculateYearlyReturns(input.performancePoints);

  return {
    initialBalance,
    finalBalance,
    cumulativeReturn,
    cagr,
    annualizedVolatility,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown: input.maxDrawdown,
    bestYear: findExtremeYear(yearlyReturns, "best"),
    worstYear: findExtremeYear(yearlyReturns, "worst"),
  };
}

function calculateDownsideVolatility(dailyReturns: number[]): number {
  const downsideReturns = dailyReturns.filter((value) => value < 0);

  if (downsideReturns.length < 2) {
    return 0;
  }

  const downsideDeviation = Math.sqrt(
    downsideReturns.reduce((sum, value) => sum + value ** 2, 0) /
      (downsideReturns.length - 1),
  );

  return downsideDeviation * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

function calculateYearlyReturns(
  points: PortfolioPerformancePoint[],
): Array<{ year: string; return: number }> {
  const grouped = new Map<
    string,
    { firstBalance: number; lastBalance: number }
  >();

  for (const point of points) {
    const year = point.date.slice(0, 4);
    const current = grouped.get(year);

    if (!current) {
      grouped.set(year, {
        firstBalance: point.balance,
        lastBalance: point.balance,
      });
      continue;
    }

    current.lastBalance = point.balance;
  }

  return [...grouped.entries()]
    .map(([year, value]) => ({
      year,
      return:
        value.firstBalance > 0
          ? value.lastBalance / value.firstBalance - 1
          : 0,
    }))
    .filter((entry) => Number.isFinite(entry.return));
}

function findExtremeYear(
  yearlyReturns: Array<{ year: string; return: number }>,
  mode: "best" | "worst",
) {
  if (yearlyReturns.length === 0) {
    return null;
  }

  return yearlyReturns.reduce((selected, entry) => {
    if (mode === "best") {
      return entry.return > selected.return ? entry : selected;
    }

    return entry.return < selected.return ? entry : selected;
  }, yearlyReturns[0]);
}
