import { buildFactorGradVarAnalysis } from "@/lib/finance/risk/factor-gradvar";
import type { MarketDataExplorerPayload } from "@/lib/market-data/types";
export type WorkspaceFactorReport = {
  status: "loading" | "ready" | "unavailable";
  reason?: string;
  rows?: { ticker: string; value: number; proxy: string; exposure: number }[];
  observations?: number; start?: string; end?: string; rSquared?: number | null;
  annualizedVolatility?: number; valueAtRisk?: number; warnings?: string[];
};
const names: Record<string, string> = { "global-equity": "Acciones globales", "argentina-equity": "Argentina", "growth-technology": "Growth / tecnología", "long-duration-rates": "Tasas / larga duración", "credit-risk-appetite": "Crédito / apetito de riesgo", "usd-fx": "Dólar global", "gold-real-asset": "Oro" };
export function buildWorkspaceFactorReport(assetData: MarketDataExplorerPayload, factorData: MarketDataExplorerPayload, weights: Record<string, number>, portfolioDailyReturns: number[]): WorkspaceFactorReport {
  if (factorData.meta.priceCurrency !== "USD") throw new Error("Los proxies deben tener moneda USD confirmada.");
  const dates = new Set(assetData.points.map(p => p.date));
  // Resample proxy prices to the asset calendar. The engine rejects intervals
  // whose starting date differs; it never pairs one-day and multi-day returns.
  const resampled = { ...factorData, points: factorData.points.filter(p => dates.has(p.date)) };
  const a = buildFactorGradVarAnalysis({ assetData, factorData: resampled, tickers: assetData.tickers, weights, portfolioDailyReturns, confidenceLevel: .95 });
  return { status: "ready", rows: a.factorAttribution.map(r => ({ ticker: names[r.factorId] ?? r.factorName, value: r.contributionShare, proxy: r.proxyTicker, exposure: r.exposure })), observations: a.observations, start: a.startDate ?? undefined, end: a.endDate ?? undefined, rSquared: a.portfolioRegression?.rSquared ?? null, annualizedVolatility: a.annualizedVolatility, valueAtRisk: a.valueAtRisk, warnings: ["Regresión histórica con intercepto y proxies ETF en USD. VaR paramétrico normal, diario al 95%; no es el VaR histórico de toda la cartera.", "Los porcentajes de factores se refieren al riesgo explicado por el modelo. El residuo queda fuera de esa atribución; R² mide ajuste en la muestra, no capacidad predictiva.", ...(assetData.meta.priceCurrency === "ARS" ? ["La variable analizada está en ARS y los proxies en USD. No se convierten los precios. UUP mide el dólar global, no CCL/MEP; el riesgo cambiario argentino y otros riesgos pueden quedar en el residuo o mezclarse con los proxies."] : []), "Proxies correlacionados: las contribuciones dependen del conjunto elegido y de la ventana. No son factores económicos puros.", ...(a.assetRegressions.some(r=>r.ridgePenalty>0) ? ["Se utilizó regularización por colinealidad. Interpretar las exposiciones con cautela."] : [])] };
}
