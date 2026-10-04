import test from "node:test";
import assert from "node:assert/strict";
import { chartSeries } from "@/lib/workspace/chart-series";
import { calculateRiskContribution } from "@/lib/finance/risk/risk-contribution";

test("chart calendar spacing preserves gaps instead of inserting prices", () => {
  const result = chartSeries([{ date: "2026-01-01", value: 100 }, { date: "2026-01-02", value: 95 }, { date: "2026-01-05", value: 110 }]);
  assert.equal(result.coordinates.length, 3);
  assert.equal(result.coordinates[1].x, 190);
  assert.equal(result.coordinates[2].x, 580);
  assert.ok(result.coordinates.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
});
test("flat and zero drawdown charts have a finite scale including zero", () => {
  const result = chartSeries([{ date: "2026-01-01", value: 0 }, { date: "2026-01-02", value: 0 }], true);
  assert.ok(result.min < 0 && result.max > 0);
  assert.ok(!/NaN|Infinity/.test(result.path));
  assert.throws(() => chartSeries([{ date: "invalid", value: 1 }]));
  assert.throws(() => chartSeries([{ date: "2026-01-01", value: NaN }]));
});
test("risk chart shares preserve negative diversifying contributions and total one", () => {
  const rows = calculateRiskContribution({ tickers: ["A", "B"], weights: { A: .8, B: .2 }, returnSeries: { A: [.1, -.1, .05, -.05], B: [-.05, .05, -.025, .025] } });
  assert.ok(rows[1].percentContributionToVolatility < 0);
  assert.ok(rows[0].percentContributionToVolatility > 1);
  assert.ok(Math.abs(rows.reduce((n, row) => n + row.percentContributionToVolatility, 0) - 1) < 1e-10);
});
test("risk shares are unavailable rather than equal weights with no observed variation", () => {
  const rows = calculateRiskContribution({ tickers: ["A", "B"], weights: { A: .8, B: .2 }, returnSeries: { A: [0, 0, 0], B: [0, 0, 0] } });
  assert.ok(rows.every(row => row.contributionToVolatility === 0));
});
