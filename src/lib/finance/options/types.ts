export type OptionType = "call" | "put";

export type ExerciseStyle = "european" | "american";

export type OptionPricingInput = {
  spot: number;
  strike: number;
  maturity: number;
  rate: number;
  volatility: number;
  dividendYield: number;
  optionType: OptionType;
};

export type Greeks = {
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
};

export type BlackScholesResult = Greeks & {
  price: number;
};

export type BinomialPricingInput = {
  spot: number;
  strike: number;
  rate: number;
  volatility: number;
  maturity: number;
  steps: number;
  optionType: OptionType;
  dividendYield?: number;
  exerciseStyle?: ExerciseStyle;
};

export type BinomialPricingResult = {
  price: number;
  steps: number;
  exerciseStyle: "european";
};

export type BinomialConvergencePoint = {
  steps: number;
  price: number;
  absoluteDifference: number;
};

export type PayoffPoint = {
  spot: number;
  payoff: number;
  profit: number;
};

export type BlackScholesInput = OptionPricingInput;
export type BlackScholesGreeks = Greeks;
export type BlackScholesValuation = BlackScholesResult;
export type EuropeanBinomialInput = Omit<BinomialPricingInput, "maturity"> & {
  maturityYears: number;
};
export type OptionPayoffPoint = PayoffPoint;
