import test from "node:test";
import assert from "node:assert/strict";
import { decodeAnalysisFile, encodeAnalysisFile, FUND_CSV_HEADERS, FUND_CSV_TEMPLATE, importFundCSV, parseAnalysisCSV } from "@/lib/analysis-transfer";
import { isBondDraft, isFundDraft, type BondDraft } from "@/lib/analysis-snapshots";
import { analyzeFundLookThrough } from "@/lib/finance/risk/fund-look-through";

const bond: BondDraft = { form: { ticker: "Test", family: "Hard dollar / ON", unit: "USD", cleanPrice: "", accruedInterest: "0", technicalValue: "100" }, flows: [] };
test("JSON moves incomplete drafts between modules only when kind and schema match", () => {
  const raw = encodeAnalysisFile("bond", bond, isBondDraft);
  assert.deepEqual(decodeAnalysisFile(raw, "bond", isBondDraft), bond);
  assert.throws(() => decodeAnalysisFile(raw, "fund", isFundDraft));
  assert.throws(() => decodeAnalysisFile(raw.replace('"version": 1', '"version": 2'), "bond", isBondDraft));
  assert.throws(() => decodeAnalysisFile("{}", "bond", isBondDraft));
  assert.throws(() => decodeAnalysisFile("x".repeat(5_000_001), "bond", isBondDraft));
});
test("CSV handles BOM, CRLF, quoted commas, multiline fields and escaped quotes", () => {
  assert.deepEqual(parseAnalysisCSV('\uFEFFa,b\r\n"name, one","line 1\nline ""2"""\r\n'), [["a", "b"], ["name, one", 'line 1\nline "2"']]);
  assert.throws(() => parseAnalysisCSV('a,"unclosed'));
  assert.throws(() => parseAnalysisCSV('a,"closed"extra'));
});
test("template imports and produces expected exposure, preserving unknown holdings", () => {
  const draft = importFundCSV(FUND_CSV_TEMPLATE);
  assert.equal(draft.positions.length, 2);
  assert.equal(draft.positions[0].holdings.length, 1);
  const result = analyzeFundLookThrough(draft.positions.map((position) => ({ ...position, id: String(position.id), weight: Number(position.weight) / 100, holdings: position.holdings.map((holding) => ({ ...holding, weight: Number(holding.weight) / 100 })) })), draft.analysisDate);
  assert.ok(Math.abs(result.unknownWeight - 0.12) < 1e-12);
  assert.equal(result.instrumentOverlap.length, 1);
  const raw = encodeAnalysisFile("fund", draft, isFundDraft);
  assert.deepEqual(decodeAnalysisFile(raw, "fund", isFundDraft), draft);
});
test("repeated position rows do not duplicate portfolio allocation", () => {
  const csv = `${FUND_CSV_HEADERS.join(",")}\n2026-10-02,f,Fund,fund,100,2026-10-01,Source,A,Issuer,USD,ON,40\n2026-10-02,f,Fund,fund,100,2026-10-01,Source,B,Issuer,USD,ON,60\n`;
  const draft = importFundCSV(csv);
  assert.equal(draft.positions.length, 1);
  assert.equal(draft.positions[0].weight, "100");
  assert.equal(draft.positions[0].holdings.length, 2);
  assert.equal(new Set(draft.positions[0].holdings.map((holding) => holding.id)).size, 2);
  assert.throws(() => importFundCSV(csv.replace("f,Fund,fund,100,2026-10-01,Source,B", "f,Fund,fund,90,2026-10-01,Source,B")));
});
test("blank holdings can represent a fully undisclosed fund", () => {
  const draft = importFundCSV(`${FUND_CSV_HEADERS.join(",")}\n2026-10-02,f,Fund,fund,100,2026-10-01,Source,,,,,\n`);
  assert.deepEqual(draft.positions[0].holdings, []);
});
test("invalid headers, totals, direct weights, fields and dates fail before applying", () => {
  for (const csv of [FUND_CSV_TEMPLATE.replace("analysis_date", "date"), FUND_CSV_TEMPLATE.replace("fund,60", "fund,50"), FUND_CSV_TEMPLATE.replace("ON,100", "ON,90"), FUND_CSV_TEMPLATE.replace("fund,60", "fund,"), FUND_CSV_TEMPLATE.replace("2026-10-01", "2026-10-03"), FUND_CSV_TEMPLATE.replace("ON,80", "ON,110"), FUND_CSV_TEMPLATE.replace("Example company,USD", ",USD")]) {
    assert.throws(() => importFundCSV(csv));
  }
});
