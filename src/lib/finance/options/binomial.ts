import type {
  BinomialConvergencePoint,
  BinomialPricingInput,
  BinomialPricingResult,
  EuropeanBinomialInput,
  OptionType,
} from "@/lib/finance/options/types";
import { optionPayoffAtExpiry } from "@/lib/finance/options/payoff";
import {
  assertFinite,
  validateBinomialPricingInput,
  validatePositiveScalar,
  validateOptionType,
} from "@/lib/finance/options/validation";

function toBinomialPricingInput(
  input: EuropeanBinomialInput,
): BinomialPricingInput {
  return {
    ...input,
    maturity: input.maturityYears,
    exerciseStyle: input.exerciseStyle ?? "european",
  };
}

export function vanillaPayoff(
  spot: number,
  strike: number,
  optionType: OptionType,
): number {
  assertFinite(spot, "spot");
  validatePositiveScalar(strike, "strike");
  validateOptionType(optionType);

  if (optionType === "call") {
    return Math.max(spot - strike, 0);
  }

  return Math.max(strike - spot, 0);
}

export function priceCrrBinomial(
  input: BinomialPricingInput,
): BinomialPricingResult {
  validateBinomialPricingInput(input);

  const {
    spot,
    strike,
    rate,
    volatility,
    maturity,
    steps,
    optionType,
    dividendYield = 0,
    exerciseStyle = "european",
  } = input;

  if (exerciseStyle !== "european") {
    throw new Error("Only European CRR pricing is implemented.");
  }

  const dt = maturity / steps;
  const u = Math.exp(volatility * Math.sqrt(dt));
  const d = 1 / u;
  const discount = Math.exp(-rate * dt);
  const p = (Math.exp((rate - dividendYield) * dt) - d) / (u - d);

  if (p < 0 || p > 1) {
    throw new Error("Risk-neutral probability is outside [0, 1].");
  }

  const optionValues = new Array<number>(steps + 1);

  for (let j = 0; j <= steps; j += 1) {
    const terminalSpot = spot * u ** j * d ** (steps - j);
    optionValues[j] = optionPayoffAtExpiry(optionType, terminalSpot, strike);
  }

  for (let step = steps - 1; step >= 0; step -= 1) {
    for (let j = 0; j <= step; j += 1) {
      optionValues[j] =
        discount * (p * optionValues[j + 1] + (1 - p) * optionValues[j]);
    }
  }

  return {
    price: optionValues[0],
    steps,
    exerciseStyle: "european",
  };
}

export function priceEuropeanBinomial(input: EuropeanBinomialInput): number {
  return priceCrrBinomial(toBinomialPricingInput(input)).price;
}

export function buildBinomialConvergenceSeries(
  input: Omit<EuropeanBinomialInput, "steps">,
  referencePrice: number,
  stepCounts: number[],
): BinomialConvergencePoint[] {
  assertFinite(referencePrice, "referencePrice");
  validatePositiveScalar(input.spot, "spot");
  validatePositiveScalar(input.strike, "strike");

  if (stepCounts.length === 0) {
    return [];
  }

  return stepCounts.map((steps) => {
    const price = priceEuropeanBinomial({
      ...input,
      steps,
    });

    return {
      steps,
      price,
      absoluteDifference: Math.abs(price - referencePrice),
    };
  });
}
