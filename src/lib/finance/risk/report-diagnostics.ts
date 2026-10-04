import { calculateAnnualizedVolatility } from "@/lib/finance/metrics";
import { calculateDrawdownSeries } from "@/lib/finance/drawdown";
import { calculateDailyReturns } from "@/lib/finance/returns";
import { buildDrawdownAnalysis } from "@/lib/finance/portfolio/drawdown-periods";
import type { PortfolioAnalytics } from "@/lib/finance/portfolio";
import type { MarketDataExplorerPayload } from "@/lib/market-data/types";

export function buildReportDiagnostics(data: MarketDataExplorerPayload, portfolio: PortfolioAnalytics) {
  const tickers = portfolio.tickers;
  const returns = tickers.map(t => calculateDailyReturns(data.points.map(p => p.prices[t])));
  const correlation = returns.map(a => returns.map(b => {
    const n = a.length;
    if (n < 2 || n !== b.length) return null;
    const ma = a.reduce((s, v) => s + v, 0) / n, mb = b.reduce((s, v) => s + v, 0) / n;
    let ab = 0, aa = 0, bb = 0;
    for (let i = 0; i < n; i++) { ab += (a[i] - ma) * (b[i] - mb); aa += (a[i] - ma) ** 2; bb += (b[i] - mb) ** 2; }
    return aa > 0 && bb > 0 ? Math.max(-1, Math.min(1, ab / Math.sqrt(aa * bb))) : null;
  }));
  const values = portfolio.dailyReturns.filter(Number.isFinite);
  const min = Math.min(...values), max = Math.max(...values);
  const count = 16, span = max - min || .002, start = min === max ? min - span / 2 : min;
  const histogram = Array.from({ length: count }, (_, i) => ({ low: start + i * span / count, high: start + (i + 1) * span / count, count: 0 }));
  for (const v of values) histogram[Math.min(count - 1, Math.max(0, Math.floor((v - start) / span * count)))].count++;
  const drawdowns = buildDrawdownAnalysis(portfolio.points.map(p => ({ date: p.date, balance: p.nav, drawdown: p.drawdown, dailyReturn: 0, cumulativeReturn: p.nav / 100 - 1 })), 3);
  const assets = tickers.map((ticker, i) => {
    const prices = data.points.map(p => p.prices[ticker]);
    return { ticker, totalReturn: prices.at(-1)! / prices[0] - 1, annualizedVolatility: calculateAnnualizedVolatility(returns[i]), maxDrawdown: Math.min(...calculateDrawdownSeries(prices)) };
  });
  return { tickers, correlation, histogram, drawdowns, assets };
}
