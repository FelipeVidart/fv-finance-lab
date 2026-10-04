import type { PortfolioAnalytics } from "@/lib/finance/portfolio";
import type { PortfolioRiskAnalysis } from "@/lib/finance/risk/types";
import type { applyHistoryPreview, HistoryPreview } from "@/lib/workspace/history-preview";
import type { PortfolioDraft } from "@/lib/workspace/portfolio-draft";

export const CHART_COLORS = ["#248c7c", "#5688b5", "#ba8a40", "#a779aa", "#6b98a0", "#b96961"];
export const formatPercent = (n: number) => `${(n * 100).toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;
export type ExportChart = {
  id: "composicion" | "riesgo" | "evolucion" | "drawdown";
  title: string;
  unit: string;
  rows?: { ticker: string; value: number }[];
  points?: { date: string; value: number }[];
  available: boolean;
};
export type ChartBundle = {
  name: string; currency: string; start: string; end: string; coverage: number;
  source: string; excluded: string[]; missing: string[]; observations: number;
  warnings: string[]; charts: ExportChart[];
};
export function buildChartBundle(applied: ReturnType<typeof applyHistoryPreview> & { preview: HistoryPreview; portfolio: PortfolioAnalytics }, draft: PortfolioDraft, risk: PortfolioRiskAnalysis): ChartBundle {
  return {
    name: draft.name || "Mi cartera", currency: draft.currency,
    start: applied.preview.data.meta.commonStartDate, end: applied.preview.data.meta.commonEndDate,
    coverage: applied.coverage, source: applied.preview.data.meta.priceSource ?? applied.preview.data.meta.provider,
    excluded: [...new Set([...draft.positions.filter(p => p.excluded || p.kind === "money-market").map(p => p.ticker), ...applied.excluded])],
    missing: [...applied.excluded], observations: applied.portfolio.dailyReturns.length,
    warnings: (applied.preview.data.meta.warnings ?? []).map(w => w.message),
    charts: [
      { id: "composicion", title: "Composición de la cartera", unit: "% del valor analizado", available: true, rows: applied.portfolio.tickers.map(ticker => ({ ticker, value: applied.weights[ticker] })) },
      { id: "riesgo", title: "Aporte al riesgo", unit: "% de la volatilidad", available: risk.riskContribution.some(r => r.contributionToVolatility !== 0), rows: risk.riskContribution.map(r => ({ ticker: r.ticker, value: r.percentContributionToVolatility })) },
      { id: "evolucion", title: "Evolución de la cartera", unit: "Índice · base 100", available: true, points: applied.portfolio.points.map(p => ({ date: p.date, value: p.nav })) },
      { id: "drawdown", title: "Drawdown", unit: "Caída desde el máximo previo (%)", available: true, points: applied.portfolio.points.map(p => ({ date: p.date, value: p.drawdown })) },
    ],
  };
}
export function exportStem(bundle: ChartBundle) {
  const alias = bundle.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "cartera";
  return `${alias}-${bundle.currency.toLowerCase()}-${bundle.start}-${bundle.end}`;
}
export function exportNotes(bundle: ChartBundle, generatedAt: string): string[] {
  return [
    `Generado: ${generatedAt} · ${bundle.observations} retornos diarios comunes.`,
    ...(bundle.missing.length ? [`MUESTRA PARCIAL: cobertura ${formatPercent(bundle.coverage)}. Sin histórico: ${bundle.missing.join(", ")}. Pesos normalizados sobre la muestra cubierta.`] : []),
    ...(bundle.observations < 20 ? ["Muestra corta: las estimaciones de riesgo son poco representativas."] : []),
    "Simulación con pesos constantes y rebalanceo diario. Evolución base 100; no es el rendimiento de una cuenta con operaciones o flujos.",
    "Volatilidad por covarianza muestral anualizada a 252 ruedas. Los aportes negativos reducen la volatilidad de esta combinación.",
    "Sin conversión de moneda, comisiones ni relleno de fechas. La serie disponible no garantiza retorno total por dividendos ni ajustes.",
    `Excluidos: ${bundle.excluded.join(", ") || "ninguno"}.`,
    `Fuente: ${bundle.source}.`, ...bundle.warnings.map(w => `Aviso de datos: ${w}`),
  ];
}
