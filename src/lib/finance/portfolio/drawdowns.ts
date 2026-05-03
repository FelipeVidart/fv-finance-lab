import { calculateDrawdownSeries } from "@/lib/finance/drawdown";
import type {
  PortfolioDrawdownPoint,
  PortfolioPerformancePoint,
} from "@/lib/finance/portfolio/types";

export function buildPortfolioDrawdownPoints(
  performancePoints: PortfolioPerformancePoint[],
): PortfolioDrawdownPoint[] {
  const drawdowns = calculateDrawdownSeries(
    performancePoints.map((point) => point.balance),
  );

  return performancePoints.map((point, index) => ({
    date: point.date,
    drawdown: drawdowns[index],
  }));
}
