import { parseAnalysisCSV } from "@/lib/analysis-transfer";
import { buildExplorerPayload } from "@/lib/market-data/normalize";
import { MAX_RISK_TICKERS, parseTickerInput } from "@/lib/market-data/request";
import type { MarketDataPeriod } from "@/lib/market-data/types";

export const ARS_HISTORY_TEMPLATE = "date,ticker,close,currency,source\n";

// A complete history, never a position snapshot or an implicit USD conversion.
export function importArsHistory(raw: string, expectedTickers: string[], period: MarketDataPeriod) {
  const [header, ...rows] = parseAnalysisCSV(raw);
  if (header?.join(",") !== "date,ticker,close,currency,source" || !rows.length || rows.length > 100000) {
    throw new Error("Use date,ticker,close,currency,source and 1 to 100000 rows.");
  }
  const parsed = parseTickerInput(expectedTickers.join(","), { maxTickers: MAX_RISK_TICKERS });
  if (!parsed.tickers || parsed.tickers.length > MAX_RISK_TICKERS) throw new Error(parsed.error);
  const expected = parsed.tickers;
  const series = new Map<string, Map<string, number>>();
  const sources = new Set<string>();
  rows.forEach((row, index) => {
    if (row.length !== 5) throw new Error(`Row ${index + 2}: expected five columns.`);
    const [date, symbol, price, currency, source] = row.map((cell) => cell.trim());
    const ticker = symbol.toUpperCase();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error(`Row ${index + 2}: invalid ISO date.`);
    if (currency !== "ARS" || !source || source.length > 500) throw new Error(`Row ${index + 2}: ARS currency and source are required.`);
    if (!expected.includes(ticker)) throw new Error(`Unexpected ticker ${ticker}; match the complete requested universe.`);
    const close = Number(price);
    if (!/^\d+(\.\d+)?$/.test(price) || !Number.isFinite(close) || close <= 0) throw new Error(`Row ${index + 2}: use a positive price with decimal point.`);
    const points = series.get(ticker) ?? new Map<string, number>();
    if (points.has(date)) throw new Error(`Duplicate date ${date} for ${ticker}.`);
    points.set(date, close); series.set(ticker, points); sources.add(source);
  });
  const missing = expected.filter((ticker) => !series.has(ticker));
  if (missing.length) throw new Error(`Missing ARS history: ${missing.join(", ")}.`);
  const payload = buildExplorerPayload({ period, provider: "Imported ARS history", series: expected.map((ticker) => ({ ticker, points: [...series.get(ticker)!].sort(([a], [b]) => a.localeCompare(b)).map(([date, close]) => ({ date, close })) })) });
  payload.meta.priceCurrency = "ARS";
  payload.meta.adjustMode = "user-supplied";
  payload.meta.priceSource = [...sources].join("; ");
  payload.meta.warnings = [{ code: "imported_ars_history", message: "User-supplied ARS prices; source and corporate-action adjustments must be verified. Common dates only; no forward fill. This is a price-return series, not guaranteed total return. Imported dates determine the sample, regardless of the selected lookback." }];
  return payload;
}
