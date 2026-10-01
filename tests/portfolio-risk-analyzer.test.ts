import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateHistoricalExpectedShortfall,
  calculateHistoricalVaR,
  calculateParametricVaR,
} from "../src/lib/finance/risk/tail-risk";
import { calculateInstrumentVaRContribution } from "../src/lib/finance/risk/risk-contribution";
import { buildFactorGradVarAnalysis } from "../src/lib/finance/risk/factor-gradvar";
import { buildPortfolioScenarioAnalysis } from "../src/lib/finance/risk/scenario-analysis";
import {
  calculateMoneyAtRisk,
  validateConfidenceLevel,
  validatePortfolioValueInput,
  validateWeightPercentInputs,
} from "../src/lib/finance/risk/portfolio-risk-analyzer";
import type { FactorDefinition } from "../src/lib/finance/risk/types";
import type { MarketDataExplorerPayload } from "../src/lib/market-data/types";

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

test("instrument Component VaR sums to covariance portfolio VaR", () => {
  const analysis = calculateInstrumentVaRContribution({
    tickers: ["AAA", "BBB"],
    weights: { AAA: 0.6, BBB: 0.4 },
    returnSeries: {
      AAA: [-0.02, -0.01, 0, 0.01, 0.02],
      BBB: [-0.02, -0.01, 0, 0.01, 0.02],
    },
    confidenceLevel: 0.95,
    portfolioValue: 100000,
  });
  const componentTotal = analysis.rows.reduce(
    (sum, row) => sum + row.componentVaR,
    0,
  );

  assert.equal(analysis.rows.length, 2);
  assert.ok(Math.abs(componentTotal - analysis.summary.portfolioVaR) < 1e-12);
  assert.ok(Math.abs(analysis.rows[0].contributionShare - 0.6) < 1e-12);
  assert.ok(Math.abs(analysis.rows[1].contributionShare - 0.4) < 1e-12);
  assert.ok(
    Math.abs(
      analysis.rows[0].componentVaRAmount -
        analysis.rows[0].componentVaR * 100000,
    ) < 1e-12,
  );
});

test("instrument VaR attribution scales with confidence level", () => {
  const baseInput = {
    tickers: ["AAA", "BBB"],
    weights: { AAA: 0.5, BBB: 0.5 },
    returnSeries: {
      AAA: [-0.03, -0.01, 0.01, 0.02, 0.03],
      BBB: [-0.01, 0, 0.01, 0.01, 0.02],
    },
    portfolioValue: 50000,
  };
  const analysis95 = calculateInstrumentVaRContribution({
    ...baseInput,
    confidenceLevel: 0.95,
  });
  const analysis99 = calculateInstrumentVaRContribution({
    ...baseInput,
    confidenceLevel: 0.99,
  });

  assert.ok(analysis99.summary.portfolioVaR > analysis95.summary.portfolioVaR);
  assert.ok(
    (analysis99.summary.portfolioVaRAmount ?? 0) >
      (analysis95.summary.portfolioVaRAmount ?? 0),
  );
});

test("instrument VaR attribution reports concentration and top contributors", () => {
  const analysis = calculateInstrumentVaRContribution({
    tickers: ["AAA", "BBB", "CCC", "DDD"],
    weights: { AAA: 0.7, BBB: 0.15, CCC: 0.1, DDD: 0.05 },
    returnSeries: {
      AAA: [-0.04, -0.02, 0, 0.02, 0.04],
      BBB: [-0.01, 0, 0.01, 0.01, 0.02],
      CCC: [0.01, 0, -0.01, 0, 0.01],
      DDD: [0, 0.005, -0.005, 0.005, 0],
    },
    confidenceLevel: 0.95,
  });

  assert.equal(analysis.topContributors.length, 3);
  assert.equal(analysis.rows[0].rankByAbsComponentVaR, 1);
  assert.equal(analysis.rows[0].isTopContributor, true);
  assert.ok(analysis.summary.topThreeContributionShare > 0);
  assert.ok(analysis.summary.concentrationHerfindahl > 0);
});

