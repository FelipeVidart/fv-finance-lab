import type { PortfolioComparisonPortfolioResult } from "@/lib/finance/portfolio/comparison";
import type { PortfolioAssetInput } from "@/lib/finance/portfolio/types";

export type StressAssetCategory =
  | "equity"
  | "smallCap"
  | "internationalEquity"
  | "fixedIncome"
  | "gold"
  | "cash"
  | "other";

export type PortfolioStressScenario = {
  id: string;
  name: string;
  description: string;
  shocks: Partial<Record<StressAssetCategory, number>>;
};

export type PortfolioStressScenarioResult = {
  scenarioId: string;
  scenarioName: string;
  description: string;
  portfolioImpacts: Array<{
    portfolioId: string;
    portfolioLabel: string;
    estimatedImpact: number;
  }>;
};

export const PORTFOLIO_STRESS_SCENARIOS: PortfolioStressScenario[] = [
  {
    id: "equity-shock",
    name: "Equity shock",
    description: "Equities fall sharply while bonds, gold, and cash act defensively.",
    shocks: {
      equity: -0.2,
      smallCap: -0.2,
      internationalEquity: -0.2,
      fixedIncome: 0.03,
      gold: 0.05,
      cash: 0,
      other: -0.05,
    },
  },
  {
    id: "rates-shock",
    name: "Rates shock",
    description: "Bond prices weaken, equities fall modestly, and gold helps offset.",
    shocks: {
      equity: -0.05,
      smallCap: -0.05,
      internationalEquity: -0.05,
      fixedIncome: -0.08,
      gold: 0.02,
      cash: 0,
      other: -0.02,
    },
  },
  {
    id: "risk-off-shock",
    name: "Risk-off shock",
    description: "Growth assets sell off, small caps lead lower, and defensive assets rally.",
    shocks: {
      equity: -0.15,
      smallCap: -0.2,
      internationalEquity: -0.15,
      fixedIncome: 0.04,
      gold: 0.06,
      cash: 0,
      other: -0.06,
    },
  },
  {
    id: "inflation-shock",
    name: "Inflation shock",
    description: "Rates-sensitive assets weaken while gold is assumed to rally.",
    shocks: {
      equity: -0.08,
      smallCap: -0.08,
      internationalEquity: -0.08,
      fixedIncome: -0.06,
      gold: 0.08,
      cash: 0,
      other: -0.03,
    },
  },
];

export function buildPortfolioStressScenarioResults(
  portfolios: PortfolioComparisonPortfolioResult[],
  scenarios: PortfolioStressScenario[] = PORTFOLIO_STRESS_SCENARIOS,
): PortfolioStressScenarioResult[] {
  return scenarios.map((scenario) => ({
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    description: scenario.description,
    portfolioImpacts: portfolios.map((portfolio) => ({
      portfolioId: portfolio.id,
      portfolioLabel: portfolio.label,
      estimatedImpact: calculateScenarioImpact(portfolio.holdings, scenario),
    })),
  }));
}

export function calculateScenarioImpact(
  holdings: PortfolioAssetInput[],
  scenario: PortfolioStressScenario,
): number {
  return holdings.reduce((sum, holding) => {
    const category = resolveStressAssetCategory(holding);
    const shock = scenario.shocks[category] ?? scenario.shocks.other ?? 0;

    return sum + (holding.weight / 100) * shock;
  }, 0);
}

export function resolveStressAssetCategory(
  holding: PortfolioAssetInput,
): StressAssetCategory {
  const ticker = holding.ticker.trim().toUpperCase();
  const assetClass = holding.assetClass.trim().toLowerCase();

  if (ticker === "BIL" || assetClass.includes("cash") || assetClass.includes("bill")) {
    return "cash";
  }

  if (ticker === "IAU" || ticker === "GLD" || assetClass.includes("gold")) {
    return "gold";
  }

  if (
    assetClass.includes("bond") ||
    assetClass.includes("treasur") ||
    ticker === "AGG" ||
    ticker === "IEF"
  ) {
    return "fixedIncome";
  }

  if (assetClass.includes("small cap") || ticker === "IJR") {
    return "smallCap";
  }

  if (
    assetClass.includes("international") ||
    assetClass.includes("ex-us") ||
    ticker === "VXUS"
  ) {
    return "internationalEquity";
  }

  if (assetClass.includes("equity") || ticker === "IVV" || ticker === "SPY") {
    return "equity";
  }

  return "other";
}
