import type {
  MonteCarloPricingInput,
  MonteCarloPricingResult,
  OptionType,
} from "@/lib/finance/options/types";
import {
  validateFiniteScalar,
  validateOptionType,
  validatePositiveScalar,
} from "@/lib/finance/options/validation";

const DEFAULT_SIMULATIONS = 10_000;
const MAX_SIMULATIONS = 100_000;
const DEFAULT_SEED = 42;

function validateSimulations(simulations: number) {
  if (!Number.isInteger(simulations) || simulations <= 0) {
    throw new Error("simulations must be a positive integer");
  }

  if (simulations > MAX_SIMULATIONS) {
    throw new Error(`simulations must be less than or equal to ${MAX_SIMULATIONS}`);
  }
}

function normalizeSeed(seed: number) {
  validateFiniteScalar(seed, "seed");

  return Math.trunc(seed) >>> 0;
}

function createSeededRandom(seed: number) {
  let state = normalizeSeed(seed);

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;

    let result = state;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);

    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function standardNormal(random: () => number) {
  const u1 = Math.max(random(), Number.EPSILON);
  const u2 = random();

  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function optionPayoff(optionType: OptionType, spot: number, strike: number) {
  if (optionType === "call") {
    return Math.max(spot - strike, 0);
  }

  return Math.max(strike - spot, 0);
}

function resolveMonteCarloInput(input: MonteCarloPricingInput) {
  return {
    ...input,
    simulations: input.simulations ?? DEFAULT_SIMULATIONS,
    seed: input.seed ?? DEFAULT_SEED,
    useAntithetic: input.useAntithetic ?? true,
  } satisfies Required<MonteCarloPricingInput>;
}

function validateMonteCarloInput(input: Required<MonteCarloPricingInput>) {
  validateOptionType(input.optionType);
  validatePositiveScalar(input.spot, "spot");
  validatePositiveScalar(input.strike, "strike");
  validatePositiveScalar(input.maturity, "maturity");
  validatePositiveScalar(input.volatility, "volatility");
  validateFiniteScalar(input.riskFreeRate, "riskFreeRate");
  validateFiniteScalar(input.dividendYield, "dividendYield");
  validateSimulations(input.simulations);
  validateFiniteScalar(input.seed, "seed");
}

function discountedPayoff({
  optionType,
  spot,
  strike,
  riskFreeRate,
  dividendYield,
  volatility,
  maturity,
  z,
}: Required<Pick<
  MonteCarloPricingInput,
  | "optionType"
  | "spot"
  | "strike"
  | "riskFreeRate"
  | "dividendYield"
  | "volatility"
  | "maturity"
>> & {
  z: number;
}) {
  const drift =
    (riskFreeRate - dividendYield - 0.5 * volatility * volatility) * maturity;
  const diffusion = volatility * Math.sqrt(maturity) * z;
  const terminalSpot = spot * Math.exp(drift + diffusion);
  const payoff = optionPayoff(optionType, terminalSpot, strike);

  return Math.exp(-riskFreeRate * maturity) * payoff;
}

export function priceEuropeanOptionMonteCarlo(
  input: MonteCarloPricingInput,
): MonteCarloPricingResult {
  const resolved = resolveMonteCarloInput(input);

  validateMonteCarloInput(resolved);

  const seed = normalizeSeed(resolved.seed);
  const antitheticUsed = resolved.useAntithetic;
  const simulations =
    antitheticUsed && resolved.simulations % 2 !== 0
      ? resolved.simulations + 1
      : resolved.simulations;
  const random = createSeededRandom(seed);
  const sampleCount = antitheticUsed ? simulations / 2 : simulations;
  let mean = 0;
  let m2 = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    const z = standardNormal(random);
    const sample = antitheticUsed
      ? (discountedPayoff({ ...resolved, z }) +
          discountedPayoff({ ...resolved, z: -z })) /
        2
      : discountedPayoff({ ...resolved, z });
    const delta = sample - mean;

    mean += delta / (index + 1);
    m2 += delta * (sample - mean);
  }

  const variance = sampleCount > 1 ? m2 / (sampleCount - 1) : 0;
  const standardError = Math.sqrt(variance / sampleCount);
  const confidenceRadius = 1.96 * standardError;

  return {
    monteCarloPrice: mean,
    standardError,
    confidenceInterval95: {
      lower: mean - confidenceRadius,
      upper: mean + confidenceRadius,
    },
    discountedPayoffMean: mean,
    simulations,
    seed,
    antitheticUsed,
  };
}
