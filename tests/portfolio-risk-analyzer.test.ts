import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateHistoricalExpectedShortfall,
  calculateHistoricalVaR,
  calculateParametricVaR,
} from "../src/lib/finance/risk/tail-risk";
import {
  calculateMoneyAtRisk,
  validateConfidenceLevel,
  validatePortfolioValueInput,
  validateWeightPercentInputs,
} from "../src/lib/finance/risk/portfolio-risk-analyzer";

const syntheticReturns = [-0.1, -0.08, -0.05, -0.02, 0, 0.01, 0.02, 0.03, 0.04, 0.05];

test("validates weights that sum to 100%", () => {
  const result = validateWeightPercentInputs({
    tickers: ["AAPL", "MSFT", "NVDA"],
    weightInputs: {
      AAPL: "40",
      MSFT: "35",
      NVDA: "25",
    },
  });

  assert.equal(result.isValid, true);
  assert.equal(result.totalPercent, 100);
  assert.deepEqual(result.weights, {
    AAPL: 0.4,
    MSFT: 0.35,
    NVDA: 0.25,
  });
});

test("rejects invalid weights and non-100 totals", () => {
  assert.equal(
    validateWeightPercentInputs({
      tickers: ["AAPL", "MSFT"],
      weightInputs: { AAPL: "60", MSFT: "-40" },
    }).isValid,
    false,
  );

  const totalResult = validateWeightPercentInputs({
    tickers: ["AAPL", "MSFT"],
    weightInputs: { AAPL: "60", MSFT: "30" },
  });

  assert.equal(totalResult.isValid, false);
  assert.match(totalResult.error ?? "", /sum to 100%/);
});

test("validates portfolio value input", () => {
  assert.deepEqual(validatePortfolioValueInput("100000"), {
    isValid: true,
    value: 100000,
    error: null,
  });

  assert.equal(validatePortfolioValueInput("0").isValid, false);
  assert.equal(validatePortfolioValueInput("").isValid, false);
});

test("allows only V1 confidence levels", () => {
  assert.equal(validateConfidenceLevel(0.95), 0.95);
  assert.equal(validateConfidenceLevel(0.99), 0.99);
  assert.throws(() => validateConfidenceLevel(0.975), /95% or 99%/);
});

test("historical VaR changes when confidence level changes", () => {
  const var95 = calculateHistoricalVaR(syntheticReturns, 0.95);
  const var99 = calculateHistoricalVaR(syntheticReturns, 0.99);

  assert.ok(var99 > var95);
  assert.ok(Math.abs(var95 - 0.091) < 1e-12);
  assert.ok(Math.abs(var99 - 0.0982) < 1e-12);
});

test("historical Expected Shortfall averages returns beyond the VaR threshold", () => {
  const expectedShortfall = calculateHistoricalExpectedShortfall(
    syntheticReturns,
    0.95,
  );

  assert.equal(expectedShortfall, 0.1);
});

test("parametric VaR uses positive loss convention", () => {
  const parametricVaR = calculateParametricVaR({
    mean: 0,
    volatility: 0.02,
    confidenceLevel: 0.95,
  });

  assert.ok(Math.abs(parametricVaR - 0.03289707253902941) < 1e-9);
});

test("converts risk percentages into monetary amounts", () => {
  assert.equal(
    calculateMoneyAtRisk({
      lossRate: 0.023,
      portfolioValue: 100000,
    }),
    2300,
  );

  assert.equal(
    calculateMoneyAtRisk({
      lossRate: -0.01,
      portfolioValue: 100000,
    }),
    0,
  );
});

test("handles empty or non-loss return samples conservatively", () => {
  assert.equal(calculateHistoricalVaR([], 0.95), 0);
  assert.equal(calculateHistoricalExpectedShortfall([], 0.95), 0);
  assert.equal(calculateHistoricalVaR([0.01, 0.02, 0.03], 0.95), 0);
});
