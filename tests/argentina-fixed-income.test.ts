import test from "node:test";
import assert from "node:assert/strict";
import { analyzeManualBond } from "@/lib/finance/argentina-fixed-income";

const base = { cleanPrice: 100, accruedInterest: 0, technicalValue: 100, cashFlows: [{ time: 1, coupon: 10, principal: 100 }] };
test("one-year yield, parity and duration are analytical", () => {
  const result = analyzeManualBond(base);
  assert.ok(Math.abs(result.yieldRate - 0.1) < 1e-10);
  assert.equal(result.parity, 1);
  assert.ok(Math.abs(result.modifiedDuration - 1 / 1.1) < 1e-10);
  assert.equal(result.nextYearCouponYield, 0.1);
  assert.ok(Math.abs(result.scenarios[2].price! - 100) < 1e-8);
  assert.ok(result.scenarios[0].price! > 100);
  assert.ok(result.scenarios[4].price! < 100);
});
test("dirty settlement price is used for yield and parity", () => {
  const result = analyzeManualBond({ ...base, cleanPrice: 98, accruedInterest: 2 });
  assert.equal(result.dirtyPrice, 100);
  assert.ok(Math.abs(result.yieldRate - 0.1) < 1e-10);
});
test("amortizing irregular flows recover a known effective yield", () => {
  const cashFlows = [{ time: 0.4, coupon: 3, principal: 40 }, { time: 1.7, coupon: 5, principal: 60 }];
  const cleanPrice = cashFlows.reduce((sum, flow) => sum + (flow.coupon + flow.principal) / 1.08 ** flow.time, 0);
  assert.ok(Math.abs(analyzeManualBond({ ...base, cleanPrice, cashFlows }).yieldRate - 0.08) < 1e-10);
});
test("negative yields are supported", () => {
  assert.ok(analyzeManualBond({ ...base, cleanPrice: 120 }).yieldRate < 0);
});
test("invalid prices, unordered, empty and non-finite flows are rejected", () => {
  for (const input of [{ ...base, cleanPrice: NaN }, { ...base, technicalValue: 0 }, { ...base, accruedInterest: -1 }, { ...base, cashFlows: [] }, { ...base, cashFlows: [{ time: 0, coupon: 0, principal: 100 }] }, { ...base, cashFlows: [base.cashFlows[0], base.cashFlows[0]] }]) {
    assert.throws(() => analyzeManualBond(input));
  }
});
