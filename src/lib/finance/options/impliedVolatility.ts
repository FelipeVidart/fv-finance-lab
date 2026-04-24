import { blackScholesPrice } from "@/lib/finance/options/blackScholes";
import type {
  ImpliedVolatilityInput,
  ImpliedVolatilityResult,
} from "@/lib/finance/options/types";
import {
  validateFiniteScalar,
  validateOptionPricingInput,
  validateOptionType,
  validatePositiveScalar,
} from "@/lib/finance/options/validation";

const DEFAULT_MIN_VOL = 0.0001;
const DEFAULT_MAX_VOL = 5;
const DEFAULT_TOLERANCE = 1e-6;
const DEFAULT_MAX_ITERATIONS = 100;
const BOUND_TOLERANCE = 1e-10;

export function getEuropeanOptionPriceBounds({
  optionType,
  spot,
  strike,
  riskFreeRate,
  dividendYield,
  maturity,
}: Omit<
  ImpliedVolatilityInput,
  "marketPrice" | "minVol" | "maxVol" | "tolerance" | "maxIterations"
>): { lowerBound: number; upperBound: number } {
  validateOptionType(optionType);
  validatePositiveScalar(spot, "spot");
  validatePositiveScalar(strike, "strike");
  validatePositiveScalar(maturity, "maturity");
  validateFiniteScalar(riskFreeRate, "riskFreeRate");
  validateFiniteScalar(dividendYield, "dividendYield");

  const discountedSpot = spot * Math.exp(-dividendYield * maturity);
  const discountedStrike = strike * Math.exp(-riskFreeRate * maturity);

  if (optionType === "call") {
    return {
      lowerBound: Math.max(discountedSpot - discountedStrike, 0),
      upperBound: discountedSpot,
    };
  }

  return {
    lowerBound: Math.max(discountedStrike - discountedSpot, 0),
    upperBound: discountedStrike,
  };
}

export function solveImpliedVolatility(
  input: ImpliedVolatilityInput,
): ImpliedVolatilityResult {
  const {
    marketPrice,
    optionType,
    spot,
    strike,
    riskFreeRate,
    dividendYield,
    maturity,
    minVol = DEFAULT_MIN_VOL,
    maxVol = DEFAULT_MAX_VOL,
    tolerance = DEFAULT_TOLERANCE,
    maxIterations = DEFAULT_MAX_ITERATIONS,
  } = input;

  const { lowerBound, upperBound } = getEuropeanOptionPriceBounds(input);

  validateFiniteScalar(marketPrice, "marketPrice");
  validatePositiveScalar(minVol, "minVol");
  validatePositiveScalar(maxVol, "maxVol");
  validatePositiveScalar(tolerance, "tolerance");

  if (!Number.isInteger(maxIterations) || maxIterations <= 0) {
    throw new Error("maxIterations must be a positive integer");
  }

  if (minVol >= maxVol) {
    throw new Error("minVol must be less than maxVol");
  }

  if (marketPrice < lowerBound - BOUND_TOLERANCE) {
    return {
      iterations: 0,
      converged: false,
      priceError: lowerBound - marketPrice,
      lowerBound,
      upperBound,
      warning: "Market price is below the European no-arbitrage lower bound.",
    };
  }

  if (marketPrice > upperBound + BOUND_TOLERANCE) {
    return {
      iterations: 0,
      converged: false,
      priceError: marketPrice - upperBound,
      lowerBound,
      upperBound,
      warning: "Market price is above the European no-arbitrage upper bound.",
    };
  }

  const priceAtMinVol = blackScholesPrice({
    spot,
    strike,
    maturity,
    rate: riskFreeRate,
    volatility: minVol,
    dividendYield,
    optionType,
  });
  const priceAtMaxVol = blackScholesPrice({
    spot,
    strike,
    maturity,
    rate: riskFreeRate,
    volatility: maxVol,
    dividendYield,
    optionType,
  });

  if (marketPrice <= priceAtMinVol) {
    const priceError = priceAtMinVol - marketPrice;

    return {
      impliedVolatility: minVol,
      iterations: 0,
      converged: priceError <= tolerance,
      priceError,
      lowerBound,
      upperBound,
      warning:
        priceError <= tolerance
          ? undefined
          : "Market price is inside no-arbitrage bounds but below the minimum-volatility model price.",
    };
  }

  if (marketPrice >= priceAtMaxVol) {
    const priceError = marketPrice - priceAtMaxVol;

    return {
      impliedVolatility: maxVol,
      iterations: 0,
      converged: priceError <= tolerance,
      priceError,
      lowerBound,
      upperBound,
      warning:
        priceError <= tolerance
          ? undefined
          : "Market price is inside no-arbitrage bounds but above the maximum-volatility model price.",
    };
  }

  let low = minVol;
  let high = maxVol;
  let impliedVolatility = (low + high) / 2;
  let priceError = Number.POSITIVE_INFINITY;
  let iterations = 0;

  for (iterations = 1; iterations <= maxIterations; iterations += 1) {
    impliedVolatility = (low + high) / 2;

    const modelPrice = blackScholesPrice({
      spot,
      strike,
      maturity,
      rate: riskFreeRate,
      volatility: impliedVolatility,
      dividendYield,
      optionType,
    });
    priceError = modelPrice - marketPrice;

    if (Math.abs(priceError) <= tolerance) {
      return {
        impliedVolatility,
        iterations,
        converged: true,
        priceError,
        lowerBound,
        upperBound,
      };
    }

    if (modelPrice > marketPrice) {
      high = impliedVolatility;
    } else {
      low = impliedVolatility;
    }
  }

  validateOptionPricingInput({
    spot,
    strike,
    maturity,
    rate: riskFreeRate,
    volatility: impliedVolatility,
    dividendYield,
    optionType,
  });

  return {
    impliedVolatility,
    iterations: maxIterations,
    converged: false,
    priceError,
    lowerBound,
    upperBound,
    warning: "Bisection did not converge within the configured iteration limit.",
  };
}
