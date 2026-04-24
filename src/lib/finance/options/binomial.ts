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
    exerciseStyle: "european",
  };
}

function clampFloatingPointNoise(value: number): number {
  return value < 0 && value > -1e-10 ? 0 : value;
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
      const continuationValue =
        discount * (p * optionValues[j + 1] + (1 - p) * optionValues[j]);

      if (exerciseStyle === "american") {
        const nodeSpot = spot * u ** j * d ** (step - j);
        const intrinsicValue = optionPayoffAtExpiry(
          optionType,
          nodeSpot,
          strike,
        );

        optionValues[j] = Math.max(continuationValue, intrinsicValue);
      } else {
        optionValues[j] = continuationValue;
      }
    }
  }

  const price = optionValues[0];
  const intrinsicValue = optionPayoffAtExpiry(optionType, spot, strike);
  const result: BinomialPricingResult = {
    price,
    optionType,
    steps,
    exerciseStyle,
    intrinsicValue,
    earlyExercisePremium: 0,
  };

  if (exerciseStyle === "american") {
    const europeanPrice = priceCrrBinomial({
      ...input,
      exerciseStyle: "european",
    }).price;
    const earlyExercisePremium = clampFloatingPointNoise(price - europeanPrice);

    return {
      ...result,
      europeanPrice,
      earlyExercisePremium,
    };
  }

  return {
    ...result,
    earlyExercisePremium: 0,
  };
}

export function priceEuropeanBinomial(input: EuropeanBinomialInput): number {
  return priceCrrBinomial(toBinomialPricingInput(input)).price;
}

export function buildCrrBinomialConvergenceSeries(
  input: Omit<BinomialPricingInput, "steps">,
  stepCounts: number[],
  referencePrice?: number,
): BinomialConvergencePoint[] {
  if (referencePrice !== undefined) {
    assertFinite(referencePrice, "referencePrice");
  }

  if (stepCounts.length === 0) {
    return [];
  }

  return stepCounts.map((steps) => {
    const result = priceCrrBinomial({
      ...input,
      steps,
    });

    return {
      steps,
      price: result.price,
      absoluteDifference:
        referencePrice === undefined
          ? undefined
          : Math.abs(result.price - referencePrice),
      europeanPrice: result.europeanPrice,
      earlyExercisePremium: result.earlyExercisePremium,
    };
  });
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

  return buildCrrBinomialConvergenceSeries(
    {
      ...input,
      maturity: input.maturityYears,
      exerciseStyle: "european",
    },
    stepCounts,
    referencePrice,
  );
}
