import type {
  BlackScholesGreeks,
  BlackScholesInput,
  BlackScholesValuation,
} from "@/lib/finance/options/types";
import {
  assertFinite,
  validateOptionPricingInput,
} from "@/lib/finance/options/validation";

const SQRT_TWO_PI = Math.sqrt(2 * Math.PI);

export function normalCdf(x: number): number {
  assertFinite(x, "x");

  const absX = Math.abs(x);
  const t = 1 / (1 + 0.2316419 * absX);
  const polynomial =
    t *
    (0.31938153 +
      t *
        (-0.356563782 +
          t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const density = Math.exp(-0.5 * absX * absX) / SQRT_TWO_PI;
  const cdf = 1 - density * polynomial;

  return x >= 0 ? cdf : 1 - cdf;
}

export function normalPdf(x: number): number {
  assertFinite(x, "x");

  return Math.exp(-0.5 * x * x) / SQRT_TWO_PI;
}

function getModelTerms(input: BlackScholesInput) {
  validateOptionPricingInput(input);

  const { spot, strike, maturity, rate, volatility, dividendYield } = input;
  const sqrtT = Math.sqrt(maturity);
  const sigmaSqrtT = volatility * sqrtT;
  const d1 =
    (Math.log(spot / strike) +
      (rate - dividendYield + 0.5 * volatility * volatility) * maturity) /
    sigmaSqrtT;
  const d2 = d1 - sigmaSqrtT;
  const discountedSpot = spot * Math.exp(-dividendYield * maturity);
  const discountedStrike = strike * Math.exp(-rate * maturity);
  const densityD1 = normalPdf(d1);

  return {
    d1,
    d2,
    densityD1,
    discountedSpot,
    discountedStrike,
    sqrtT,
  };
}

export function blackScholesPrice(input: BlackScholesInput): number {
  const { d1, d2, discountedSpot, discountedStrike } = getModelTerms(input);
  const { optionType } = input;

  if (optionType === "call") {
    return discountedSpot * normalCdf(d1) - discountedStrike * normalCdf(d2);
  }

  return discountedStrike * normalCdf(-d2) - discountedSpot * normalCdf(-d1);
}

export function blackScholesDelta(input: BlackScholesInput): number {
  const { d1 } = getModelTerms(input);
  const { maturity, dividendYield, optionType } = input;
  const dividendDiscount = Math.exp(-dividendYield * maturity);

  if (optionType === "call") {
    return dividendDiscount * normalCdf(d1);
  }

  return dividendDiscount * (normalCdf(d1) - 1);
}

export function blackScholesGamma(input: BlackScholesInput): number {
  const { densityD1, sqrtT } = getModelTerms(input);
  const { spot, maturity, volatility, dividendYield } = input;
  const dividendDiscount = Math.exp(-dividendYield * maturity);

  return (dividendDiscount * densityD1) / (spot * volatility * sqrtT);
}

export function blackScholesVega(input: BlackScholesInput): number {
  const { densityD1, sqrtT } = getModelTerms(input);
  const { spot, maturity, dividendYield } = input;
  const dividendDiscount = Math.exp(-dividendYield * maturity);

  return spot * dividendDiscount * densityD1 * sqrtT;
}

export function blackScholesTheta(input: BlackScholesInput): number {
  const {
    d1,
    d2,
    densityD1,
    discountedSpot,
    discountedStrike,
    sqrtT,
  } = getModelTerms(input);
  const { rate, volatility, dividendYield, optionType } = input;
  const timeDecay = (-discountedSpot * densityD1 * volatility) / (2 * sqrtT);

  if (optionType === "call") {
    return (
      timeDecay -
      rate * discountedStrike * normalCdf(d2) +
      dividendYield * discountedSpot * normalCdf(d1)
    );
  }

  return (
    timeDecay +
    rate * discountedStrike * normalCdf(-d2) -
    dividendYield * discountedSpot * normalCdf(-d1)
  );
}

export function blackScholesRho(input: BlackScholesInput): number {
  const { d2, discountedStrike } = getModelTerms(input);
  const { maturity, optionType } = input;

  if (optionType === "call") {
    return maturity * discountedStrike * normalCdf(d2);
  }

  return -maturity * discountedStrike * normalCdf(-d2);
}

export function blackScholesGreeks(
  input: BlackScholesInput,
): BlackScholesGreeks {
  return {
    delta: blackScholesDelta(input),
    gamma: blackScholesGamma(input),
    vega: blackScholesVega(input),
    theta: blackScholesTheta(input),
    rho: blackScholesRho(input),
  };
}

export function blackScholesValuation(
  input: BlackScholesInput,
): BlackScholesValuation {
  return {
    price: blackScholesPrice(input),
    ...blackScholesGreeks(input),
  };
}
