import test from "node:test";
import assert from "node:assert/strict";
import { buildPortfolioAnalytics } from "@/lib/finance/portfolio";
import { applyHistoryPreview, previewCSVHistory, previewProviderHistory } from "@/lib/workspace/history-preview";
import { decodePortfolioDraft, EMPTY_DRAFT, importPositionsCSV, isPortfolioDraft, validateDraft, type PortfolioDraft } from "@/lib/workspace/portfolio-draft";
import type { BatchHistoricalPriceResponse } from "@/lib/market-data/types";

const draft: PortfolioDraft = { ...EMPTY_DRAFT, positions: importPositionsCSV("ticker,value,kind\nSPY,75,investment\nEFA,25,investment\nBCMMA,50,investment\n") };
const history = "date,ticker,close,currency,source\n2026-10-01,SPY,100,ARS,Synthetic test\n2026-10-02,SPY,110,ARS,Synthetic test\n2026-10-03,SPY,99,ARS,Synthetic test\n2026-10-01,EFA,100,ARS,Synthetic test\n2026-10-02,EFA,100,ARS,Synthetic test\n2026-10-03,EFA,100,ARS,Synthetic test\n";

test("cash is excluded and original amounts determine weights", () => {
  const result = validateDraft(draft);
  assert.equal(result.total, 100);
  assert.deepEqual(result.weights, { SPY: .75, EFA: .25 });
  assert.equal(draft.positions[2].kind, "money-market");
});
test("manual exclusions require valid remaining weights", () => {
  assert.throws(() => validateDraft({ ...draft, mode: "weight", positions: draft.positions.map(p => p.ticker === "EFA" ? { ...p, excluded: true } : p) }), /suman/);
  assert.deepEqual(validateDraft({ ...draft, positions: draft.positions.map(p => p.ticker === "EFA" ? { ...p, excluded: true } : p) }).weights, { SPY: 1 });
});
test("invalid and duplicate positions are rejected, including .BA aliases", () => {
  for (const csv of ["SPY,0,investment", "SPY,-1,investment", "SPY,1e8,investment", "SPY,1.000.000,investment", "BAD SPACE,10,investment", "SPY,10,investment\nSPY,20,investment", "SPY,10,investment\nSPY.BA,20,investment", "SPY,10,unknown"]) assert.throws(() => importPositionsCSV(`ticker,value,kind\n${csv}\n`));
});
test("decimal comma is accepted only as a decimal, not thousands", () => {
  assert.equal(validateDraft({ ...draft, positions: [{ id: 0, ticker: "SPY", value: "10,5", kind: "investment", excluded: false }] }).total, 10.5);
});
test("complete CSV keeps allocation and computes portfolio returns", () => {
  const preview = previewCSVHistory(history, draft);
  const applied = applyHistoryPreview(draft, preview, false);
  assert.deepEqual(applied.weights, { SPY: .75, EFA: .25 });
  assert.equal(applied.coverage, 1);
  assert.equal(applied.portfolioValue, 100);
  const portfolio = buildPortfolioAnalytics({ data: preview.data, weights: applied.weights });
  assert.ok(Math.abs(portfolio.dailyReturns[0] - .075) < 1e-12);
  assert.ok(Math.abs(portfolio.metrics.totalReturn - (1.075 * .925 - 1)) < 1e-12);
});
test("partial CSV needs explicit confirmation and reports renormalization", () => {
  const preview = previewCSVHistory(history.split("\n").filter(line => !line.includes(",EFA,")).join("\n"), draft);
  assert.deepEqual(preview.missing.map(m => m.ticker), ["EFA"]);
  assert.throws(() => applyHistoryPreview(draft, preview, false), /Confirmá/);
  const applied = applyHistoryPreview(draft, preview, true);
  assert.equal(applied.coverage, .75);
  assert.deepEqual(applied.weights, { SPY: 1 });
  assert.deepEqual(applied.excluded, ["EFA"]);
});
test("mixed currency, duplicate dates, invalid dates and foreign assets fail", () => {
  for (const raw of [history.replace("99,ARS", "99,USD"), history + "2026-10-03,SPY,99,ARS,test\n", history.replaceAll("2026-10-01", "2026-02-30"), history.replaceAll(",EFA,", ",COIN,")]) assert.throws(() => previewCSVHistory(raw, draft));
});
test("insufficient overlap is rejected without filling gaps", () => {
  assert.throws(() => previewCSVHistory(history.replace("2026-10-01,EFA", "2026-09-30,EFA"), draft), /3 fechas comunes/);
});
test("USD histories are supported without conversion", () => {
  const usd = { ...draft, currency: "USD" as const };
  const preview = previewCSVHistory(history.replaceAll(",ARS,", ",USD,"), usd);
  assert.equal(preview.data.meta.priceCurrency, "USD");
  assert.throws(() => applyHistoryPreview(draft, preview, true), /moneda/);
});
test("provider coverage validates reported currency and preserves visible tickers", () => {
  const batch: BatchHistoricalPriceResponse = { missingSymbols: [], warnings: [], providerDiagnostics: [], results: {
    "SPY.BA": { symbol: "SPY.BA", provider: "yahoo", warnings: [], prices: [{ date: "2026-10-01", close: 100 }, { date: "2026-10-02", close: 110 }, { date: "2026-10-03", close: 99 }], metadata: { observations: 3, sourceSymbol: "SPY.BA", currency: "ARS" } },
    "EFA.BA": { symbol: "EFA.BA", provider: "yahoo", warnings: [], prices: [{ date: "2026-10-01", close: 100 }, { date: "2026-10-02", close: 100 }, { date: "2026-10-03", close: 100 }], metadata: { observations: 3, sourceSymbol: "EFA.BA", currency: "USD" } },
  } };
  const preview = previewProviderHistory(draft, batch);
  assert.deepEqual(preview.data.tickers, ["SPY"]);
  assert.match(preview.missing[0].reason, /Moneda/);
});
test("draft persistence restores incomplete edits and rejects corrupt versions and duplicate IDs", () => {
  assert.deepEqual(decodePortfolioDraft(JSON.stringify({ version: 1, draft: EMPTY_DRAFT })), EMPTY_DRAFT);
  assert.throws(() => decodePortfolioDraft(JSON.stringify({ version: 2, draft })));
  assert.equal(isPortfolioDraft({ ...draft, positions: [{ ...draft.positions[0] }, { ...draft.positions[1], id: 0 }] }), false);
  assert.equal(isPortfolioDraft({ ...draft, currency: "EUR" }), false);
  assert.throws(() => decodePortfolioDraft("corrupt"));
});