test("factor GradVaR decomposes synthetic factor-driven assets", () => {
  const factorDefinitions: FactorDefinition[] = [
    {
      id: "equity",
      name: "Equity",
      proxyTicker: "EQF",
      description: "Synthetic equity factor.",
    },
    {
      id: "duration",
      name: "Duration",
      proxyTicker: "DUR",
      description: "Synthetic duration factor.",
    },
  ];
  const factorReturns = Array.from({ length: 36 }, (_, index) => ({
    equity: 0.006 * Math.sin(index / 2) + 0.001,
    duration: 0.004 * Math.cos(index / 3) - 0.0005,
  }));
  const assetReturns = factorReturns.map((row) => ({
    RISKY: 1.2 * row.equity + 0.1 * row.duration,
    BOND: 0.05 * row.equity + 1.1 * row.duration,
  }));
  const weights = { RISKY: 0.6, BOND: 0.4 };
  const portfolioDailyReturns = assetReturns.map(
    (row) => weights.RISKY * row.RISKY + weights.BOND * row.BOND,
  );
  const analysis = buildFactorGradVarAnalysis({
    assetData: buildSyntheticPayload({
      tickers: ["RISKY", "BOND"],
      returnsByTicker: {
        RISKY: assetReturns.map((row) => row.RISKY),
        BOND: assetReturns.map((row) => row.BOND),
      },
    }),
    factorData: buildSyntheticPayload({
      tickers: ["EQF", "DUR"],
      returnsByTicker: {
        EQF: factorReturns.map((row) => row.equity),
        DUR: factorReturns.map((row) => row.duration),
      },
    }),
    tickers: ["RISKY", "BOND"],
    weights,
    portfolioDailyReturns,
    confidenceLevel: 0.95,
    factorDefinitions,
  });
  const factorComponentTotal = analysis.factorAttribution.reduce(
    (sum, row) => sum + row.componentVaR,
    0,
  );
  const instrumentComponentTotal = analysis.instrumentAttribution.reduce(
    (sum, row) => sum + row.componentVaR,
    0,
  );

  assert.equal(analysis.observations, 36);
  assert.ok(Math.abs(factorComponentTotal - analysis.valueAtRisk) < 1e-12);
  assert.ok(Math.abs(instrumentComponentTotal - analysis.valueAtRisk) < 1e-12);
  assert.equal(
    analysis.instrumentAttribution.find((row) => row.ticker === "RISKY")
      ?.dominantFactorName,
    "Equity",
  );
  assert.equal(
    analysis.instrumentAttribution.find((row) => row.ticker === "BOND")
      ?.dominantFactorName,
    "Duration",
  );
  assert.ok((analysis.portfolioRegression?.rSquared ?? 0) > 0.99);
});

test("scenario analysis applies hypothetical factor shocks to instrument betas", () => {
  const factorAnalysis = buildSyntheticFactorAnalysis();
  const scenarioAnalysis = buildPortfolioScenarioAnalysis({
    factorAnalysis,
    weights: { RISKY: 0.6, BOND: 0.4 },
    portfolioValue: 100000,
    scenarios: [
      {
        id: "synthetic-risk-off",
        name: "Synthetic risk-off",
        description: "Synthetic equity selloff with duration offset.",
        shocks: {
          equity: -0.1,
          duration: 0.04,
        },
      },
    ],
    topContributorCount: 2,
  });
  const scenario = scenarioAnalysis.scenarios[0];
  const impactTotal = scenario.instrumentContributions.reduce(
    (sum, row) => sum + row.weightedImpact,
    0,
  );

  assert.equal(scenarioAnalysis.methodology.scenarioCount, 1);
  assert.equal(scenario.hypotheticalLabel, "Hypothetical scenario, not a forecast");
  assert.ok(Math.abs(scenario.estimatedImpact - impactTotal) < 1e-12);
  assert.ok(Math.abs((scenario.monetaryImpact ?? 0) - scenario.estimatedImpact * 100000) < 1e-9);
  assert.equal(scenario.topContributors.length, 2);
  assert.equal(scenario.topContributors[0].ticker, "RISKY");
  assert.equal(scenario.factorShocks.length, 2);
});

