import type { OptionType } from "@/lib/finance/black-scholes";

export type EuropeanBinomialInput = {
  spot: number;
  strike: number;
  rate: number;
  volatility: number;
  maturityYears: number;
  steps: number;
  optionType: OptionType;
  dividendYield?: number;
};

function assertFinite(value: number, field: string) {
  if (!Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
}

function validateInput({
  spot,
  strike,
  rate,
  volatility,
  maturityYears,
  steps,
  optionType,
  dividendYield = 0,
}: EuropeanBinomialInput) {
  if (optionType !== "call" && optionType !== "put") {
    throw new Error("optionType must be 'call' or 'put'");
  }

  assertFinite(spot, "spot");
  assertFinite(strike, "strike");
  assertFinite(rate, "rate");
  assertFinite(volatility, "volatility");
  assertFinite(maturityYears, "maturityYears");
  assertFinite(steps, "steps");
  assertFinite(dividendYield, "dividendYield");

  if (spot <= 0) throw new Error("spot must be positive");
  if (strike <= 0) throw new Error("strike must be positive");
  if (maturityYears <= 0) throw new Error("maturityYears must be positive");
  if (volatility <= 0) throw new Error("volatility must be positive");
  if (!Number.isInteger(steps) || steps <= 0) {
    throw new Error("steps must be a positive integer");
  }
}

export function vanillaPayoff(
  spot: number,
  strike: number,
  optionType: OptionType,
): number {
  assertFinite(spot, "spot");
  assertFinite(strike, "strike");

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

export function priceEuropeanBinomial(input: EuropeanBinomialInput): number {
  validateInput(input);

  const {
    spot,
    strike,
    rate,
    volatility,
    maturityYears,
    steps,
    optionType,
    dividendYield = 0,
  } = input;

  const dt = maturityYears / steps;
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
    optionValues[j] = vanillaPayoff(terminalSpot, strike, optionType);
  }

  for (let step = steps - 1; step >= 0; step -= 1) {
    for (let j = 0; j <= step; j += 1) {
      optionValues[j] =
        discount * (p * optionValues[j + 1] + (1 - p) * optionValues[j]);
    }
  }

  return optionValues[0];
}

export function buildBinomialConvergenceSeries(
  input: Omit<EuropeanBinomialInput, "steps">,
  referencePrice: number,
  stepCounts: number[],
): Array<{ steps: number; price: number; absoluteDifference: number }> {
  assertFinite(referencePrice, "referencePrice");

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
