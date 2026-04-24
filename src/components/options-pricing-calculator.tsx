"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { ExpandableChartCard } from "@/components/expandable-chart-card";
import { OptionsPayoffChart } from "@/components/options-payoff-chart";
import { StrategyPayoffChart } from "@/components/strategy-payoff-chart";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
import {
  analyzeStrategy,
  buildCrrBinomialConvergenceSeries,
  buildBinomialConvergenceSeries,
  buildOptionPayoffSeries,
  buildOptionSensitivityScenarios,
  buildStrategyPreset,
  blackScholesValuation,
  getEuropeanOptionPriceBounds,
  priceCrrBinomial,
  screenOptionStrategies,
  solveImpliedVolatility,
  type BinomialConvergencePoint,
  type BinomialPricingResult,
  type BlackScholesInput,
  type DirectionalView,
  type BlackScholesValuation,
  type ExerciseStyle,
  type ImpliedVolatilityResult,
  type OwnershipStatus,
  type OptionLeg,
  type OptionType,
  type RiskPreference,
  type SensitivityScenarioResult,
  type SensitivityScenarioType,
  type StrategyAnalysis,
  type StrategyDefinition,
  type StrategyPresetId,
  type StrategyScreenerResult,
} from "@/lib/finance/options";

type FormState = {
  spot: string;
  strike: string;
  maturity: string;
  rate: string;
  volatility: string;
  dividendYield: string;
  steps: string;
  optionType: OptionType;
  exerciseStyle: ExerciseStyle;
};

type FieldName = keyof Omit<FormState, "optionType" | "exerciseStyle">;
type FormErrors = Partial<Record<keyof FormState, string>>;
type CalculatorInput = BlackScholesInput & {
  steps: number;
  exerciseStyle: ExerciseStyle;
};
type PricingState = {
  blackScholes: BlackScholesValuation;
  binomial: BinomialPricingResult;
  europeanBinomial: BinomialPricingResult;
  primaryPrice: number;
  binomialPrice: number;
  absoluteDifference: number;
  percentageDifference: number;
  earlyExercisePremium: number;
  convergence: BinomialConvergencePoint[];
  inputs: CalculatorInput;
};
type StrategyLegInput = {
  id: string;
  strike: string;
  premium: string;
};
type OptionSectionId =
  | "pricing"
  | "comparison"
  | "volatility"
  | "strategies";

const sensitivityScenarioConfig: Array<{
  id: SensitivityScenarioType;
  label: string;
  inputLabel: string;
  interpretation: string;
}> = [
  {
    id: "volatility",
    label: "Volatility",
    inputLabel: "Volatility",
    interpretation: "Higher volatility generally increases vanilla option value.",
  },
  {
    id: "spot",
    label: "Spot",
    inputLabel: "Spot",
    interpretation: "Spot sensitivity depends on call or put direction.",
  },
  {
    id: "maturity",
    label: "Maturity",
    inputLabel: "Maturity",
    interpretation:
      "Maturity effects can vary with dividends, rates, and moneyness.",
  },
];

const strategyPresetConfig: Array<{
  id: StrategyPresetId;
  label: string;
  summary: string;
}> = [
  {
    id: "long-call",
    label: "Long call",
    summary: "Bullish upside exposure with limited premium at risk.",
  },
  {
    id: "long-put",
    label: "Long put",
    summary: "Bearish downside exposure with limited premium at risk.",
  },
  {
    id: "bull-call-spread",
    label: "Bull call spread",
    summary: "Defined-risk bullish call spread with capped upside.",
  },
  {
    id: "bear-put-spread",
    label: "Bear put spread",
    summary: "Defined-risk bearish put spread with capped downside profit.",
  },
  {
    id: "long-straddle",
    label: "Long straddle",
    summary: "Long ATM call and put for large moves in either direction.",
  },
  {
    id: "long-strangle",
    label: "Long strangle",
    summary: "Long OTM put and call with wider breakevens.",
  },
];

const directionalViewConfig: Array<{
  id: DirectionalView;
  label: string;
  description: string;
}> = [
  {
    id: "bullish",
    label: "Bullish",
    description: "Upside directional view",
  },
  {
    id: "bearish",
    label: "Bearish",
    description: "Downside directional view",
  },
  {
    id: "neutral",
    label: "Neutral",
    description: "No strong direction",
  },
  {
    id: "large-move",
    label: "Large move",
    description: "Movement matters more than direction",
  },
];

const riskPreferenceConfig: Array<{
  id: RiskPreference;
  label: string;
  description: string;
}> = [
  {
    id: "defined-risk",
    label: "Defined risk",
    description: "Prefer capped loss structures",
  },
  {
    id: "willing-to-own-underlying",
    label: "Willing to own",
    description: "Open to future ownership",
  },
  {
    id: "willing-to-cap-upside",
    label: "Cap upside",
    description: "Open to limiting upside",
  },
];

const ownershipStatusConfig: Array<{
  id: OwnershipStatus;
  label: string;
  description: string;
}> = [
  {
    id: "does-not-own-underlying",
    label: "No underlying",
    description: "Options-only structure",
  },
  {
    id: "owns-underlying",
    label: "Owns underlying",
    description: "Underlying position exists",
  },
];

const DEFAULT_FORM: FormState = {
  optionType: "call",
  exerciseStyle: "european",
  spot: "100",
  strike: "100",
  maturity: "1",
  rate: "0.05",
  volatility: "0.20",
  dividendYield: "0.02",
  steps: "100",
};

const numericFieldConfig: Array<{
  name: FieldName;
  label: string;
  step: string;
  hint: string;
}> = [
  {
    name: "spot",
    label: "Spot price",
    step: "0.01",
    hint: "Current underlying price",
  },
  {
    name: "strike",
    label: "Strike price",
    step: "0.01",
    hint: "Exercise price",
  },
  {
    name: "maturity",
    label: "Time to maturity",
    step: "0.01",
    hint: "Years until expiry",
  },
  {
    name: "rate",
    label: "Risk-free rate",
    step: "0.0001",
    hint: "Decimal form, e.g. 0.05",
  },
  {
    name: "volatility",
    label: "Volatility",
    step: "0.0001",
    hint: "Annualized sigma in decimals",
  },
  {
    name: "dividendYield",
    label: "Dividend yield",
    step: "0.0001",
    hint: "Continuous dividend yield",
  },
  {
    name: "steps",
    label: "Binomial steps",
    step: "1",
    hint: "Positive integer for the CRR tree",
  },
];

const optionSections: Array<{
  id: OptionSectionId;
  label: string;
  description: string;
  step: string;
}> = [
  {
    id: "pricing",
    step: "01",
    label: "Pricing",
    description: "Configure the contract, run the model set, and inspect Greeks and payoff.",
  },
  {
    id: "comparison",
    step: "02",
    label: "Model comparison",
    description: "Cross-check Black-Scholes against the CRR tree and convergence path.",
  },
  {
    id: "volatility",
    step: "03",
    label: "Volatility",
    description: "Solve implied volatility and inspect one-input sensitivity scenarios.",
  },
  {
    id: "strategies",
    step: "04",
    label: "Strategies",
    description: "Build preset multi-leg payoffs and inspect expiry P/L metrics.",
  },
];

const greekDisplayConfig: Array<{
  key: keyof BlackScholesValuation;
  label: string;
  unit: string;
}> = [
  {
    key: "delta",
    label: "Delta",
    unit: "Unitless",
  },
  {
    key: "gamma",
    label: "Gamma",
    unit: "Per $1 spot",
  },
  {
    key: "vega",
    label: "Vega",
    unit: "Per 1.00 vol",
  },
  {
    key: "theta",
    label: "Theta",
    unit: "Per year",
  },
  {
    key: "rho",
    label: "Rho",
    unit: "Per 1.00 rate",
  },
];

function parsePositiveNumber(
  value: string,
  label: string,
): { value?: number; error?: string } {
  if (value.trim() === "") {
    return { error: `${label} is required` };
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return { error: `${label} must be a valid number` };
  }

  if (parsed <= 0) {
    return { error: `${label} must be positive` };
  }

  return { value: parsed };
}

function parseFiniteNumber(
  value: string,
  label: string,
): { value?: number; error?: string } {
  if (value.trim() === "") {
    return { error: `${label} is required` };
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return { error: `${label} must be a valid number` };
  }

  return { value: parsed };
}

function parsePositiveInteger(
  value: string,
  label: string,
): { value?: number; error?: string } {
  if (value.trim() === "") {
    return { error: `${label} is required` };
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return { error: `${label} must be a valid number` };
  }

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: `${label} must be a positive integer` };
  }

  return { value: parsed };
}

