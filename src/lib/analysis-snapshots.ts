export type BondDraft = {
  form: { ticker: string; family: string; unit: string; cleanPrice: string; accruedInterest: string; technicalValue: string };
  flows: { id: number; time: string; coupon: string; principal: string }[];
};
export type HoldingDraft = { id: number; instrument: string; issuer: string; currency: string; family: string; weight: string };
export type PositionDraft = { id: number; name: string; kind: "fund" | "direct"; weight: string; asOf: string; source: string; holdings: HoldingDraft[] };
export type FundDraft = { positions: PositionDraft[]; analysisDate: string };
export type SavedAnalysis<T> = { id: string; name: string; savedAt: string; data: T };
export const MAX_SAVED_ANALYSES = 30;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function strings(value: Record<string, unknown>, keys: string[]) {
  return keys.every((key) => typeof value[key] === "string" && (value[key] as string).length <= 5000);
}
function validId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value < Number.MAX_SAFE_INTEGER;
}
function uniqueIds(values: { id: number }[]) {
  return new Set(values.map((value) => value.id)).size === values.length;
}
export function isBondDraft(value: unknown): value is BondDraft {
  if (!record(value) || !record(value.form) || !strings(value.form, ["ticker", "family", "unit", "cleanPrice", "accruedInterest", "technicalValue"]) ||
      !["Hard dollar / ON", "Fixed-rate ARS", "CER (constant-index units)", "Dollar linked (USD-linked units)"].includes(value.form.family as string) ||
      !["USD", "ARS", "Index units"].includes(value.form.unit as string) ||
      !Array.isArray(value.flows) || value.flows.length > 500) return false;
  return value.flows.every((flow) => record(flow) && validId(flow.id) && strings(flow, ["time", "coupon", "principal"])) && uniqueIds(value.flows);
}
export function isFundDraft(value: unknown): value is FundDraft {
  if (!record(value) || !strings(value, ["analysisDate"]) || !Array.isArray(value.positions) || value.positions.length > 500) return false;
  return value.positions.every((position) => record(position) && validId(position.id) &&
    strings(position, ["name", "weight", "asOf", "source"]) && ["fund", "direct"].includes(position.kind as string) &&
    Array.isArray(position.holdings) && position.holdings.length <= 500 &&
    position.holdings.every((holding) => record(holding) && validId(holding.id) && strings(holding, ["instrument", "issuer", "currency", "family", "weight"])) &&
    uniqueIds(position.holdings)) && uniqueIds(value.positions);
}

export function parseSavedAnalyses<T>(raw: string | null, validate: (value: unknown) => value is T): SavedAnalysis<T>[] {
  if (raw === null) return [];
  if (raw.length > 5_000_000) throw new Error("Saved analyses exceed the supported size.");
  const value: unknown = JSON.parse(raw);
  if (!record(value) || value.version !== 1 || !Array.isArray(value.analyses) || value.analyses.length > MAX_SAVED_ANALYSES) {
    throw new Error("Saved analyses have an unsupported format or version.");
  }
  const analyses = value.analyses;
  if (!analyses.every((analysis) => record(analysis) && strings(analysis, ["id", "name", "savedAt"]) &&
      (analysis.id as string).trim() && (analysis.name as string).trim() && Number.isFinite(Date.parse(analysis.savedAt as string)) && validate(analysis.data)) ||
      new Set(analyses.map((analysis) => analysis.id)).size !== analyses.length) {
    throw new Error("Saved analyses contain invalid data.");
  }
  return analyses as SavedAnalysis<T>[];
}

export function encodeSavedAnalyses<T>(analyses: SavedAnalysis<T>[], validate: (value: unknown) => value is T) {
  const raw = JSON.stringify({ version: 1, analyses });
  parseSavedAnalyses(raw, validate);
  return raw;
}
