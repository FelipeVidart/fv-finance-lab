import type {
  BlackScholesInput,
  OptionPayoffPoint,
  OptionType,
} from "@/lib/finance/options/types";
import {
  validateFiniteScalar,
  validateNonNegativeScalar,
  validateOptionType,
  validatePositiveScalar,
} from "@/lib/finance/options/validation";

const MIN_SPOT = 0.01;

export function optionPayoffAtExpiry(
  optionType: OptionType,
  spot: number,
  strike: number,
): number {
  validateOptionType(optionType);
  validateNonNegativeScalar(spot, "spot");
  validatePositiveScalar(strike, "strike");

  if (optionType === "call") {
    return Math.max(spot - strike, 0);
  }

  return Math.max(strike - spot, 0);
}

export function getOptionSpotRange({
  spot,
  strike,
}: Pick<BlackScholesInput, "spot" | "strike">): { min: number; max: number } {
  validatePositiveScalar(spot, "spot");
  validatePositiveScalar(strike, "strike");

  return {
    min: Math.max(MIN_SPOT, Math.min(spot, strike) * 0.5),
    max: Math.max(spot, strike) * 1.5,
  };
}

export function buildOptionPayoffSeries(
  input: Pick<BlackScholesInput, "optionType" | "spot" | "strike">,
  optionPrice: number,
  points = 61,
): OptionPayoffPoint[] {
  validateFiniteScalar(optionPrice, "optionPrice");

  if (!Number.isInteger(points) || points < 2) {
    throw new Error("points must be an integer greater than 1");
  }

  const range = getOptionSpotRange(input);
  const step = (range.max - range.min) / (points - 1);

  return Array.from({ length: points }, (_, index) => {
    const spotValue = range.min + step * index;
    const payoff = optionPayoffAtExpiry(
      input.optionType,
      spotValue,
      input.strike,
    );

    return {
      spot: spotValue,
      payoff,
      profit: payoff - optionPrice,
    };
  });
}
