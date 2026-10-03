import { parseAnalysisCSV } from "@/lib/analysis-transfer";
import { MAX_RISK_TICKERS, parseTickerInput } from "@/lib/market-data/request";
import type { MarketDataPeriod } from "@/lib/market-data/types";

export type Position = { id: number; ticker: string; value: string; kind: "investment" | "money-market"; excluded: boolean };
export type PortfolioDraft = { name: string; currency: "ARS" | "USD"; mode: "amount" | "weight"; period: MarketDataPeriod; positions: Position[] };
export const WORKSPACE_DRAFT_KEY = "fv-workspace-draft-v1";
export const POSITIONS_TEMPLATE = "ticker,value,kind\nSPY,50,investment\nEFA,25,investment\nGDX,15,investment\nNVDA,10,investment\n";
export const EMPTY_DRAFT: PortfolioDraft = { name: "Mi cartera", currency: "ARS", mode: "amount", period: "6M", positions: [{ id: 0, ticker: "", value: "", kind: "investment", excluded: false }] };

export function parsePositionValue(value: string): number {
  // Accept a decimal comma or point; never guess a thousands separator.
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized) || !Number.isFinite(Number(normalized)) || Number(normalized) <= 0) {
    throw new Error("Ingresá valores positivos sin separadores de miles; podés usar coma o punto decimal.");
  }
  return Number(normalized);
}

export function validateDraft(draft: PortfolioDraft) {
  if (!draft.positions.length || draft.positions.length > MAX_RISK_TICKERS) throw new Error("Ingresá entre 1 y 30 posiciones.");
  const seen = new Set<string>();
  const sourceSymbols = new Set<string>();
  const positions = draft.positions.map(position => {
    const ticker = position.ticker.trim().toUpperCase();
    const parsed = parseTickerInput(ticker, { maxTickers: 1 });
    if (!parsed.tickers || parsed.tickers[0] !== ticker) throw new Error(`Ticker inválido: ${ticker || "fila vacía"}.`);
    if (seen.has(ticker)) throw new Error(`Ticker repetido: ${ticker}. Consolidá sus importes en una fila.`);
    seen.add(ticker);
    const sourceSymbol = draft.currency === "ARS" ? ticker.replace(/\.BA$/, "") : ticker;
    if (sourceSymbols.has(sourceSymbol)) throw new Error(`Activo repetido con y sin .BA: ${sourceSymbol}. Usá una sola fila.`);
    sourceSymbols.add(sourceSymbol);
    return { ...position, ticker, numericValue: parsePositionValue(position.value) };
  });
  const included = positions.filter(position => position.kind !== "money-market" && !position.excluded);
  if (!included.length) throw new Error("La cartera debe incluir al menos un activo de inversión.");
  const total = included.reduce((sum, position) => sum + position.numericValue, 0);
  if (!Number.isFinite(total)) throw new Error("El total excede el rango permitido.");
  if (draft.mode === "weight" && Math.abs(total - 100) > 0.01) throw new Error(`Los pesos incluidos suman ${total.toFixed(2)}%; deben sumar 100%.`);
  return { positions, included, total, weights: Object.fromEntries(included.map(position => [position.ticker, position.numericValue / total])) };
}

export function importPositionsCSV(raw: string): Position[] {
  const [header, ...rows] = parseAnalysisCSV(raw);
  if (header?.map(value => value.trim()).join(",") !== "ticker,value,kind" || !rows.length || rows.length > MAX_RISK_TICKERS) throw new Error("Usá la plantilla ticker,value,kind con 1 a 30 posiciones.");
  const positions = rows.map((row, id) => {
    if (row.length !== 3) throw new Error(`Fila ${id + 2}: se esperan 3 columnas.`);
    const [ticker, value, kind] = row.map(cell => cell.trim());
    if (kind !== "investment" && kind !== "money-market") throw new Error(`Fila ${id + 2}: kind debe ser investment o money-market.`);
    // BCMMA is the known cash holding from this workflow, not a generic fund classifier.
    const cash = kind === "money-market" || ticker.toUpperCase().replace(/\.BA$/, "") === "BCMMA";
    return { id, ticker: ticker.toUpperCase(), value, kind: cash ? "money-market" as const : "investment" as const, excluded: false };
  });
  validateDraft({ ...EMPTY_DRAFT, positions });
  return positions;
}

export function isPortfolioDraft(value: unknown): value is PortfolioDraft {
  if (!value || typeof value !== "object") return false;
  const d = value as PortfolioDraft;
  return typeof d.name === "string" && d.name.length <= 100 && ["ARS", "USD"].includes(d.currency) && ["amount", "weight"].includes(d.mode) && ["1M", "3M", "6M", "1Y"].includes(d.period) && Array.isArray(d.positions) && d.positions.length <= 30 &&
    d.positions.every(p => p && Number.isSafeInteger(p.id) && p.id >= 0 && typeof p.ticker === "string" && p.ticker.length <= 10 && typeof p.value === "string" && p.value.length <= 50 && ["investment", "money-market"].includes(p.kind) && typeof p.excluded === "boolean") && new Set(d.positions.map(p => p.id)).size === d.positions.length;
}

export function decodePortfolioDraft(raw: string): PortfolioDraft {
  if (raw.length > 50000) throw new Error("La cartera guardada excede el tamaño permitido.");
  const value = JSON.parse(raw);
  if (value.version !== 1 || !isPortfolioDraft(value.draft)) throw new Error("La cartera guardada tiene un formato inválido.");
  return value.draft;
}
