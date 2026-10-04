import { buildPortfolioAnalytics } from "@/lib/finance/portfolio";
import { buildPortfolioRiskAnalysis } from "./portfolio-risk-analysis";
import type { MarketDataExplorerPayload } from "@/lib/market-data/types";
export function compareWorkspacePortfolio(data: MarketDataExplorerPayload, inputs: Record<string, string>, portfolioValue: number | null) {
  if (Object.keys(inputs).length !== data.tickers.length || Object.keys(inputs).some(t => !data.tickers.includes(t))) throw new Error("La propuesta debe usar los mismos activos cubiertos.");
  const values = data.tickers.map(t => {
    const raw = inputs[t]?.trim().replace(",", ".");
    if (!raw || !/^\d+(\.\d+)?$/.test(raw) || !Number.isFinite(Number(raw))) throw new Error(`Peso inválido: ${t}. Usá valores entre 0 y 100.`);
    const v = Number(raw); if (v > 100) throw new Error(`Peso fuera de rango: ${t}.`); return v;
  });
  if (Math.abs(values.reduce((s,v)=>s+v,0)-100) > 1e-6) throw new Error("Los pesos propuestos deben sumar 100%.");
  const weights = Object.fromEntries(data.tickers.map((t,i)=>[t,values[i]/100]));
  const portfolio = buildPortfolioAnalytics({data,weights});
  const risk = buildPortfolioRiskAnalysis({data,tickers:portfolio.tickers,weights,portfolioDailyReturns:portfolio.dailyReturns,portfolioNavPoints:portfolio.points,portfolioValue:portfolioValue ?? undefined});
  return {weights,portfolio,risk};
}
