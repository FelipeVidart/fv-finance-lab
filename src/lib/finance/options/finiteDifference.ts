import type {
  FiniteDifferenceInput,
  FiniteDifferenceResult,
  OptionType,
} from "@/lib/finance/options/types";
import {
  validateFiniteScalar,
  validateOptionType,
  validatePositiveScalar,
} from "@/lib/finance/options/validation";

const DEFAULT_GRID_STEPS = 160;

function validateGridSteps(value: number, field: string) {
  if (!Number.isInteger(value) || value <= 10) {
    throw new Error(`${field} must be an integer greater than 10`);
  }
}

function payoffAtExpiry(
  optionType: OptionType,
  spot: number,
  strike: number,
): number {
  if (optionType === "call") {
    return Math.max(spot - strike, 0);
  }

  return Math.max(strike - spot, 0);
}

function boundaryValue({
  optionType,
  sMax,
  strike,
  riskFreeRate,
  dividendYield,
  tau,
  side,
}: {
  optionType: OptionType;
  sMax: number;
  strike: number;
  riskFreeRate: number;
  dividendYield: number;
  tau: number;
  side: "lower" | "upper";
}): number {
  if (optionType === "call") {
    return side === "lower"
      ? 0
      : sMax * Math.exp(-dividendYield * tau) -
          strike * Math.exp(-riskFreeRate * tau);
  }

  return side === "lower" ? strike * Math.exp(-riskFreeRate * tau) : 0;
}

function solveTridiagonal(
  lower: number[],
  diagonal: number[],
  upper: number[],
  rightHandSide: number[],
): number[] {
  const n = diagonal.length;
  const cPrime = new Array<number>(n);
  const dPrime = new Array<number>(n);
  const solution = new Array<number>(n);

  cPrime[0] = upper[0] / diagonal[0];
  dPrime[0] = rightHandSide[0] / diagonal[0];

  for (let i = 1; i < n; i += 1) {
    const denominator = diagonal[i] - lower[i] * cPrime[i - 1];

    cPrime[i] = i === n - 1 ? 0 : upper[i] / denominator;
    dPrime[i] = (rightHandSide[i] - lower[i] * dPrime[i - 1]) / denominator;
  }

  solution[n - 1] = dPrime[n - 1];

  for (let i = n - 2; i >= 0; i -= 1) {
    solution[i] = dPrime[i] - cPrime[i] * solution[i + 1];
  }

  return solution;
}

function validateFiniteDifferenceInput({
  optionType,
  spot,
  strike,
  riskFreeRate,
  dividendYield,
  volatility,
  maturity,
  sMax,
  spaceSteps,
  timeSteps,
}: Required<FiniteDifferenceInput>) {
  validateOptionType(optionType);
  validatePositiveScalar(spot, "spot");
  validatePositiveScalar(strike, "strike");
  validatePositiveScalar(maturity, "maturity");
  validatePositiveScalar(volatility, "volatility");
  validatePositiveScalar(sMax, "sMax");
  validateFiniteScalar(riskFreeRate, "riskFreeRate");
  validateFiniteScalar(dividendYield, "dividendYield");
  validateGridSteps(spaceSteps, "spaceSteps");
  validateGridSteps(timeSteps, "timeSteps");

  if (sMax <= spot) {
    throw new Error("sMax must be greater than spot");
  }
}