function parseForm(form: FormState): {
  errors: FormErrors;
  values?: CalculatorInput;
} {
  const errors: FormErrors = {};

  const spot = parsePositiveNumber(form.spot, "Spot price");
  const strike = parsePositiveNumber(form.strike, "Strike price");
  const maturity = parsePositiveNumber(form.maturity, "Time to maturity");
  const rate = parseFiniteNumber(form.rate, "Risk-free rate");
  const volatility = parsePositiveNumber(form.volatility, "Volatility");
  const dividendYield = parseFiniteNumber(
    form.dividendYield,
    "Dividend yield",
  );
  const steps = parsePositiveInteger(form.steps, "Binomial steps");

  if (spot.error) errors.spot = spot.error;
  if (strike.error) errors.strike = strike.error;
  if (maturity.error) errors.maturity = maturity.error;
  if (rate.error) errors.rate = rate.error;
  if (volatility.error) errors.volatility = volatility.error;
  if (dividendYield.error) errors.dividendYield = dividendYield.error;
  if (steps.error) errors.steps = steps.error;

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors,
    values: {
      optionType: form.optionType,
      exerciseStyle: form.exerciseStyle,
      spot: spot.value as number,
      strike: strike.value as number,
      maturity: maturity.value as number,
      rate: rate.value as number,
      volatility: volatility.value as number,
      dividendYield: dividendYield.value as number,
      steps: steps.value as number,
    },
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function formatInputNumber(value: number): string {
  return Number(value.toFixed(6)).toString();
}

function formatPercent(value: number): string {
  return `${formatNumber(value * 100)}%`;
}

function formatScenarioInput(
  scenarioType: SensitivityScenarioType,
  value: number,
): string {
  if (scenarioType === "volatility") {
    return formatPercent(value);
  }

  if (scenarioType === "maturity") {
    return `${formatNumber(value)} years`;
  }

  return formatNumber(value);
}

function formatFiniteOrUnlimited(value: number | undefined): string {
  return value === undefined ? "Unlimited" : formatNumber(value);
}

function formatBreakevens(values: number[]): string {
  if (values.length === 0) {
    return "None in range";
  }

  return values.map(formatNumber).join(", ");
}

function formatVolatilityView(value: StrategyScreenerResult["volatilityView"]) {
  if (value === "cheap") {
    return "Cheap";
  }

  if (value === "expensive") {
    return "Expensive";
  }

  return "Fair";
}

function strategyContextFromPricing(pricing: PricingState) {
  return {
    spot: pricing.inputs.spot,
    strike: pricing.inputs.strike,
    maturity: pricing.inputs.maturity,
    rate: pricing.inputs.rate,
    volatility: pricing.inputs.volatility,
    dividendYield: pricing.inputs.dividendYield,
  };
}

function buildDefaultStrategy(
  pricing: PricingState,
  presetId: StrategyPresetId,
): StrategyDefinition {
  return buildStrategyPreset(presetId, strategyContextFromPricing(pricing));
}

function getLegInputs(legs: OptionLeg[]): StrategyLegInput[] {
  return legs.map((leg) => ({
    id: leg.id,
    strike: formatInputNumber(leg.strike),
    premium: formatInputNumber(leg.premium),
  }));
}

function applyLegInputs(
  strategy: StrategyDefinition,
  legInputs: StrategyLegInput[],
): StrategyDefinition | null {
  const nextLegs = strategy.legs.map((leg) => {
    const edited = legInputs.find((entry) => entry.id === leg.id);
    const strike = Number(edited?.strike);
    const premium = Number(edited?.premium);

    if (!Number.isFinite(strike) || strike <= 0) {
      return null;
    }

    if (!Number.isFinite(premium) || premium < 0) {
      return null;
    }

    return {
      ...leg,
      strike,
      premium,
    };
  });

  if (nextLegs.some((leg) => leg === null)) {
    return null;
  }

  return {
    ...strategy,
    legs: nextLegs as OptionLeg[],
  };
}

function buildPricingState(values: CalculatorInput): PricingState {
  const blackScholes = blackScholesValuation(values);
  const binomialInput = {
    spot: values.spot,
    strike: values.strike,
    rate: values.rate,
    volatility: values.volatility,
    maturity: values.maturity,
    steps: values.steps,
    optionType: values.optionType,
    dividendYield: values.dividendYield,
    exerciseStyle: values.exerciseStyle,
  };
  const binomial = priceCrrBinomial(binomialInput);
  const europeanBinomial =
    values.exerciseStyle === "european"
      ? binomial
      : priceCrrBinomial({
          ...binomialInput,
          exerciseStyle: "european",
        });
  const isAmerican = values.exerciseStyle === "american";
  const primaryPrice = isAmerican ? binomial.price : blackScholes.price;
  const binomialPrice = binomial.price;
  const absoluteDifference = isAmerican
    ? Math.abs(binomial.price - europeanBinomial.price)
    : Math.abs(europeanBinomial.price - blackScholes.price);
  const relativeReference = isAmerican
    ? europeanBinomial.price
    : blackScholes.price;
  const percentageDifference =
    relativeReference === 0
      ? 0
      : (absoluteDifference / Math.abs(relativeReference)) * 100;
  const convergenceSteps = [25, 50, 100, 250, 500];
  const convergence = isAmerican
    ? buildCrrBinomialConvergenceSeries(
        {
          ...binomialInput,
          exerciseStyle: "american",
        },
        convergenceSteps,
      )
    : buildBinomialConvergenceSeries(
        {
          spot: values.spot,
          strike: values.strike,
          rate: values.rate,
          volatility: values.volatility,
          maturityYears: values.maturity,
          optionType: values.optionType,
          dividendYield: values.dividendYield,
        },
        blackScholes.price,
        convergenceSteps,
      );

  return {
    blackScholes,
    binomial,
    europeanBinomial,
    primaryPrice,
    binomialPrice,
    absoluteDifference,
    percentageDifference,
    earlyExercisePremium: isAmerican ? binomial.earlyExercisePremium : 0,
    convergence,
    inputs: values,
  };
}

function createInitialPricingState(): PricingState {
  const parsed = parseForm(DEFAULT_FORM);

  if (!parsed.values) {
    throw new Error("Default form values must be valid");
  }

  return buildPricingState(parsed.values);
}

export function OptionsPricingCalculator() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pricing, setPricing] = useState<PricingState>(createInitialPricingState);
  const [marketPriceInput, setMarketPriceInput] = useState(() => {
    const initialPricing = createInitialPricingState();

    return formatInputNumber(initialPricing.blackScholes.price);
  });
  const [activeSensitivityScenario, setActiveSensitivityScenario] =
    useState<SensitivityScenarioType>("volatility");
  const [activeStrategyId, setActiveStrategyId] =
    useState<StrategyPresetId>("long-call");
  const [strategyLegInputs, setStrategyLegInputs] = useState<StrategyLegInput[]>(
    () => {
      const initialPricing = createInitialPricingState();

      return getLegInputs(buildDefaultStrategy(initialPricing, "long-call").legs);
    },
  );
  const [expectedVolatilityInput, setExpectedVolatilityInput] = useState(
    DEFAULT_FORM.volatility,
  );
  const [impliedVolatilityReferenceInput, setImpliedVolatilityReferenceInput] =
    useState(DEFAULT_FORM.volatility);
  const [directionalView, setDirectionalView] =
    useState<DirectionalView>("bullish");
  const [riskPreference, setRiskPreference] =
    useState<RiskPreference>("defined-risk");
  const [ownershipStatus, setOwnershipStatus] =
    useState<OwnershipStatus>("does-not-own-underlying");
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [activeSection, setActiveSection] =
    useState<OptionSectionId>("pricing");

  const payoffData = buildOptionPayoffSeries(
    pricing.inputs,
    pricing.primaryPrice,
  );

  const isAmerican = pricing.inputs.exerciseStyle === "american";
  const exerciseStyleLabel = isAmerican ? "American" : "European";
  const optionTypeLabel =
    pricing.inputs.optionType === "call" ? "call" : "put";
  const contractLabel = `${exerciseStyleLabel} ${optionTypeLabel}`;
  const parsedMarketPrice = Number(marketPriceInput);
  const impliedVolatilityBounds = useMemo(
    () =>
      getEuropeanOptionPriceBounds({
        optionType: pricing.inputs.optionType,
        spot: pricing.inputs.spot,
        strike: pricing.inputs.strike,
        riskFreeRate: pricing.inputs.rate,
        dividendYield: pricing.inputs.dividendYield,
        maturity: pricing.inputs.maturity,
      }),
    [pricing.inputs],
  );
  const impliedVolatility = useMemo<{
    result?: ImpliedVolatilityResult;
    warning?: string;
  }>(() => {
    if (marketPriceInput.trim() === "") {
      return { warning: "Enter a market option price to solve implied volatility." };
    }

    if (!Number.isFinite(parsedMarketPrice)) {
      return { warning: "Market option price must be a valid number." };
    }

    try {
      return {
        result: solveImpliedVolatility({
          marketPrice: parsedMarketPrice,
          optionType: pricing.inputs.optionType,
          spot: pricing.inputs.spot,
          strike: pricing.inputs.strike,
          riskFreeRate: pricing.inputs.rate,
          dividendYield: pricing.inputs.dividendYield,
          maturity: pricing.inputs.maturity,
        }),
      };
    } catch (error) {
      return {
        warning:
          error instanceof Error
            ? error.message
            : "Unable to solve implied volatility.",
      };
    }
  }, [marketPriceInput, parsedMarketPrice, pricing.inputs]);
  const solvedImpliedVolatility =
    impliedVolatility.result?.converged &&
    impliedVolatility.result.impliedVolatility !== undefined
      ? impliedVolatility.result.impliedVolatility
      : pricing.inputs.volatility;
  const parsedExpectedVolatility = Number(expectedVolatilityInput);
  const parsedImpliedVolatilityReference = Number(
    impliedVolatilityReferenceInput,
  );
  const strategyScreener = useMemo<{
    result?: StrategyScreenerResult;
    warning?: string;
  }>(() => {
    if (
      expectedVolatilityInput.trim() === "" ||
      impliedVolatilityReferenceInput.trim() === ""
    ) {
      return {
        warning:
          "Enter expected volatility and implied volatility reference to screen compatible structures.",
      };
    }

    if (
      !Number.isFinite(parsedExpectedVolatility) ||
      parsedExpectedVolatility <= 0
    ) {
      return { warning: "Expected volatility must be a positive number." };
    }

    if (
      !Number.isFinite(parsedImpliedVolatilityReference) ||
      parsedImpliedVolatilityReference <= 0
    ) {
      return {
        warning: "Implied volatility reference must be a positive number.",
      };
    }

    try {
      return {
        result: screenOptionStrategies({
          expectedVolatility: parsedExpectedVolatility,
          impliedVolatility: parsedImpliedVolatilityReference,
          directionalView,
          riskPreference,
          ownershipStatus,
        }),
      };
    } catch (error) {
      return {
        warning:
          error instanceof Error
            ? error.message
            : "Unable to screen strategies.",
      };
    }
  }, [
    directionalView,
    expectedVolatilityInput,
    impliedVolatilityReferenceInput,
    ownershipStatus,
    parsedExpectedVolatility,
    parsedImpliedVolatilityReference,
    riskPreference,
  ]);
  const sensitivityScenarios = useMemo<SensitivityScenarioResult>(
    () =>
      buildOptionSensitivityScenarios(
        {
          spot: pricing.inputs.spot,
          strike: pricing.inputs.strike,
          maturity: pricing.inputs.maturity,
          rate: pricing.inputs.rate,
          volatility: pricing.inputs.volatility,
          dividendYield: pricing.inputs.dividendYield,
          optionType: pricing.inputs.optionType,
          exerciseStyle: pricing.inputs.exerciseStyle,
          steps: pricing.inputs.steps,
        },
        activeSensitivityScenario,
      ),
    [activeSensitivityScenario, pricing.inputs],
  );
  const activeSensitivityConfig =
    sensitivityScenarioConfig.find(
      (entry) => entry.id === activeSensitivityScenario,
    ) ?? sensitivityScenarioConfig[0];
  const baseStrategy = useMemo(
    () => buildDefaultStrategy(pricing, activeStrategyId),
    [activeStrategyId, pricing],
  );
  const editedStrategy = useMemo(
    () => applyLegInputs(baseStrategy, strategyLegInputs),
    [baseStrategy, strategyLegInputs],
  );
  const strategyAnalysis = useMemo<StrategyAnalysis | null>(() => {
    if (!editedStrategy) {
      return null;
    }

    return analyzeStrategy(editedStrategy, pricing.inputs.spot);
  }, [editedStrategy, pricing.inputs.spot]);

  function updateField(name: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      return { ...current, [name]: undefined };
    });
    setPricingError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = parseForm(form);

    if (!parsed.values) {
      setErrors(parsed.errors);
      setPricingError("Please correct the highlighted inputs.");
      return;
    }

    try {
      setErrors({});
      const nextPricing = buildPricingState(parsed.values);

      setPricing(nextPricing);
      setStrategyLegInputs(
        getLegInputs(buildDefaultStrategy(nextPricing, activeStrategyId).legs),
      );
      setPricingError(null);
    } catch (error) {
      setPricingError(
        error instanceof Error ? error.message : "Unable to price option",
      );
    }
  }

  function handleReset() {
    setForm(DEFAULT_FORM);
    setErrors({});
    const nextPricing = createInitialPricingState();

    setPricing(nextPricing);
    setMarketPriceInput(formatInputNumber(nextPricing.blackScholes.price));
    setExpectedVolatilityInput(DEFAULT_FORM.volatility);
    setImpliedVolatilityReferenceInput(DEFAULT_FORM.volatility);
    setDirectionalView("bullish");
    setRiskPreference("defined-risk");
    setOwnershipStatus("does-not-own-underlying");
    setActiveStrategyId("long-call");
    setStrategyLegInputs(getLegInputs(buildDefaultStrategy(nextPricing, "long-call").legs));
    setPricingError(null);
  }

  function handleStrategyChange(presetId: StrategyPresetId) {
    setActiveStrategyId(presetId);
    setStrategyLegInputs(getLegInputs(buildDefaultStrategy(pricing, presetId).legs));
  }

  function updateStrategyLegInput(
    legId: string,
    field: keyof Omit<StrategyLegInput, "id">,
    value: string,
  ) {
    setStrategyLegInputs((current) =>
      current.map((leg) =>
        leg.id === legId
          ? {
              ...leg,
              [field]: value,
            }
          : leg,
      ),
    );
  }

  const contractSummary = useMemo(
    () => [
      {
        label: "Instrument",
        value: contractLabel,
      },
      {
        label: "Exercise style",
        value: exerciseStyleLabel,
      },
      {
        label: "Spot / Strike",
        value: `${formatNumber(pricing.inputs.spot)} / ${formatNumber(pricing.inputs.strike)}`,
      },
      {
        label: "Maturity",
        value: `${formatNumber(pricing.inputs.maturity)} years`,
      },
      {
        label: "Risk-free rate",
        value: formatNumber(pricing.inputs.rate),
      },
      {
        label: "Volatility",
        value: formatNumber(pricing.inputs.volatility),
      },
      {
        label: "Dividend yield",
        value: formatNumber(pricing.inputs.dividendYield),
      },
    ],
    [contractLabel, exerciseStyleLabel, pricing.inputs],
  );

  const activeSectionLabel =
    activeSection === "pricing"
      ? "Pricing"
      : activeSection === "comparison"
        ? "Model comparison"
        : activeSection === "volatility"
          ? "Volatility"
          : "Strategies";

  return (
    <section className="space-y-8">
      <SurfaceCard
        tone="elevated"
        padding="lg"
        className="border-border-strong/95"
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(22rem,0.82fr)]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-accent-foreground">
                Options workspace
              </span>
              <span className="rounded-full border border-white/[0.08] bg-background-muted/75 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-foreground-subtle">
                {activeSectionLabel}
              </span>
            </div>

            <div className="space-y-4">
              <h2 className="max-w-4xl text-balance text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-[2.8rem]">
                Price the contract, validate the model path, then read the derivative through Greeks and payoff.
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-foreground-soft sm:text-[0.96rem]">
                The module keeps contract setup, valuation, sensitivity review,
                payoff structure, and model comparison inside one derivatives
                workflow. The goal is analytical clarity rather than decorative
                output.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <StagePanel
                step="01"
                label="Contract setup"
                body="Define the option structure, market assumptions, and numerical benchmark inputs."
                state="active"
              />
              <StagePanel
                step="02"
                label="Valuation and model"
                body={
                  isAmerican
                    ? "Read the American CRR result as the primary valuation layer, then compare it with the European tree."
                    : "Read the Black-Scholes result as the primary valuation layer, then inspect sensitivities."
                }
                state="ready"
              />
              <StagePanel
                step="03"
                label="Payoff and validation"
                body="Review expiry behavior and compare the analytical model against the CRR tree."
                state="ready"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <WorkspaceSignal
              label="Primary model"
              value={isAmerican ? "American CRR tree" : "Black-Scholes-Merton"}
              detail={
                isAmerican
                  ? "Backward induction allows early exercise at each node in the tree."
                  : "The analytical benchmark remains the default pricing lens for the workspace."
              }
              tone="ready"
            />
            <WorkspaceSignal
              label="Cross-check"
              value={
                isAmerican
                  ? "European CRR baseline"
                  : `${pricing.inputs.steps} step CRR tree`
              }
              detail={
                isAmerican
                  ? "The same-step European tree isolates the early exercise premium."
                  : "The binomial layer stays visible as a validation benchmark rather than a competing primary surface."
              }
              tone="active"
            />
            <WorkspaceSignal
              label="Current contract"
              value={contractLabel}
              detail={`${formatNumber(pricing.inputs.spot)} spot, ${formatNumber(pricing.inputs.strike)} strike, ${formatNumber(pricing.inputs.maturity)} year maturity.`}
            />
          </div>
        </div>
      </SurfaceCard>

      <OptionsSectionTabs
        activeSection={activeSection}
        onChange={setActiveSection}
      />

      {pricingError ? (
        <div className="rounded-[1.55rem] border border-rose-400/30 bg-rose-400/[0.08] px-5 py-4 text-sm text-rose-200">
          {pricingError}
        </div>
      ) : null}

      {activeSection === "pricing" ? (
        <div
          id="pricing-panel"
          role="tabpanel"
          aria-labelledby="pricing-tab"
          className="space-y-6"
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)]">
            <Card
              eyebrow="Pricing Setup"
              title="Derivatives control panel"
              description="Define the contract, market state, and tree assumptions for the current valuation run."
              className="h-fit xl:sticky xl:top-24"
              tone="elevated"
              actions={
                <StepBadge label="Live pricing" tone="ready" />
              }
            >
              <form className="space-y-6" onSubmit={handleSubmit}>
                <SurfaceCard padding="sm" className="border-white/[0.08]">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                          Contract type
                        </p>
                        <p className="mt-2 text-sm leading-6 text-foreground-soft">
                          Toggle the payoff direction before entering the numerical assumptions.
                        </p>
                      </div>
                      <span className="rounded-full border border-white/[0.08] bg-background-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
                        Primary
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {(["call", "put"] as const).map((type) => {
                        const isActive = form.optionType === type;

                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => updateField("optionType", type)}
                            className={cn(
                              "rounded-[1.2rem] border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                              isActive
                                ? "border-accent/35 bg-accent/12 text-accent-foreground"
                                : "border-white/[0.08] bg-slate-950/55 text-slate-300 hover:border-border-strong/80 hover:bg-white/[0.04]",
                            )}
                          >
                            <p className="text-sm font-semibold capitalize">{type}</p>
                            <p className="mt-2 text-xs leading-5 text-foreground-subtle">
                              {type === "call"
                                ? "Upside convexity with limited downside to premium."
                                : "Downside protection or bearish convexity with limited downside to premium."}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </SurfaceCard>

                <SurfaceCard padding="sm" className="border-white/[0.08]">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                          Exercise style
                        </p>
                        <p className="mt-2 text-sm leading-6 text-foreground-soft">
                          Select whether the tree permits early exercise before expiry.
                        </p>
                      </div>
                      <span className="rounded-full border border-white/[0.08] bg-background-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
                        CRR
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {(["european", "american"] as const).map((style) => {
                        const isActive = form.exerciseStyle === style;

                        return (
                          <button
                            key={style}
                            type="button"
                            onClick={() => updateField("exerciseStyle", style)}
                            className={cn(
                              "rounded-[1.2rem] border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                              isActive
                                ? "border-accent/35 bg-accent/12 text-accent-foreground"
                                : "border-white/[0.08] bg-slate-950/55 text-slate-300 hover:border-border-strong/80 hover:bg-white/[0.04]",
                            )}
                          >
                            <p className="text-sm font-semibold capitalize">
                              {style}
                            </p>
                            <p className="mt-2 text-xs leading-5 text-foreground-subtle">
                              {style === "european"
                                ? "Exercise only at expiry; BSM remains the analytical benchmark."
                                : "Exercise can occur at any tree node through backward induction."}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </SurfaceCard>

                <div className="grid gap-4">
                  <InputGroup
                    title="Contract terms"
                    description="Core payoff-defining fields."
                    fields={numericFieldConfig.filter((field) =>
                      ["spot", "strike", "maturity"].includes(field.name),
                    )}
                    form={form}
                    errors={errors}
                    onChange={updateField}
                  />

                  <InputGroup
                    title="Market assumptions"
                    description="Continuous-rate and volatility assumptions used by the analytical model."
                    fields={numericFieldConfig.filter((field) =>
                      ["rate", "volatility", "dividendYield"].includes(field.name),
                    )}
                    form={form}
                    errors={errors}
                    onChange={updateField}
                  />

                  <InputGroup
                    title="Numerical benchmark"
                    description="Tree depth for the CRR cross-check."
                    fields={numericFieldConfig.filter((field) =>
                      ["steps"].includes(field.name),
                    )}
                    form={form}
                    errors={errors}
                    onChange={updateField}
                    compact
                  />
                </div>

                <div className="rounded-[1.3rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.78),rgba(10,17,26,0.56))] px-4 py-3 text-xs leading-6 text-foreground-muted">
                  Use decimals for rates and volatility. `0.05` means 5%, `0.20` means 20%, and dividend yield remains in continuous form.
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-[1.2rem] bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
                  >
                    Reprice contract
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-[1.2rem] border border-white/[0.08] px-5 py-3 text-sm font-semibold text-foreground transition hover:border-border-strong/80 hover:bg-white/[0.04]"
                  >
                    Reset defaults
                  </button>
                </div>
              </form>
            </Card>

            <div className="space-y-4">
              <Card
                eyebrow="Pricing"
                title={
                  isAmerican
                    ? "American tree valuation block"
                    : "Analytical valuation block"
                }
                description={
                  isAmerican
                    ? "Primary price output and model context for the current American contract."
                    : "Primary price output and model context for the current European contract."
                }
                tone="elevated"
              >
                <div className="space-y-6">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.06fr)_minmax(20rem,0.94fr)]">
                    <SurfaceCard tone="accent" padding="md" className="border-accent/25">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-foreground/80">
                        {isAmerican ? "American CRR value" : "Black-Scholes value"}
                      </p>
                      <p className="mt-5 text-[3rem] font-semibold tracking-[-0.05em] text-foreground">
                        {formatNumber(pricing.primaryPrice)}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-foreground-soft">
                        {isAmerican
                          ? `${contractLabel} valuation from a ${pricing.inputs.steps} step CRR tree with early exercise checked at every node.`
                          : `${pricing.inputs.optionType === "call" ? "Call" : "Put"} valuation under continuous dividend treatment. This remains the primary analytical output in the workspace.`}
                      </p>
                    </SurfaceCard>

                    <div className="grid gap-3">
                      {isAmerican ? (
                        <>
                          <OptionMetricCard
                            label="European CRR baseline"
                            value={formatNumber(pricing.europeanBinomial.price)}
                            meta={`${pricing.inputs.steps} step same-input tree`}
                          />
                          <OptionMetricCard
                            label="Early exercise premium"
                            value={formatNumber(pricing.earlyExercisePremium)}
                            meta="American CRR less European CRR"
                          />
                          <OptionMetricCard
                            label="Root intrinsic value"
                            value={formatNumber(pricing.binomial.intrinsicValue)}
                            meta="Immediate exercise value"
                          />
                        </>
                      ) : (
                        <>
                          <OptionMetricCard
                            label="CRR tree benchmark"
                            value={formatNumber(pricing.binomialPrice)}
                            meta={`${pricing.inputs.steps} steps`}
                          />
                          <OptionMetricCard
                            label="Absolute difference"
                            value={formatNumber(pricing.absoluteDifference)}
                            meta="Analytical vs numerical gap"
                          />
                          <OptionMetricCard
                            label="Percentage difference"
                            value={`${formatNumber(pricing.percentageDifference)}%`}
                            meta="Relative to analytical value"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-strong/85">
                        Contract summary
                      </h3>
                      <span className="rounded-full border border-white/[0.08] bg-background-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
                        {pricing.inputs.steps} CRR steps
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {contractSummary.map((item) => (
                        <SummaryCard
                          key={item.label}
                          label={item.label}
                          value={item.value}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                eyebrow="Risk"
                title={
                  isAmerican
                    ? "European Greeks reference"
                    : "Greeks snapshot"
                }
                description={
                  isAmerican
                    ? "Analytical Black-Scholes Greeks for the comparable European contract. These are not American option Greeks."
                    : "Sensitivity measures from the current Black-Scholes run, presented as the immediate risk surface for the option."
                }
              >
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {greekDisplayConfig.map((greek, index) => (
                      <OptionMetricCard
                        key={greek.key}
                        label={greek.label}
                        value={formatNumber(pricing.blackScholes[greek.key])}
                        meta={greek.unit}
                        accent={index === 0}
                      />
                    ))}
                  </div>
                  <p className="text-xs leading-6 text-foreground-muted">
                    {isAmerican
                      ? "The American price is tree-based here. These Greeks remain a European analytical reference only; finite-difference American Greeks are outside this branch."
                      : "Vega and rho are reported per 1.00 absolute move in volatility and rate. Theta is annualized, so read it as a model sensitivity rather than a daily decay number."}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          <ExpandableChartCard
            eyebrow="Payoff"
            title="Expiry payoff and profit profile"
            description="Inspect how the selected option behaves at expiry across a spot range centered around the current contract."
            detailDescription="Expanded payoff view with exact spot-by-spot inspection for the payoff and profit curves."
            renderPreview={({ open }) => (
              <div className="space-y-5">
                <OptionsPayoffChart
                  data={payoffData}
                  inputs={pricing.inputs}
                  optionPrice={pricing.primaryPrice}
                  onChartClick={open}
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <OptionMetricCard
                    label="Payoff structure"
                    value={
                      pricing.inputs.optionType === "call" ? "Long call" : "Long put"
                    }
                    meta="Intrinsic value at expiry"
                  />
                  <OptionMetricCard
                    label="Premium basis"
                    value={formatNumber(pricing.primaryPrice)}
                    meta="Current model premium used in the profit curve"
                  />
                  <OptionMetricCard
                    label="Reference markers"
                    value="Spot and strike"
                    meta="Dashed operating levels"
                  />
                </div>
              </div>
            )}
            detail={
              <OptionsPayoffChart
                data={payoffData}
                inputs={pricing.inputs}
                optionPrice={pricing.primaryPrice}
                interactive
                showSummary
                heightClassName="h-[24rem] sm:h-[32rem] lg:h-[40rem]"
              />
            }
          />
        </div>
      ) : null}

      {activeSection === "comparison" ? (
        <div
          id="comparison-panel"
          role="tabpanel"
          aria-labelledby="comparison-tab"
          className="space-y-6"
        >
          <SurfaceCard tone="elevated" padding="md" className="border-white/[0.08]">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(23rem,0.84fr)]">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
                  Model comparison
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  {isAmerican
                    ? "Measure the early exercise value against the European tree."
                    : "Validate the analytical benchmark against the CRR tree."}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-soft">
                  {isAmerican
                    ? "The American view uses backward induction to compare continuation value with immediate exercise value at each node. The European tree is the same-input baseline."
                    : "The comparison layer exists to strengthen pricing confidence, not to distract from the primary valuation block. Read the gap and convergence path as quality checks on the current setup."}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {isAmerican ? (
                  <>
                    <OptionMetricCard
                      label="American CRR"
                      value={formatNumber(pricing.binomial.price)}
                      meta="Primary tree price"
                      accent
                    />
                    <OptionMetricCard
                      label="European CRR"
                      value={formatNumber(pricing.europeanBinomial.price)}
                      meta="Same inputs, no early exercise"
                    />
                    <OptionMetricCard
                      label="Early exercise premium"
                      value={formatNumber(pricing.earlyExercisePremium)}
                      meta="American less European"
                    />
                    <OptionMetricCard
                      label="Root intrinsic"
                      value={formatNumber(pricing.binomial.intrinsicValue)}
                      meta="Immediate exercise value"
                    />
                  </>
                ) : (
                  <>
                    <OptionMetricCard
                      label="Black-Scholes"
                      value={formatNumber(pricing.blackScholes.price)}
                      meta="Primary analytical benchmark"
                      accent
                    />
                    <OptionMetricCard
                      label="CRR tree"
                      value={formatNumber(pricing.binomialPrice)}
                      meta={`${pricing.inputs.steps} step numerical price`}
                    />
                    <OptionMetricCard
                      label="Absolute gap"
                      value={formatNumber(pricing.absoluteDifference)}
                      meta="Direct model spread"
                    />
                    <OptionMetricCard
                      label="Relative gap"
                      value={`${formatNumber(pricing.percentageDifference)}%`}
                      meta="Spread as a percentage"
                    />
                  </>
                )}
              </div>
            </div>
          </SurfaceCard>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
            <Card
              eyebrow="Comparison"
              title="Model framing"
              description="Compact context for how the two valuation views relate to each other."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  label="Contract"
                  value={contractLabel}
                />
                <SummaryCard
                  label="Exercise premium"
                  value={formatNumber(pricing.earlyExercisePremium)}
                />
                <SummaryCard
                  label="Dividend treatment"
                  value={`q = ${formatNumber(pricing.inputs.dividendYield)}`}
                />
                <SummaryCard
                  label="Tree depth"
                  value={`${pricing.inputs.steps} steps`}
                />
              </div>
            </Card>

            <Card
              eyebrow="Notes"
              title="Interpretation notes"
              description="Use these guidance blocks as the reading frame for the comparison surface."
            >
              <div className="space-y-3">
                <NoteCard
                  title={isAmerican ? "Tree benchmark" : "Analytical benchmark"}
                  body={
                    isAmerican
                      ? "American CRR is the primary price; the European CRR result is shown only as the no-early-exercise baseline."
                      : "Black-Scholes-Merton provides the primary price and Greeks for the selected European payoff."
                  }
                />
                <NoteCard
                  title={
                    isAmerican ? "Early exercise rule" : "Numerical cross-check"
                  }
                  body={
                    isAmerican
                      ? "At each node, the American tree takes the larger of continuation value and intrinsic value."
                      : "The CRR tree prices the same contract with backward induction using the selected number of time steps."
                  }
                />
                <NoteCard
                  title={isAmerican ? "Read the premium" : "Read the gap"}
                  body={
                    isAmerican
                      ? "The early exercise premium is the American CRR price less the same-step European CRR price."
                      : "The comparison is most useful as a validation check and to observe convergence as the tree gets deeper."
                  }
                />
              </div>
            </Card>
          </div>

          <Card
            eyebrow="Convergence"
            title="Binomial convergence table"
            description={
              isAmerican
                ? "American CRR pricing across increasing tree depths, with same-step European baselines."
                : "CRR pricing across increasing tree depths relative to the analytical benchmark."
            }
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.14fr)_minmax(18rem,0.86fr)]">
              <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
                <div className={isAmerican ? "min-w-[760px]" : "min-w-[620px]"}>
                  <div
                    className={cn(
                      "grid gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle",
                      isAmerican
                        ? "grid-cols-[0.7fr_1.1fr_1.1fr_1fr]"
                        : "grid-cols-[0.8fr_1.2fr_1fr]",
                    )}
                  >
                    <span>Steps</span>
                    <span>
                      {isAmerican ? "American CRR" : "Binomial price"}
                    </span>
                    {isAmerican ? <span>European CRR</span> : null}
                    <span>{isAmerican ? "Early premium" : "Abs diff"}</span>
                  </div>
                  {pricing.convergence.map((row, index) => (
                    <div
                      key={row.steps}
                      className={cn(
                        "grid gap-3 px-5 py-4 text-sm text-foreground-soft not-last:border-b not-last:border-white/[0.08]",
                        isAmerican
                          ? "grid-cols-[0.7fr_1.1fr_1.1fr_1fr]"
                          : "grid-cols-[0.8fr_1.2fr_1fr]",
                        index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                      )}
                    >
                      <span className="font-semibold text-foreground">{row.steps}</span>
                      <span>{formatNumber(row.price)}</span>
                      {isAmerican ? (
                        <span>{formatNumber(row.europeanPrice ?? 0)}</span>
                      ) : null}
                      <span>
                        {formatNumber(
                          isAmerican
                            ? (row.earlyExercisePremium ?? 0)
                            : (row.absoluteDifference ?? 0),
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <SurfaceCard padding="sm" className="border-white/[0.08]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                  Reading guide
                </p>
                <div className="mt-4 space-y-3">
                  <NoteCard
                    title={
                      isAmerican
                        ? "Backward induction"
                        : "Convergence direction"
                    }
                    body={
                      isAmerican
                        ? "American CRR checks immediate exercise against continuation value while stepping backward through the tree."
                        : "For European contracts, the CRR estimate should generally tighten toward the analytical benchmark as depth increases."
                    }
                  />
                  <NoteCard
                    title={
                      isAmerican ? "No BSM benchmark" : "Numerical discipline"
                    }
                    body={
                      isAmerican
                        ? "Black-Scholes is not used as an American benchmark here; the European CRR column isolates early exercise value."
                        : "Large residual gaps at high depth usually point back to assumptions, not presentation."
                    }
                  />
                </div>
              </SurfaceCard>
            </div>
          </Card>
        </div>
      ) : null}

      {activeSection === "volatility" ? (
        <div
          id="volatility-panel"
          role="tabpanel"
          aria-labelledby="volatility-tab"
          className="space-y-6"
        >
          <SurfaceCard tone="elevated" padding="md" className="border-white/[0.08]">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(23rem,0.92fr)]">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
                  Volatility
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  Solve Black-Scholes implied volatility from an observed option price.
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-soft">
                  The solver uses bisection against the European
                  Black-Scholes-Merton price with continuous dividend yield.
                  {isAmerican
                    ? " The selected contract is American, so this panel is a European BSM reference rather than an American implied-volatility model."
                    : ""}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <OptionMetricCard
                  label="Current model price"
                  value={formatNumber(pricing.primaryPrice)}
                  meta={
                    isAmerican
                      ? "American CRR premium"
                      : "European BSM premium"
                  }
                  accent
                />
                <OptionMetricCard
                  label="Current input vol"
                  value={formatPercent(pricing.inputs.volatility)}
                  meta="Annualized sigma"
                />
                <OptionMetricCard
                  label="BSM reference"
                  value={formatNumber(pricing.blackScholes.price)}
                  meta="European model price"
                />
                <OptionMetricCard
                  label="Exercise style"
                  value={exerciseStyleLabel}
                  meta={isAmerican ? "IV uses European BSM" : "BSM aligned"}
                />
              </div>
            </div>
          </SurfaceCard>

          <div className="grid gap-4 xl:grid-cols-[minmax(340px,0.82fr)_minmax(0,1.18fr)]">
            <Card
              eyebrow="Input"
              title="Market price"
              description="Enter an observed European option premium to invert the Black-Scholes-Merton model."
              tone="elevated"
            >
              <div className="space-y-5">
                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-foreground">
                    Market option price
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.0001"
                    value={marketPriceInput}
                    onChange={(event) => setMarketPriceInput(event.target.value)}
                    className="w-full rounded-[1.15rem] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60"
                  />
                  <p className="text-xs leading-5 text-foreground-muted">
                    Use the same contract terms shown in the current pricing run.
                  </p>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryCard
                    label="Lower bound"
                    value={formatNumber(impliedVolatilityBounds.lowerBound)}
                  />
                  <SummaryCard
                    label="Upper bound"
                    value={formatNumber(impliedVolatilityBounds.upperBound)}
                  />
                </div>

                <div className="rounded-[1.3rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.78),rgba(10,17,26,0.56))] px-4 py-3 text-xs leading-6 text-foreground-muted">
                  No-arbitrage bounds use discounted spot and strike:
                  continuous dividend yield for the underlying and continuous
                  risk-free discounting for the strike.
                </div>
              </div>
            </Card>

            <Card
              eyebrow="Implied volatility"
              title="Bisection solver result"
              description="The result is computed with a stable bounded search over volatility."
              actions={
                <StepBadge
                  label={
                    impliedVolatility.result?.converged ? "Converged" : "Check"
                  }
                  tone={impliedVolatility.result?.converged ? "ready" : "default"}
                />
              }
            >
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <OptionMetricCard
                    label="Implied volatility"
                    value={
                      impliedVolatility.result?.impliedVolatility !== undefined
                        ? formatPercent(
                            impliedVolatility.result.impliedVolatility,
                          )
                        : "--"
                    }
                    meta="Annualized BSM sigma"
                    accent
                  />
                  <OptionMetricCard
                    label="Vol difference"
                    value={
                      impliedVolatility.result?.impliedVolatility !== undefined
                        ? formatPercent(
                            impliedVolatility.result.impliedVolatility -
                              pricing.inputs.volatility,
                          )
                        : "--"
                    }
                    meta="Implied less input vol"
                  />
                  <OptionMetricCard
                    label="Price error"
                    value={
                      impliedVolatility.result
                        ? formatNumber(Math.abs(impliedVolatility.result.priceError))
                        : "--"
                    }
                    meta="Absolute model gap"
                  />
                  <OptionMetricCard
                    label="Iterations"
                    value={
                      impliedVolatility.result
                        ? `${impliedVolatility.result.iterations}`
                        : "--"
                    }
                    meta="Bisection steps"
                  />
                </div>

                {impliedVolatility.warning ||
                impliedVolatility.result?.warning ? (
                  <div className="rounded-[1.35rem] border border-amber-300/25 bg-amber-300/[0.08] px-4 py-3 text-sm leading-6 text-amber-100">
                    {impliedVolatility.warning ??
                      impliedVolatility.result?.warning}
                  </div>
                ) : (
                  <div className="rounded-[1.35rem] border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-sm leading-6 text-emerald-100">
                    Market price is inside the European no-arbitrage bounds and
                    the bisection solver matched the BSM price within tolerance.
                  </div>
                )}

                {isAmerican ? (
                  <NoteCard
                    title="European reference"
                    body="American exercise changes the pricing model. This implied volatility is the European BSM volatility that matches the entered market price under the same contract inputs."
                  />
                ) : null}
              </div>
            </Card>
          </div>

          <Card
            eyebrow="Sensitivity"
            title="Scenario price table"
            description="Stress one input at a time and compare each option value with the current base case."
            actions={
              <StepBadge
                label={
                  isAmerican ? "American CRR scenarios" : "BSM scenarios"
                }
                tone="ready"
              />
            }
          >
            <div className="space-y-5">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.62fr)]">
                <div>
                  <div
                    className="grid gap-3 sm:grid-cols-3"
                    role="tablist"
                    aria-label="Sensitivity scenario type"
                  >
                    {sensitivityScenarioConfig.map((scenario) => {
                      const isActive =
                        activeSensitivityScenario === scenario.id;

                      return (
                        <button
                          key={scenario.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => setActiveSensitivityScenario(scenario.id)}
                          className={cn(
                            "rounded-[1.2rem] border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                            isActive
                              ? "border-accent/35 bg-accent/12 text-accent-foreground"
                              : "border-white/[0.08] bg-slate-950/55 text-slate-300 hover:border-border-strong/80 hover:bg-white/[0.04]",
                          )}
                        >
                          <span className="text-sm font-semibold">
                            {scenario.label}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-foreground-subtle">
                            {scenario.inputLabel} shocks
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <OptionMetricCard
                    label="Base price"
                    value={formatNumber(sensitivityScenarios.basePrice)}
                    meta={
                      isAmerican
                        ? `${pricing.inputs.steps} step American CRR`
                        : "Black-Scholes-Merton"
                    }
                    accent
                  />
                  <NoteCard
                    title={activeSensitivityConfig.label}
                    body={activeSensitivityConfig.interpretation}
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
                <div className="min-w-[720px]">
                  <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                    <span>Scenario</span>
                    <span>{activeSensitivityConfig.inputLabel}</span>
                    <span>Option price</span>
                    <span>Price change</span>
                    <span>% change</span>
                  </div>
                  {sensitivityScenarios.rows.map((row, index) => (
                    <div
                      key={`${activeSensitivityScenario}-${row.inputValue}`}
                      className={cn(
                        "grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-4 text-sm text-foreground-soft not-last:border-b not-last:border-white/[0.08]",
                        row.isBase
                          ? "bg-accent/[0.07] text-accent-foreground"
                          : index % 2 === 0
                            ? "bg-white/[0.015]"
                            : "bg-transparent",
                      )}
                    >
                      <span className="font-semibold text-foreground">
                        {row.label}
                      </span>
                      <span>
                        {formatScenarioInput(
                          activeSensitivityScenario,
                          row.inputValue,
                        )}
                      </span>
                      <span>{formatNumber(row.price)}</span>
                      <span
                        className={cn(
                          row.priceDifference > 0 && "text-emerald-200",
                          row.priceDifference < 0 && "text-rose-200",
                        )}
                      >
                        {formatNumber(row.priceDifference)}
                      </span>
                      <span
                        className={cn(
                          row.percentageDifference > 0 && "text-emerald-200",
                          row.percentageDifference < 0 && "text-rose-200",
                        )}
                      >
                        {formatNumber(row.percentageDifference)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {isAmerican ? (
                <div className="rounded-[1.35rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.78),rgba(10,17,26,0.56))] px-4 py-3 text-xs leading-6 text-foreground-muted">
                  American scenarios use the same CRR tree depth as the current
                  pricing run. European scenarios use Black-Scholes-Merton.
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      ) : null}

      {activeSection === "strategies" ? (
        <div
          id="strategies-panel"
          role="tabpanel"
          aria-labelledby="strategies-tab"
          className="space-y-6"
        >
          <SurfaceCard tone="elevated" padding="md" className="border-white/[0.08]">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(23rem,0.92fr)]">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
                  Strategies
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  Build a multi-leg payoff and inspect the combined expiry P/L.
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-soft">
                  Presets use the current contract inputs and model-derived
                  Black-Scholes premiums for each leg. Edit strikes and premiums
                  to test market quotes or custom structures.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <OptionMetricCard
                  label="Selected strategy"
                  value={baseStrategy.name}
                  meta={baseStrategy.bias}
                  accent
                />
                <OptionMetricCard
                  label="Leg count"
                  value={`${baseStrategy.legs.length}`}
                  meta="Editable option legs"
                />
                <OptionMetricCard
                  label="Spot window"
                  value="50% - 150%"
                  meta="Expiry grid around spot"
                />
                <OptionMetricCard
                  label="Premium source"
                  value="Model"
                  meta="BSM defaults, editable"
                />
              </div>
            </div>
          </SurfaceCard>

          <div className="grid gap-4 xl:grid-cols-[minmax(340px,0.88fr)_minmax(0,1.12fr)]">
            <Card
              eyebrow="Scenario screener"
              title="Market view inputs"
              description="Map scenario assumptions to compatible structures for analysis."
              tone="elevated"
              actions={<StepBadge label="Not advice" />}
            >
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="block text-sm font-semibold text-foreground">
                      Expected volatility
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.0001"
                      min="0"
                      value={expectedVolatilityInput}
                      onChange={(event) =>
                        setExpectedVolatilityInput(event.target.value)
                      }
                      className="w-full rounded-[1.15rem] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60"
                    />
                    <p className="text-xs leading-5 text-foreground-muted">
                      Decimal form, e.g. 0.25 for 25%.
                    </p>
                  </label>

                  <label className="space-y-2">
                    <span className="block text-sm font-semibold text-foreground">
                      Implied vol reference
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.0001"
                      min="0"
                      value={impliedVolatilityReferenceInput}
                      onChange={(event) =>
                        setImpliedVolatilityReferenceInput(event.target.value)
                      }
                      className="w-full rounded-[1.15rem] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImpliedVolatilityReferenceInput(
                          formatInputNumber(solvedImpliedVolatility),
                        )
                      }
                      className="text-xs font-semibold text-accent-foreground transition hover:text-accent-strong"
                    >
                      Use current IV reference
                    </button>
                  </label>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                    Directional view
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {directionalViewConfig.map((item) => {
                      const isActive = directionalView === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setDirectionalView(item.id)}
                          className={cn(
                            "rounded-[1.1rem] border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                            isActive
                              ? "border-accent/35 bg-accent/12 text-accent-foreground"
                              : "border-white/[0.08] bg-slate-950/55 text-slate-300 hover:border-border-strong/80 hover:bg-white/[0.04]",
                          )}
                        >
                          <span className="text-sm font-semibold">
                            {item.label}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-foreground-subtle">
                            {item.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                    Risk preference
                  </p>
                  <div className="grid gap-2">
                    {riskPreferenceConfig.map((item) => {
                      const isActive = riskPreference === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRiskPreference(item.id)}
                          className={cn(
                            "rounded-[1.1rem] border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                            isActive
                              ? "border-accent/35 bg-accent/12 text-accent-foreground"
                              : "border-white/[0.08] bg-slate-950/55 text-slate-300 hover:border-border-strong/80 hover:bg-white/[0.04]",
                          )}
                        >
                          <span className="text-sm font-semibold">
                            {item.label}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-foreground-subtle">
                            {item.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                    Underlying ownership
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ownershipStatusConfig.map((item) => {
                      const isActive = ownershipStatus === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setOwnershipStatus(item.id)}
                          className={cn(
                            "rounded-[1.1rem] border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                            isActive
                              ? "border-accent/35 bg-accent/12 text-accent-foreground"
                              : "border-white/[0.08] bg-slate-950/55 text-slate-300 hover:border-border-strong/80 hover:bg-white/[0.04]",
                          )}
                        >
                          <span className="text-sm font-semibold">
                            {item.label}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-foreground-subtle">
                            {item.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            <Card
              eyebrow="Compatible structures"
              title="Strategies to analyze"
              description="Rule-based mappings from scenario assumptions to existing builder presets."
              actions={
                <StepBadge
                  label={
                    strategyScreener.result
                      ? formatVolatilityView(strategyScreener.result.volatilityView)
                      : "Check inputs"
                  }
                  tone={strategyScreener.result ? "ready" : "default"}
                />
              }
            >
              <div className="space-y-5">
                {strategyScreener.result ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <SummaryCard
                        label="Vol view"
                        value={formatVolatilityView(
                          strategyScreener.result.volatilityView,
                        )}
                      />
                      <SummaryCard
                        label="Vol spread"
                        value={formatPercent(
                          strategyScreener.result.volatilitySpread,
                        )}
                      />
                      <SummaryCard
                        label="Relative spread"
                        value={`${formatNumber(
                          strategyScreener.result.volatilitySpreadPercent * 100,
                        )}%`}
                      />
                    </div>

                    <div className="rounded-[1.3rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.78),rgba(10,17,26,0.56))] px-4 py-3 text-sm leading-6 text-foreground-soft">
                      {strategyScreener.result.volatilityInterpretation}
                    </div>

                    <div className="grid gap-3">
                      {strategyScreener.result.suggestions.map((suggestion) => (
                        <div
                          key={suggestion.strategyId}
                          className="rounded-[1.35rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.78),rgba(10,17,26,0.56))] px-4 py-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {suggestion.strategyName}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-foreground-soft">
                                {suggestion.scenarioFit}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleStrategyChange(suggestion.strategyId)
                              }
                              className="rounded-[1.05rem] border border-accent/20 bg-accent/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-foreground transition hover:border-accent/35 hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                            >
                              Load in builder
                            </button>
                          </div>
                          <div className="mt-4 grid gap-3 lg:grid-cols-4">
                            <NoteCard
                              title="Scenario fit"
                              body={suggestion.explanation}
                            />
                            <NoteCard
                              title="Direction"
                              body={suggestion.directionalLogic}
                            />
                            <NoteCard
                              title="Volatility logic"
                              body={suggestion.volatilityLogic}
                            />
                            <NoteCard
                              title="Risk note"
                              body={suggestion.riskNote}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {strategyScreener.result.futureCandidates.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                          Future candidates
                        </p>
                        {strategyScreener.result.futureCandidates.map(
                          (candidate) => (
                            <NoteCard
                              key={candidate.name}
                              title={candidate.name}
                              body={candidate.note}
                            />
                          ),
                        )}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="rounded-[1.35rem] border border-amber-300/25 bg-amber-300/[0.08] px-4 py-3 text-sm leading-6 text-amber-100">
                    {strategyScreener.warning}
                  </div>
                )}

                <div className="rounded-[1.35rem] border border-white/[0.08] bg-background-muted/80 px-4 py-3 text-xs leading-6 text-foreground-muted">
                  This tool maps scenario assumptions to option structures for
                  analysis. It does not provide investment advice.
                </div>
              </div>
            </Card>
          </div>

          <SurfaceCard tone="elevated" padding="sm" className="border-white/[0.08]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
                  Strategy builder
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground-soft">
                  Select or load a structure, edit legs, and inspect the payoff
                  and P/L profile.
                </p>
              </div>
              <StepBadge label="Analysis workspace" tone="ready" />
            </div>
          </SurfaceCard>

          <div className="grid gap-4 xl:grid-cols-[minmax(340px,0.86fr)_minmax(0,1.14fr)]">
            <Card
              eyebrow="Preset"
              title="Strategy selector"
              description="Choose a first-pass structure, then adjust leg economics if needed."
              tone="elevated"
            >
              <div className="grid gap-3">
                {strategyPresetConfig.map((preset) => {
                  const isActive = activeStrategyId === preset.id;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleStrategyChange(preset.id)}
                      className={cn(
                        "rounded-[1.25rem] border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                        isActive
                          ? "border-accent/35 bg-accent/12 text-accent-foreground"
                          : "border-white/[0.08] bg-slate-950/55 text-slate-300 hover:border-border-strong/80 hover:bg-white/[0.04]",
                      )}
                    >
                      <span className="text-sm font-semibold">{preset.label}</span>
                      <span className="mt-2 block text-xs leading-5 text-foreground-subtle">
                        {preset.summary}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card
              eyebrow="Legs"
              title={baseStrategy.name}
              description={baseStrategy.description}
              actions={<StepBadge label="Editable legs" tone="ready" />}
            >
              <div className="space-y-5">
                <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
                  <div className="min-w-[620px]">
                    <div className="grid grid-cols-[1.25fr_0.7fr_0.7fr_0.95fr_0.95fr_0.45fr] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                      <span>Leg</span>
                      <span>Side</span>
                      <span>Type</span>
                      <span>Strike</span>
                      <span>Premium</span>
                      <span>Qty</span>
                    </div>
                    {baseStrategy.legs.map((leg, index) => {
                      const editable = strategyLegInputs.find(
                        (entry) => entry.id === leg.id,
                      );

                      return (
                        <div
                          key={leg.id}
                          className={cn(
                            "grid grid-cols-[1.25fr_0.7fr_0.7fr_0.95fr_0.95fr_0.45fr] items-center gap-3 px-5 py-4 text-sm text-foreground-soft not-last:border-b not-last:border-white/[0.08]",
                            index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                          )}
                        >
                          <span className="font-semibold text-foreground">
                            {leg.label}
                          </span>
                          <span className="capitalize">{leg.position}</span>
                          <span className="capitalize">{leg.optionType}</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={editable?.strike ?? ""}
                            onChange={(event) =>
                              updateStrategyLegInput(
                                leg.id,
                                "strike",
                                event.target.value,
                              )
                            }
                            className="w-full rounded-[0.9rem] border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/60"
                          />
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.0001"
                            value={editable?.premium ?? ""}
                            onChange={(event) =>
                              updateStrategyLegInput(
                                leg.id,
                                "premium",
                                event.target.value,
                              )
                            }
                            className="w-full rounded-[0.9rem] border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/60"
                          />
                          <span>{leg.quantity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[1.3rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.78),rgba(10,17,26,0.56))] px-4 py-3 text-xs leading-6 text-foreground-muted">
                  Net premium is positive for a debit paid and negative for a
                  credit received. Premium defaults are model estimates, not
                  live market quotes.
                </div>
              </div>
            </Card>
          </div>

          {strategyAnalysis ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <OptionMetricCard
                  label="Net premium"
                  value={
                    strategyAnalysis.metrics.netPremium >= 0
                      ? `Debit ${formatNumber(strategyAnalysis.metrics.netPremium)}`
                      : `Credit ${formatNumber(
                          Math.abs(strategyAnalysis.metrics.netPremium),
                        )}`
                  }
                  meta="Positive means paid"
                  accent
                />
                <OptionMetricCard
                  label="Max profit"
                  value={formatFiniteOrUnlimited(
                    strategyAnalysis.metrics.maxProfit,
                  )}
                  meta={
                    strategyAnalysis.metrics.metricSource === "exact"
                      ? "Exact preset formula"
                      : "From plotted range"
                  }
                />
                <OptionMetricCard
                  label="Max loss"
                  value={formatFiniteOrUnlimited(
                    strategyAnalysis.metrics.maxLoss,
                  )}
                  meta={
                    strategyAnalysis.metrics.metricSource === "exact"
                      ? "Exact preset formula"
                      : "From plotted range"
                  }
                />
                <OptionMetricCard
                  label="Breakeven"
                  value={formatBreakevens(
                    strategyAnalysis.metrics.breakevenPoints,
                  )}
                  meta={
                    strategyAnalysis.metrics.metricSource === "exact"
                      ? "Exact preset formula"
                      : "Interpolated on grid"
                  }
                />
                <OptionMetricCard
                  label="Bias"
                  value={strategyAnalysis.metrics.bias}
                  meta="Preset classification"
                />
              </div>

              <ExpandableChartCard
                eyebrow="Payoff"
                title="Combined strategy profile"
                description="Aggregated payoff and profit/loss across all legs at expiry."
                detailDescription="Expanded strategy payoff view with combined payoff, profit/loss, breakeven markers, and current spot marker."
                renderPreview={() => (
                  <div className="space-y-5">
                    <StrategyPayoffChart
                      data={strategyAnalysis.payoffPoints}
                      currentSpot={pricing.inputs.spot}
                      breakevenPoints={strategyAnalysis.metrics.breakevenPoints}
                    />

                    <div className="grid gap-3 sm:grid-cols-3">
                      <SummaryCard
                        label="Current spot"
                        value={formatNumber(pricing.inputs.spot)}
                      />
                      <SummaryCard
                        label="Base strike"
                        value={formatNumber(pricing.inputs.strike)}
                      />
                      <SummaryCard
                        label="Model volatility"
                        value={formatPercent(pricing.inputs.volatility)}
                      />
                    </div>
                  </div>
                )}
                detail={
                  <StrategyPayoffChart
                    data={strategyAnalysis.payoffPoints}
                    currentSpot={pricing.inputs.spot}
                    breakevenPoints={strategyAnalysis.metrics.breakevenPoints}
                    heightClassName="h-[24rem] sm:h-[32rem] lg:h-[40rem]"
                    interactive
                  />
                }
              />
            </>
          ) : (
            <div className="rounded-[1.35rem] border border-amber-300/25 bg-amber-300/[0.08] px-4 py-3 text-sm leading-6 text-amber-100">
              Enter positive strikes and non-negative premiums to calculate the
              strategy payoff.
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function InputGroup({
  title,
  description,
  fields,
  form,
  errors,
  onChange,
  compact = false,
}: {
  title: string;
  description: string;
  fields: Array<{
    name: FieldName;
    label: string;
    step: string;
    hint: string;
  }>;
  form: FormState;
  errors: FormErrors;
  onChange: (name: keyof FormState, value: string) => void;
  compact?: boolean;
}) {
  return (
    <SurfaceCard padding="sm" className="border-white/[0.08]">
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
            {title}
          </p>
          <p className="mt-2 text-sm leading-6 text-foreground-soft">{description}</p>
        </div>

        <div className={cn("grid gap-4", compact ? "sm:grid-cols-1" : "sm:grid-cols-2")}>
          {fields.map((field) => (
            <label key={field.name} className="space-y-2">
              <span className="block text-sm font-semibold text-foreground">
                {field.label}
              </span>
              <input
                type="number"
                inputMode="decimal"
                step={field.step}
                value={form[field.name]}
                onChange={(event) => onChange(field.name, event.target.value)}
                className={cn(
                  "w-full rounded-[1.15rem] border bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition",
                  errors[field.name]
                    ? "border-rose-400/70 focus:border-rose-300"
                    : "border-white/10 focus:border-accent/60",
                )}
              />
              <div className="min-h-10 space-y-1">
                <p className="text-xs leading-5 text-foreground-muted">{field.hint}</p>
                {errors[field.name] ? (
                  <p className="text-xs leading-5 text-rose-300">{errors[field.name]}</p>
                ) : null}
              </div>
            </label>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}

function OptionsSectionTabs({
  activeSection,
  onChange,
}: {
  activeSection: OptionSectionId;
  onChange: (section: OptionSectionId) => void;
}) {
  return (
    <SurfaceCard tone="elevated" padding="sm" className="border-white/[0.08]">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
              Workspace sections
            </p>
            <p className="max-w-2xl text-sm leading-7 text-foreground-soft">
              Move from pricing into comparison and future derivatives workflows
              through a consistent product shell.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SectionSignal label="Pricing" value="Live" tone="ready" />
            <SectionSignal label="Comparison" value="Live" tone="ready" />
            <SectionSignal label="Volatility" value="Live" tone="ready" />
            <SectionSignal label="Strategies" value="Live" tone="ready" />
          </div>
        </div>

        <div
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          role="tablist"
          aria-label="Options analytics sections"
        >
          {optionSections.map((section) => {
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                id={`${section.id}-tab`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${section.id}-panel`}
                onClick={() => onChange(section.id)}
                className={cn(
                  "group rounded-[1.6rem] border px-5 py-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                  isActive
                    ? "border-accent/30 bg-[radial-gradient(circle_at_top_right,rgba(226,184,107,0.12),transparent_28%),linear-gradient(180deg,rgba(25,34,47,0.96),rgba(12,18,27,0.96))] shadow-[0_18px_42px_rgba(196,154,74,0.12)]"
                    : "border-white/[0.06] bg-[linear-gradient(180deg,rgba(11,18,28,0.86),rgba(8,13,21,0.8))] hover:border-border-strong/80 hover:bg-[linear-gradient(180deg,rgba(15,23,35,0.92),rgba(9,15,23,0.88))]",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                        Step {section.step}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                          isActive && "border-accent/25 bg-accent/10 text-accent-foreground",
                          !isActive &&
                            "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200",
                        )}
                      >
                        {isActive ? "Current" : "Live"}
                      </span>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        {section.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-foreground-soft">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold transition",
                      isActive
                        ? "border-accent/30 bg-accent/12 text-accent-foreground"
                        : "border-white/[0.08] bg-slate-950/55 text-foreground-muted group-hover:border-border-strong/80 group-hover:text-foreground",
                    )}
                  >
                    {section.step}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </SurfaceCard>
  );
}

function OptionMetricCard({
  label,
  value,
  meta,
  accent = false,
}: {
  label: string;
  value: string;
  meta?: string;
  accent?: boolean;
}) {
  return (
    <SurfaceCard
      tone={accent ? "accent" : "elevated"}
      padding="sm"
      className="h-full border-white/[0.08]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
            {label}
          </p>
          <p className="mt-4 text-[1.85rem] font-semibold tracking-[-0.04em] text-foreground">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
            accent
              ? "border-accent/25 bg-accent/12 text-accent-foreground"
              : "border-white/[0.08] bg-background-muted/80 text-foreground-subtle",
          )}
        >
          Metric
        </span>
      </div>
      {meta ? (
        <p className="mt-3 text-sm leading-6 text-foreground-soft">{meta}</p>
      ) : null}
    </SurfaceCard>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.76),rgba(10,17,26,0.54))] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-3 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function NoteCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.76),rgba(10,17,26,0.54))] px-4 py-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-foreground-soft">{body}</p>
    </div>
  );
}

function StagePanel({
  step,
  label,
  body,
  state,
}: {
  step: string;
  label: string;
  body: string;
  state: "pending" | "active" | "ready";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.6rem] border px-4 py-4",
        state === "ready" &&
          "border-emerald-400/18 bg-emerald-400/[0.06] text-emerald-100",
        state === "active" &&
          "border-accent/18 bg-accent/[0.07] text-accent-foreground",
        state === "pending" &&
          "border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,16,24,0.72),rgba(10,16,24,0.46))] text-foreground",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
            Step {step}
          </p>
          <p className="mt-3 text-sm font-semibold text-current">{label}</p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
            state === "ready" &&
              "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200",
            state === "active" &&
              "border-accent/25 bg-accent/12 text-accent-foreground",
            state === "pending" &&
              "border-white/[0.08] bg-background-muted/80 text-foreground-subtle",
          )}
        >
          {state === "ready" ? "Ready" : state === "active" ? "Current" : "Pending"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-foreground-soft">{body}</p>
    </div>
  );
}

function WorkspaceSignal({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "active" | "ready";
}) {
  return (
    <SurfaceCard
      padding="sm"
      className={cn(
        "h-full border-white/[0.08]",
        tone === "active" && "border-accent/18",
        tone === "ready" && "border-emerald-400/18",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-3 text-sm font-semibold leading-6 text-foreground">{value}</p>
      <p className="mt-3 text-sm leading-6 text-foreground-soft">{detail}</p>
    </SurfaceCard>
  );
}

function SectionSignal({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ready" | "pending";
}) {
  return (
    <div
      className={cn(
        "rounded-full border px-3 py-2 text-xs",
        tone === "ready"
          ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-100"
          : "border-white/[0.08] bg-background-muted/80 text-foreground-subtle",
      )}
    >
      <span className="font-semibold uppercase tracking-[0.16em]">{label}</span>
      <span className="ml-2 text-foreground-soft">{value}</span>
    </div>
  );
}

function StepBadge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "ready";
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]",
        tone === "ready"
          ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
          : "border-accent/20 bg-accent/10 text-accent-foreground",
      )}
    >
      {label}
    </span>
  );
}
