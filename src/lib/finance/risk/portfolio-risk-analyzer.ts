export const PORTFOLIO_VALUE_CURRENCIES = ["USD", "ARS"] as const;
export const PORTFOLIO_CONFIDENCE_LEVELS = [0.95, 0.99] as const;

export type PortfolioValueCurrency = (typeof PORTFOLIO_VALUE_CURRENCIES)[number];
export type PortfolioConfidenceLevel =
  (typeof PORTFOLIO_CONFIDENCE_LEVELS)[number];

export type PortfolioValueValidation = {
  isValid: boolean;
  value: number | null;
  error: string | null;
};

export type WeightValidationResult = {
  isValid: boolean;
  totalPercent: number;
  weights: Record<string, number> | null;
  error: string | null;
};

const WEIGHT_TOLERANCE_PERCENT = 0.05;

export function validatePortfolioValueInput(
  rawValue: string,
): PortfolioValueValidation {
  const parsed = Number(rawValue);

  if (rawValue.trim() === "") {
    return {
      isValid: false,
      value: null,
      error: "Enter a portfolio value to translate risk percentages into money.",
    };
  }

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return {
      isValid: false,
      value: null,
      error: "Portfolio value must be a positive number.",
    };
  }

  return {
    isValid: true,
    value: parsed,
    error: null,
  };
}

export function validateWeightPercentInputs(input: {
  tickers: string[];
  weightInputs: Record<string, string>;
  tolerancePercent?: number;
}): WeightValidationResult {
  const tolerancePercent = input.tolerancePercent ?? WEIGHT_TOLERANCE_PERCENT;
  let totalPercent = 0;
  const parsedWeights: Record<string, number> = {};

  for (const ticker of input.tickers) {
    const rawValue = input.weightInputs[ticker];

    if (rawValue === undefined || rawValue.trim() === "") {
      return {
        isValid: false,
        error: "Enter a numeric weight for each selected ticker.",
        totalPercent,
        weights: null,
      };
    }

    const parsed = Number(rawValue);

    if (!Number.isFinite(parsed)) {
      return {
        isValid: false,
        error: "Weights must be numeric.",
        totalPercent,
        weights: null,
      };
    }

    if (parsed < 0) {
      return {
        isValid: false,
        error: "Weights cannot be negative.",
        totalPercent,
        weights: null,
      };
    }

    totalPercent += parsed;
    parsedWeights[ticker] = parsed / 100;
  }

  if (Math.abs(totalPercent - 100) > tolerancePercent) {
    return {
      isValid: false,
      error: `Portfolio weights must sum to 100%. Current total: ${totalPercent.toFixed(
        2,
      )}%.`,
      totalPercent,
      weights: null,
    };
  }

  return {
    isValid: true,
    error: null,
    totalPercent,
    weights: parsedWeights,
  };
}

export function validateConfidenceLevel(
  confidenceLevel: number,
): PortfolioConfidenceLevel {
  if (confidenceLevel === 0.95 || confidenceLevel === 0.99) {
    return confidenceLevel;
  }

  throw new Error("Confidence level must be 95% or 99% for V1.");
}

export function calculateMoneyAtRisk(input: {
  lossRate: number;
  portfolioValue: number;
}): number {
  if (
    !Number.isFinite(input.lossRate) ||
    input.lossRate < 0 ||
    !Number.isFinite(input.portfolioValue) ||
    input.portfolioValue <= 0
  ) {
    return 0;
  }

  return input.lossRate * input.portfolioValue;
}
