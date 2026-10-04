import { parseAnalysisCSV } from "@/lib/analysis-transfer";
import { buildExplorerPayload } from "@/lib/market-data/normalize";
import type { BatchHistoricalPriceResponse, HistoricalPriceSeries, MarketDataExplorerPayload } from "@/lib/market-data/types";
import { validateDraft, type PortfolioDraft } from "./portfolio-draft";

export type HistoryPreview = { data: MarketDataExplorerPayload; missing: { ticker: string; reason: string }[] };

function buildPreview(draft: PortfolioDraft, series: HistoricalPriceSeries[], missing: HistoryPreview["missing"], provider: string): HistoryPreview {
  if (!series.length) throw new Error("No hay series utilizables. Importá un histórico con al menos 3 fechas por activo.");
  const data = buildExplorerPayload({ period: draft.period, series, provider });
  if (data.points.length < 3) throw new Error("Se necesitan al menos 3 fechas comunes para calcular retornos y volatilidad.");
  data.meta.priceCurrency = draft.currency;
  return { data, missing };
}

export function previewProviderHistory(draft: PortfolioDraft, batch: BatchHistoricalPriceResponse): HistoryPreview {
  const { included } = validateDraft(draft);
  const missing: HistoryPreview["missing"] = [];
  const series: HistoricalPriceSeries[] = [];
  for (const position of included) {
    const symbol = draft.currency === "ARS" && !position.ticker.endsWith(".BA") ? `${position.ticker}.BA` : position.ticker;
    const result = batch.results[symbol];
    const prices = result?.prices ?? [];
    if (!result || result.metadata.currency !== draft.currency || prices.length < 3) {
      missing.push({ ticker: position.ticker, reason: !result ? "Sin histórico disponible" : result.metadata.currency !== draft.currency ? "Moneda histórica no confirmada" : "Menos de 3 fechas" });
      continue;
    }
    series.push({ ticker: position.ticker, points: prices.map(p => ({ date: p.date, close: p.adjustedClose ?? p.close })) });
  }
  const preview = buildPreview(draft, series, missing, "Yahoo");
  preview.data.meta.warnings = batch.warnings;
  return preview;
}

export function previewCSVHistory(raw: string, draft: PortfolioDraft): HistoryPreview {
  const validated = validateDraft(draft);
  const [header, ...rows] = parseAnalysisCSV(raw);
  if (header?.join(",") !== "date,ticker,close,currency,source" || !rows.length || rows.length > 100000) throw new Error("Usá date,ticker,close,currency,source, con hasta 100.000 filas.");
  const allTickers = new Set(validated.positions.map(p => p.ticker));
  const prices = new Map<string, Map<string, number>>();
  const sources = new Set<string>();
  for (const [index, row] of rows.entries()) {
    if (row.length !== 5) throw new Error(`Fila ${index + 2}: se esperan 5 columnas.`);
    const [date, symbol, close, currency, source] = row.map(cell => cell.trim());
    const ticker = symbol.toUpperCase();
    if (!allTickers.has(ticker)) throw new Error(`Ticker ajeno a la cartera: ${ticker}. Usá los mismos nombres de la tabla.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error(`Fila ${index + 2}: fecha inválida.`);
    if (currency !== draft.currency || !source || source.length > 500) throw new Error(`Fila ${index + 2}: moneda ${draft.currency} y fuente obligatorias.`);
    if (!/^\d+(\.\d+)?$/.test(close) || !Number.isFinite(Number(close)) || Number(close) <= 0) throw new Error(`Fila ${index + 2}: precio positivo con punto decimal.`);
    const points = prices.get(ticker) ?? new Map<string, number>();
    if (points.has(date)) throw new Error(`Fecha duplicada para ${ticker}: ${date}.`);
    points.set(date, Number(close)); prices.set(ticker, points); sources.add(source);
  }
  const missing: HistoryPreview["missing"] = [];
  const series: HistoricalPriceSeries[] = [];
  for (const p of validated.included) {
    const points = prices.get(p.ticker);
    if (!points || points.size < 3) { missing.push({ ticker: p.ticker, reason: "Sin al menos 3 fechas en el CSV" }); continue; }
    series.push({ ticker: p.ticker, points: [...points].sort(([a], [b]) => a.localeCompare(b)).map(([date, close]) => ({ date, close })) });
  }
  const preview = buildPreview(draft, series, missing, "CSV importado");
  preview.data.meta.priceSource = [...sources].join("; ");
  preview.data.meta.adjustMode = "user-supplied";
  return preview;
}

export function applyHistoryPreview(draft: PortfolioDraft, preview: HistoryPreview, acceptMissing: boolean) {
  const { included, total } = validateDraft(draft);
  if (preview.data.meta.priceCurrency !== draft.currency) throw new Error("La moneda del histórico no coincide con la cartera.");
  const covered = included.filter(p => preview.data.tickers.includes(p.ticker));
  if (preview.data.tickers.some(t => !included.some(p => p.ticker === t))) throw new Error("El histórico corresponde a otros activos.");
  if (covered.length !== included.length && !acceptMissing) throw new Error("Confirmá las exclusiones antes de aplicar la muestra parcial.");
  const coveredTotal = covered.reduce((sum, p) => sum + p.numericValue, 0);
  if (!coveredTotal) throw new Error("No hay posiciones con histórico aplicable.");
  return { weights: Object.fromEntries(covered.map(p => [p.ticker, p.numericValue / coveredTotal])), coverage: coveredTotal / total, excluded: included.filter(p => !preview.data.tickers.includes(p.ticker)).map(p => p.ticker), portfolioValue: draft.mode === "amount" ? coveredTotal : null };
}