export function priceEuropeanOptionCrankNicolson(
  input: FiniteDifferenceInput,
): FiniteDifferenceResult {
  const resolved = {
    ...input,
    sMax: input.sMax ?? Math.max(input.spot, input.strike) * 3,
    spaceSteps: input.spaceSteps ?? DEFAULT_GRID_STEPS,
    timeSteps: input.timeSteps ?? DEFAULT_GRID_STEPS,
  } satisfies Required<FiniteDifferenceInput>;

  validateFiniteDifferenceInput(resolved);

  const {
    optionType,
    spot,
    strike,
    riskFreeRate,
    dividendYield,
    volatility,
    maturity,
    sMax,
    spaceSteps,
    timeSteps,
  } = resolved;
  const dS = sMax / spaceSteps;
  const dt = maturity / timeSteps;
  const gridSpotValues = Array.from(
    { length: spaceSteps + 1 },
    (_, index) => index * dS,
  );
  let optionValues = gridSpotValues.map((gridSpot) =>
    payoffAtExpiry(optionType, gridSpot, strike),
  );
  const interiorCount = spaceSteps - 1;

  for (let timeIndex = 0; timeIndex < timeSteps; timeIndex += 1) {
    const tauOld = timeIndex * dt;
    const tauNew = (timeIndex + 1) * dt;
    const lowerBoundaryOld = boundaryValue({
      optionType,
      sMax,
      strike,
      riskFreeRate,
      dividendYield,
      tau: tauOld,
      side: "lower",
    });
    const upperBoundaryOld = boundaryValue({
      optionType,
      sMax,
      strike,
      riskFreeRate,
      dividendYield,
      tau: tauOld,
      side: "upper",
    });
    const lowerBoundaryNew = boundaryValue({
      optionType,
      sMax,
      strike,
      riskFreeRate,
      dividendYield,
      tau: tauNew,
      side: "lower",
    });
    const upperBoundaryNew = boundaryValue({
      optionType,
      sMax,
      strike,
      riskFreeRate,
      dividendYield,
      tau: tauNew,
      side: "upper",
    });
    const lower = new Array<number>(interiorCount);
    const diagonal = new Array<number>(interiorCount);
    const upper = new Array<number>(interiorCount);
    const rightHandSide = new Array<number>(interiorCount);

    optionValues[0] = lowerBoundaryOld;
    optionValues[spaceSteps] = upperBoundaryOld;

    for (let i = 1; i < spaceSteps; i += 1) {
      const row = i - 1;
      const gridSpot = i * dS;
      const diffusion =
        0.5 * volatility * volatility * gridSpot * gridSpot / (dS * dS);
      const convection = ((riskFreeRate - dividendYield) * gridSpot) / (2 * dS);
      const a = diffusion - convection;
      const b = -2 * diffusion - riskFreeRate;
      const c = diffusion + convection;

      lower[row] = row === 0 ? 0 : -0.5 * dt * a;
      diagonal[row] = 1 - 0.5 * dt * b;
      upper[row] = row === interiorCount - 1 ? 0 : -0.5 * dt * c;
      rightHandSide[row] =
        0.5 * dt * a * optionValues[i - 1] +
        (1 + 0.5 * dt * b) * optionValues[i] +
        0.5 * dt * c * optionValues[i + 1];

      if (i === 1) {
        rightHandSide[row] += 0.5 * dt * a * lowerBoundaryNew;
      }

      if (i === spaceSteps - 1) {
        rightHandSide[row] += 0.5 * dt * c * upperBoundaryNew;
      }
    }

    const interiorValues = solveTridiagonal(
      lower,
      diagonal,
      upper,
      rightHandSide,
    );
    const nextValues = new Array<number>(spaceSteps + 1);

    nextValues[0] = lowerBoundaryNew;
    nextValues[spaceSteps] = upperBoundaryNew;

    for (let i = 1; i < spaceSteps; i += 1) {
      nextValues[i] = interiorValues[i - 1];
    }

    optionValues = nextValues;
  }

  const lowerIndex = Math.floor(spot / dS);

  if (lowerIndex >= spaceSteps) {
    throw new Error("spot must be inside the finite-difference grid");
  }

  const lowerSpot = gridSpotValues[lowerIndex];
  const upperSpot = gridSpotValues[lowerIndex + 1];
  const interpolationWeight = (spot - lowerSpot) / (upperSpot - lowerSpot);
  const price =
    optionValues[lowerIndex] +
    interpolationWeight *
      (optionValues[lowerIndex + 1] - optionValues[lowerIndex]);

  return {
    price,
    gridSpotValues,
    gridOptionValues: optionValues,
    metadata: {
      sMax,
      spaceSteps,
      timeSteps,
      dS,
      dt,
    },
  };
}
