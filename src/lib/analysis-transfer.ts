import { isFundDraft, type FundDraft, type PositionDraft } from "@/lib/analysis-snapshots";
import { analyzeFundLookThrough } from "@/lib/finance/risk/fund-look-through";

export type AnalysisKind = "bond" | "fund";
const MAX_FILE_SIZE = 5_000_000;
export const FUND_CSV_HEADERS = ["analysis_date", "position_id", "name", "kind", "allocation_pct", "as_of", "source", "instrument", "issuer", "currency", "family", "holding_pct"];
export const FUND_CSV_TEMPLATE = `${FUND_CSV_HEADERS.join(",")}\n2026-10-02,fund-1,Example fund,fund,60,2026-10-01,Synthetic example,Example ON,Example company,USD,ON,80\n2026-10-02,direct-1,Example direct ON,direct,40,2026-10-01,Synthetic example,Example ON,Example company,USD,ON,100\n`;

export function encodeAnalysisFile<T>(kind: AnalysisKind, data: T, validate: (value: unknown) => value is T) {
  if (!validate(data)) throw new Error("Current inputs exceed the supported draft format.");
  const raw = JSON.stringify({ format: "fv-finance-lab-analysis", version: 1, kind, data }, null, 2);
  if (raw.length > MAX_FILE_SIZE) throw new Error("Analysis exceeds the 5 MB size limit.");
  return raw;
}
export function decodeAnalysisFile<T>(raw: string, kind: AnalysisKind, validate: (value: unknown) => value is T): T {
  if (raw.length > MAX_FILE_SIZE) throw new Error("File exceeds the 5 MB size limit.");
  const value: unknown = JSON.parse(raw.replace(/^\uFEFF/, ""));
  if (typeof value !== "object" || value === null || !("format" in value) || value.format !== "fv-finance-lab-analysis" ||
      !("version" in value) || value.version !== 1 || !("kind" in value) || value.kind !== kind || !("data" in value) || !validate(value.data)) {
    throw new Error("Unsupported file version, module or draft structure.");
  }
  return value.data;
}

// Strict comma-separated records, including escaped quotes and multiline cells.
export function parseAnalysisCSV(raw: string): string[][] {
  if (raw.length > MAX_FILE_SIZE) throw new Error("CSV exceeds the 5 MB size limit.");
  const text = raw.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let state: "plain" | "quoted" | "closed" = "plain";
  const finishRow = () => { row.push(cell); if (row.some((value) => value.trim())) rows.push(row); row = []; cell = ""; };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (state === "quoted") {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') state = "closed";
      else cell += char;
    } else if (char === ",") { row.push(cell); cell = ""; state = "plain"; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      finishRow(); state = "plain";
    } else if (char === '"') {
      if (cell !== "" || state === "closed") throw new Error("Unexpected quote in CSV.");
      state = "quoted";
    } else {
      if (state === "closed") throw new Error("Unexpected text after a quoted CSV cell.");
      cell += char;
    }
  }
  if (state === "quoted") throw new Error("Unclosed CSV quote.");
  if (cell || row.length || state === "closed") finishRow();
  return rows;
}

export function importFundCSV(raw: string): FundDraft {
  const [headers, ...rows] = parseAnalysisCSV(raw);
  if (!headers || headers.length !== FUND_CSV_HEADERS.length || headers.some((header, index) => header.trim() !== FUND_CSV_HEADERS[index])) {
    throw new Error("CSV headers must match the downloadable template (comma-separated).");
  }
  if (!rows.length || rows.length > 10000) throw new Error("CSV must contain 1 to 10,000 holding rows.");
  const positions = new Map<string, PositionDraft>();
  let analysisDate = "";
  let nextId = 0;
  const number = (value: string, label: string, line: number) => {
    if (!/^\d+(\.\d+)?$/.test(value.trim()) || Number(value) > 100) throw new Error(`Record ${line}: ${label} must be between 0 and 100, using a decimal point.`);
    return value.trim();
  };
  rows.forEach((row, index) => {
    const line = index + 2;
    if (row.length !== headers.length) throw new Error(`Record ${line}: unexpected number of columns.`);
    const [date, key, name, kind, allocation, asOf, source, instrument, issuer, currency, family, holdingWeight] = row.map((cell) => cell.trim());
    if (!analysisDate) analysisDate = date;
    if (!date || date !== analysisDate) throw new Error(`Record ${line}: analysis date must be identical across rows.`);
    if (!key || !name || !source || !["fund", "direct"].includes(kind)) throw new Error(`Record ${line}: complete position identity, type and source.`);
    const weight = number(allocation, "allocation", line);
    let position = positions.get(key);
    if (!position) {
      position = { id: nextId++, name, kind: kind as PositionDraft["kind"], weight, asOf, source, holdings: [] };
      positions.set(key, position);
    } else if (position.name !== name || position.kind !== kind || Number(position.weight) !== Number(weight) || position.asOf !== asOf || position.source !== source) {
      throw new Error(`Record ${line}: conflicting metadata for position ${key}.`);
    }
    const emptyHolding = [instrument, issuer, currency, family, holdingWeight].every((value) => !value);
    if (!emptyHolding) {
      if ([instrument, issuer, currency, family].some((value) => !value)) throw new Error(`Record ${line}: complete holding classifications.`);
      position.holdings.push({ id: nextId++, instrument, issuer, currency, family, weight: number(holdingWeight, "holding weight", line) });
    }
  });
  const draft = { analysisDate, positions: [...positions.values()] };
  if (!isFundDraft(draft)) throw new Error("CSV exceeds supported position, holding or field limits.");
  analyzeFundLookThrough(draft.positions.map((position) => ({ ...position, id: String(position.id), weight: Number(position.weight) / 100,
    holdings: position.holdings.map((holding) => ({ ...holding, weight: Number(holding.weight) / 100 })) })), analysisDate);
  return draft;
}
