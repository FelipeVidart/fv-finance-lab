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
  optionType: OptionType;
  steps: number;
  exerciseStyle: ExerciseStyle;
  intrinsicValue: number;
  earlyExercisePremium: number;
  europeanPrice?: number;
};

export type BinomialConvergencePoint = {
  steps: number;
  price: number;
  absoluteDifference?: number;
  europeanPrice?: number;
  earlyExercisePremium?: number;
};

export type FiniteDifferenceInput = {
  optionType: OptionType;
  spot: number;
  strike: number;
  riskFreeRate: number;
  dividendYield: number;
  volatility: number;
  maturity: number;
  sMax?: number;
  spaceSteps?: number;
  timeSteps?: number;
};

export type FiniteDifferenceResult = {
  price: number;
  gridSpotValues: number[];
  gridOptionValues: number[];
  metadata: {
    sMax: number;
    spaceSteps: number;
    timeSteps: number;
    dS: number;
    dt: number;
  };
};

export type MonteCarloPricingInput = {
  optionType: OptionType;
  spot: number;
  strike: number;
  riskFreeRate: number;
  dividendYield: number;
  volatility: number;
  maturity: number;
  simulations?: number;
  seed?: number;
  useAntithetic?: boolean;
};

export type MonteCarloPricingResult = {
  monteCarloPrice: number;
  standardError: number;
  confidenceInterval95: {
    lower: number;
    upper: number;
  };
  discountedPayoffMean: number;
  simulations: number;
  seed: number;
  antitheticUsed: boolean;
};

export type ImpliedVolatilityInput = {
  marketPrice: number;
  optionType: OptionType;
  spot: number;
  strike: number;
  riskFreeRate: number;
  dividendYield: number;
  maturity: number;
  minVol?: number;
  maxVol?: number;
  tolerance?: number;
  maxIterations?: number;
};

export type ImpliedVolatilityResult = {
  impliedVolatility?: number;
  iterations: number;
  converged: boolean;
  priceError: number;
  lowerBound: number;
  upperBound: number;
  warning?: string;
};

export type SensitivityScenarioType = "volatility" | "spot" | "maturity";

export type SensitivityPricingInput = OptionPricingInput & {
  exerciseStyle?: ExerciseStyle;
  steps?: number;
};

export type SensitivityScenarioRow = {
  label: string;
  inputValue: number;
  price: number;
  priceDifference: number;
  percentageDifference: number;
  isBase: boolean;
};

export type SensitivityScenarioResult = {
  scenarioType: SensitivityScenarioType;
  basePrice: number;
  exerciseStyle: ExerciseStyle;
  rows: SensitivityScenarioRow[];
};

export type OptionLegPosition = "long" | "short";

export type OptionLeg = {
  id: string;
  label: string;
  optionType: OptionType;
  position: OptionLegPosition;
  strike: number;
  premium: number;
  quantity: number;
};

export type StrategyBias =
  | "bullish"
  | "bearish"
  | "neutral"
  | "volatility expansion"
  | "income / premium collection";

export type StrategyPresetId =
  | "long-call"
  | "long-put"
  | "bull-call-spread"
  | "bear-put-spread"
  | "long-straddle"
  | "long-strangle";

export type StrategyDefinition = {
  id: StrategyPresetId;
  name: string;
  description: string;
  bias: StrategyBias;
  legs: OptionLeg[];
};

export type StrategyPayoffPoint = {
  spot: number;
  payoff: number;
  profit: number;
};

export type StrategyMetrics = {
  netPremium: number;
  maxProfit?: number;
  maxLoss?: number;
  breakevenPoints: number[];
  bias: StrategyBias;
  metricSource: "exact" | "plotted range";
};

export type StrategyAnalysis = {
  strategy: StrategyDefinition;
  payoffPoints: StrategyPayoffPoint[];
  metrics: StrategyMetrics;
};

export type DirectionalView = "bullish" | "bearish" | "neutral" | "large-move";

export type VolatilityView = "cheap" | "fair" | "expensive";

export type RiskPreference =
  | "defined-risk"
  | "willing-to-own-underlying"
  | "willing-to-cap-upside";

export type OwnershipStatus = "owns-underlying" | "does-not-own-underlying";

export type StrategySuggestion = {
  strategyId: StrategyPresetId;
  strategyName: string;
  scenarioFit: string;
  explanation: string;
  riskNote: string;
  volatilityLogic: string;
  directionalLogic: string;
};

export type FutureStrategyCandidate = {
  name: string;
  note: string;
};

export type StrategyScreenerInput = {
  expectedVolatility: number;
  impliedVolatility: number;
  directionalView: DirectionalView;
  riskPreference: RiskPreference;
  ownershipStatus: OwnershipStatus;
};

export type StrategyScreenerResult = {
  volatilityView: VolatilityView;
  volatilitySpread: number;
  volatilitySpreadPercent: number;
  volatilityInterpretation: string;
  suggestions: StrategySuggestion[];
  futureCandidates: FutureStrategyCandidate[];
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
