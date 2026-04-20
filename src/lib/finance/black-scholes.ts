export type OptionType = "call" | "put";

export type BlackScholesInput = {
  spot: number;
  strike: number;
  maturity: number;
  rate: number;
  volatility: number;
  dividendYield: number;
  optionType: OptionType;
};

const SQRT_TWO_PI = Math.sqrt(2 * Math.PI);

function assertFinite(value: number, field: string) {
  if (!Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
}

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

export function blackScholesPrice({
  spot,
  strike,
  maturity,
  rate,
  volatility,
  dividendYield,
  optionType,
}: BlackScholesInput): number {
  if (optionType !== "call" && optionType !== "put") {
    throw new Error("optionType must be 'call' or 'put'");
  }

  assertFinite(spot, "spot");
  assertFinite(strike, "strike");
  assertFinite(maturity, "maturity");
  assertFinite(rate, "rate");
  assertFinite(volatility, "volatility");
  assertFinite(dividendYield, "dividendYield");

  if (spot <= 0) throw new Error("spot must be positive");
  if (strike <= 0) throw new Error("strike must be positive");
  if (maturity <= 0) throw new Error("maturity must be positive");
  if (volatility <= 0) throw new Error("volatility must be positive");

  const sqrtT = Math.sqrt(maturity);
  const sigmaSqrtT = volatility * sqrtT;
  const d1 =
    (Math.log(spot / strike) +
      (rate - dividendYield + 0.5 * volatility * volatility) * maturity) /
    sigmaSqrtT;
  const d2 = d1 - sigmaSqrtT;

  const discountedSpot = spot * Math.exp(-dividendYield * maturity);
  const discountedStrike = strike * Math.exp(-rate * maturity);

  if (optionType === "call") {
    return discountedSpot * normalCdf(d1) - discountedStrike * normalCdf(d2);
  }

  return discountedStrike * normalCdf(-d2) - discountedSpot * normalCdf(-d1);
}
