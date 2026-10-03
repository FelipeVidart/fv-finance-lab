import test from "node:test";
import assert from "node:assert/strict";
import { encodeSavedAnalyses, isBondDraft, isFundDraft, parseSavedAnalyses, type BondDraft, type FundDraft } from "@/lib/analysis-snapshots";

const bond: BondDraft = { form: { ticker: "Test", family: "Hard dollar / ON", unit: "USD", cleanPrice: "", accruedInterest: "0", technicalValue: "100" }, flows: [{ id: 2, time: "", coupon: "3", principal: "100" }] };
const fund: FundDraft = { analysisDate: "2026-10-02", positions: [{ id: 10, name: "Fund", kind: "fund", weight: "60", asOf: "", source: "", holdings: [{ id: 20, instrument: "", issuer: "", currency: "USD", family: "ON", weight: "" }] }] };
const snapshot = <T>(data: T) => ({ id: "a", name: "Analysis", savedAt: "2026-10-02T12:00:00.000Z", data });

test("round-trip retains incomplete drafts and stable row IDs after reload", () => {
  assert.deepEqual(parseSavedAnalyses(encodeSavedAnalyses([snapshot(bond)], isBondDraft), isBondDraft)[0].data, bond);
  assert.deepEqual(parseSavedAnalyses(encodeSavedAnalyses([snapshot(fund)], isFundDraft), isFundDraft)[0].data, fund);
  assert.deepEqual(parseSavedAnalyses(null, isFundDraft), []);
});
test("multiple named snapshots remain independent", () => {
  const saved = [snapshot(bond), { ...snapshot(bond), id: "b", name: "Second" }];
  const restored = parseSavedAnalyses(encodeSavedAnalyses(saved, isBondDraft), isBondDraft);
  restored[0].data.form.ticker = "Changed";
  assert.equal(restored[1].data.form.ticker, "Test");
  assert.equal(bond.form.ticker, "Test");
});
test("corrupt storage, unsupported versions, duplicate IDs and limits fail safely", () => {
  for (const raw of ["{", JSON.stringify({ version: 2, analyses: [] }), JSON.stringify({ version: 1, analyses: [snapshot(bond), snapshot(bond)] }), JSON.stringify({ version: 1, analyses: [{ ...snapshot(bond), savedAt: "invalid" }] }), JSON.stringify({ version: 1, analyses: Array.from({ length: 31 }, (_, index) => ({ ...snapshot(bond), id: String(index) })) })]) {
    assert.throws(() => parseSavedAnalyses(raw, isBondDraft));
  }
});
test("wrong modules and malformed nested drafts are rejected before rendering", () => {
  assert.equal(isBondDraft(fund), false);
  assert.equal(isFundDraft(bond), false);
  assert.equal(isBondDraft({ ...bond, flows: [{ id: 0, time: 1, coupon: "0", principal: "100" }] }), false);
  assert.equal(isBondDraft({ ...bond, flows: [...bond.flows, ...bond.flows] }), false);
  assert.equal(isBondDraft({ ...bond, form: { ...bond.form, unit: "UNKNOWN" } }), false);
  assert.equal(isFundDraft({ ...fund, positions: [{ ...fund.positions[0], holdings: [null] }] }), false);
  assert.throws(() => parseSavedAnalyses(encodeSavedAnalyses([snapshot(bond)], isBondDraft), isFundDraft));
});
