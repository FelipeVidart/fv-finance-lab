import type { BlackScholesInput, OptionType } from "@/lib/finance/black-scholes";

export type OptionPayoffPoint = {
  spot: number;
  payoff: number;
  profit: number;
};

const MIN_SPOT = 0.01;

export function optionPayoffAtExpiry(
  optionType: OptionType,
  spot: number,
  strike: number,
): number {
  if (!Number.isFinite(spot)) {
    throw new Error("spot must be a finite number");
  }

  if (!Number.isFinite(strike)) {
    throw new Error("strike must be a finite number");
  }

  if (spot < 0) {
    throw new Error("spot must be non-negative");
  }

  if (strike <= 0) {
    throw new Error("strike must be positive");
  }

  if (optionType === "call") {
    return Math.max(spot - strike, 0);
  }

  if (optionType === "put") {
    return Math.max(strike - spot, 0);
  }

  throw new Error("optionType must be 'call' or 'put'");
}

export function getOptionSpotRange({
  spot,
  strike,
}: Pick<BlackScholesInput, "spot" | "strike">): { min: number; max: number } {
  if (!Number.isFinite(spot) || spot <= 0) {
    throw new Error("spot must be positive");
  }

  if (!Number.isFinite(strike) || strike <= 0) {
    throw new Error("strike must be positive");
  }

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
  if (!Number.isFinite(optionPrice)) {
    throw new Error("optionPrice must be a finite number");
  }

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