function buildSyntheticFactorAnalysis() {
  const factorDefinitions: FactorDefinition[] = [
    {
      id: "equity",
      name: "Equity",
      proxyTicker: "EQF",
      description: "Synthetic equity factor.",
    },
    {
      id: "duration",
      name: "Duration",
      proxyTicker: "DUR",
      description: "Synthetic duration factor.",
    },
  ];
  const factorReturns = Array.from({ length: 36 }, (_, index) => ({
    equity: 0.006 * Math.sin(index / 2) + 0.001,
    duration: 0.004 * Math.cos(index / 3) - 0.0005,
  }));
  const assetReturns = factorReturns.map((row) => ({
    RISKY: 1.2 * row.equity + 0.1 * row.duration,
    BOND: 0.05 * row.equity + 1.1 * row.duration,
  }));
  const weights = { RISKY: 0.6, BOND: 0.4 };
  const portfolioDailyReturns = assetReturns.map(
    (row) => weights.RISKY * row.RISKY + weights.BOND * row.BOND,
  );

  return buildFactorGradVarAnalysis({
    assetData: buildSyntheticPayload({
      tickers: ["RISKY", "BOND"],
      returnsByTicker: {
        RISKY: assetReturns.map((row) => row.RISKY),
        BOND: assetReturns.map((row) => row.BOND),
      },
    }),
    factorData: buildSyntheticPayload({
      tickers: ["EQF", "DUR"],
      returnsByTicker: {
        EQF: factorReturns.map((row) => row.equity),
        DUR: factorReturns.map((row) => row.duration),
      },
    }),
    tickers: ["RISKY", "BOND"],
    weights,
    portfolioDailyReturns,
    confidenceLevel: 0.95,
    factorDefinitions,
  });
}

function buildSyntheticPayload(input: {
  tickers: string[];
  returnsByTicker: Record<string, number[]>;
}): MarketDataExplorerPayload {
  const pricesByTicker = Object.fromEntries(
    input.tickers.map((ticker) => [ticker, buildPricePath(input.returnsByTicker[ticker])]),
  );
  const points = Array.from({ length: input.returnsByTicker[input.tickers[0]].length + 1 }, (_, index) => {
    const date = `2026-01-${String(index + 1).padStart(2, "0")}`;

    return {
      date,
      prices: Object.fromEntries(
        input.tickers.map((ticker) => [ticker, pricesByTicker[ticker][index]]),
      ),
      normalized: Object.fromEntries(
        input.tickers.map((ticker) => [
          ticker,
          pricesByTicker[ticker][index] / pricesByTicker[ticker][0],
        ]),
      ),
      cumulativeReturns: Object.fromEntries(
        input.tickers.map((ticker) => [
          ticker,
          pricesByTicker[ticker][index] / pricesByTicker[ticker][0] - 1,
        ]),
      ),
      drawdowns: Object.fromEntries(input.tickers.map((ticker) => [ticker, 0])),
    };
  });

  return {
    tickers: input.tickers,
    period: "1Y",
    points,
    metrics: [],
    meta: {
      provider: "synthetic",
      interval: "1day",
      adjustMode: "all",
      observations: points.length,
      commonStartDate: points[0].date,
      commonEndDate: points[points.length - 1].date,
    },
  };
}

function buildPricePath(returns: number[]): number[] {
  return returns.reduce(
    (prices, dailyReturn) => [
      ...prices,
      prices[prices.length - 1] * (1 + dailyReturn),
    ],
    [100],
  );
}