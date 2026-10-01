import type {
  FactorDefinition,
  FactorGradVarAnalysis,
  FactorRegressionRow,
  PortfolioScenarioAnalysis,
  PortfolioScenarioAnalysisInput,
  ScenarioAnalysisDefinition,
  ScenarioAnalysisResult,
  ScenarioInstrumentContributionRow,
} from "@/lib/finance/risk/types";

const DEFAULT_TOP_CONTRIBUTOR_COUNT = 3;
const HYPOTHETICAL_LABEL = "Hypothetical scenario, not a forecast";

export const DEFAULT_SCENARIO_DEFINITIONS: ScenarioAnalysisDefinition[] = [
  {
    id: "global-risk-off",
    name: "Global risk-off",
    description:
      "Broad equity and credit repricing with defensive USD, duration, and gold assumptions.",
    shocks: {
      "global-equity": -0.18,
      "argentina-equity": -0.3,
      "growth-technology": -0.22,
      "long-duration-rates": 0.04,
      "credit-risk-appetite": -0.1,
      "usd-fx": 0.05,
      "gold-real-asset": 0.07,
    },
  },
  {
    id: "argentina-stress",
    name: "Argentina stress",
    description:
      "Local country-risk shock with Argentina beta leading lower and broad USD pressure.",
    shocks: {
      "global-equity": -0.08,
      "argentina-equity": -0.35,
      "growth-technology": -0.1,
      "long-duration-rates": -0.02,
      "credit-risk-appetite": -0.08,
      "usd-fx": 0.08,
      "gold-real-asset": 0.05,
    },
  },
  {
    id: "rates-shock",
    name: "Rates shock",
    description:
      "Higher-rate shock where duration and growth assets weaken together.",
    shocks: {
      "global-equity": -0.07,
      "argentina-equity": -0.1,
      "growth-technology": -0.12,
      "long-duration-rates": -0.12,
      "credit-risk-appetite": -0.06,
      "usd-fx": 0.03,
      "gold-real-asset": -0.04,
    },
  },
];

export function buildPortfolioScenarioAnalysis(
  input: PortfolioScenarioAnalysisInput,
): PortfolioScenarioAnalysis {
  const scenarios = input.scenarios ?? DEFAULT_SCENARIO_DEFINITIONS;
  const topContributorCount =
    input.topContributorCount ?? DEFAULT_TOP_CONTRIBUTOR_COUNT;

  if (topContributorCount < 1) {
    throw new Error("Scenario top contributor count must be at least one.");
  }

  const warnings = buildScenarioWarnings(input.factorAnalysis, scenarios);

  return {
    scenarios: scenarios.map((scenario) =>
      buildScenarioResult({
        factorAnalysis: input.factorAnalysis,
        weights: input.weights,
        portfolioValue: input.portfolioValue ?? null,
        scenario,
        topContributorCount,
      }),
    ),
    methodology: {
      scenarioCount: scenarios.length,
      topContributorCount,
      portfolioValue: input.portfolioValue ?? null,
      warnings,
    },
  };
}

function buildScenarioResult(input: {
  factorAnalysis: FactorGradVarAnalysis;
  weights: Record<string, number>;
  portfolioValue: number | null;
  scenario: ScenarioAnalysisDefinition;
  topContributorCount: number;
}): ScenarioAnalysisResult {
  const rawContributions = input.factorAnalysis.assetRegressions.map(
    (regression) =>
      buildInstrumentContribution({
        regression,
        weights: input.weights,
        scenario: input.scenario,
        portfolioValue: input.portfolioValue,
      }),
  );
  const estimatedImpact = rawContributions.reduce(
    (sum, row) => sum + row.weightedImpact,
    0,
  );
  const denominator = rawContributions.reduce(
    (sum, row) => sum + Math.abs(row.weightedImpact),
    0,
  );
  const rankedRows = rawContributions
    .map((row) => ({
      ...row,
      contributionShare:
        denominator === 0 ? 0 : row.weightedImpact / denominator,
    }))
    .sort((left, right) => Math.abs(right.weightedImpact) - Math.abs(left.weightedImpact))
    .map((row, index) => ({
      ...row,
      rankByAbsWeightedImpact: index + 1,
      isTopContributor: index < input.topContributorCount,
    }));

  return {
    scenarioId: input.scenario.id,
    scenarioName: input.scenario.name,
    description: input.scenario.description,
    hypotheticalLabel: HYPOTHETICAL_LABEL,
    estimatedImpact,
    monetaryImpact:
      input.portfolioValue === null ? null : estimatedImpact * input.portfolioValue,
    factorShocks: input.factorAnalysis.factorDefinitions.map((factor) =>
      buildFactorShock(factor, input.scenario),
    ),
    instrumentContributions: rankedRows,
    topContributors: rankedRows.slice(0, input.topContributorCount),
  };
}

function buildInstrumentContribution(input: {
  regression: FactorRegressionRow;
  weights: Record<string, number>;
  scenario: ScenarioAnalysisDefinition;
  portfolioValue: number | null;
}): ScenarioInstrumentContributionRow {
  const weight = input.weights[input.regression.ticker] ?? 0;
  const estimatedInstrumentImpact = Object.entries(input.scenario.shocks).reduce(
    (sum, [factorId, shock]) =>
      sum + (input.regression.betas[factorId] ?? 0) * shock,
    0,
  );
  const weightedImpact = weight * estimatedInstrumentImpact;

  return {
    ticker: input.regression.ticker,
    weight,
    estimatedInstrumentImpact,
    weightedImpact,
    monetaryImpact:
      input.portfolioValue === null ? null : weightedImpact * input.portfolioValue,
    contributionShare: 0,
    rankByAbsWeightedImpact: 0,
    isTopContributor: false,
  };
}

function buildFactorShock(
  factor: FactorDefinition,
  scenario: ScenarioAnalysisDefinition,
) {
  return {
    factorId: factor.id,
    factorName: factor.name,
    proxyTicker: factor.proxyTicker,
    shock: scenario.shocks[factor.id] ?? 0,
  };
}

function buildScenarioWarnings(
  factorAnalysis: FactorGradVarAnalysis,
  scenarios: ScenarioAnalysisDefinition[],
): string[] {
  const warnings: string[] = [];
  const knownFactorIds = new Set(
    factorAnalysis.factorDefinitions.map((factor) => factor.id),
  );
  const missingScenarioIds = scenarios.flatMap((scenario) =>
    Object.keys(scenario.shocks).filter((factorId) => !knownFactorIds.has(factorId)),
  );

  if (missingScenarioIds.length > 0) {
    warnings.push(
      `Some scenario shocks reference factors outside the current proxy set: ${[
        ...new Set(missingScenarioIds),
      ].join(", ")}.`,
    );
  }

  if ((factorAnalysis.portfolioRegression?.rSquared ?? 0) < 0.35) {
    warnings.push(
      "Portfolio factor R2 is low; scenario impacts may omit important idiosyncratic drivers.",
    );
  }

  if (factorAnalysis.assetRegressions.length === 0) {
    warnings.push(
      "No asset regressions are available, so scenario contributors cannot be estimated.",
    );
  }

  return warnings;
}