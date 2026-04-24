import type {
  BinomialPricingInput,
  ExerciseStyle,
  OptionPricingInput,
  OptionType,
} from "@/lib/finance/options/types";

export function assertFinite(value: number, field: string) {
  if (!Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
}

export function validateOptionType(optionType: OptionType) {
  if (optionType !== "call" && optionType !== "put") {
    throw new Error("optionType must be 'call' or 'put'");
  }
}

export function validateExerciseStyle(exerciseStyle: ExerciseStyle) {
  if (exerciseStyle !== "european" && exerciseStyle !== "american") {
    throw new Error("exerciseStyle must be 'european' or 'american'");
  }
}

export function validatePositiveScalar(value: number, field: string) {
  assertFinite(value, field);

  if (value <= 0) {
    throw new Error(`${field} must be positive`);
  }
}

export function validateNonNegativeScalar(value: number, field: string) {
  assertFinite(value, field);

  if (value < 0) {
    throw new Error(`${field} must be non-negative`);
  }
}

export function validateFiniteScalar(value: number, field: string) {
  assertFinite(value, field);
}

export function validateBinomialSteps(steps: number) {
  assertFinite(steps, "steps");

  if (!Number.isInteger(steps) || steps <= 0) {
    throw new Error("steps must be a positive integer");
  }
}

export function validateOptionPricingInput(input: OptionPricingInput) {
  validateOptionType(input.optionType);
  validatePositiveScalar(input.spot, "spot");
  validatePositiveScalar(input.strike, "strike");
  validatePositiveScalar(input.maturity, "maturity");
  validateFiniteScalar(input.rate, "rate");
  validatePositiveScalar(input.volatility, "volatility");
  validateFiniteScalar(input.dividendYield, "dividendYield");
}

export function validateBinomialPricingInput(input: BinomialPricingInput) {
  validateOptionType(input.optionType);

  if (input.exerciseStyle) {
    validateExerciseStyle(input.exerciseStyle);
  }

  validatePositiveScalar(input.spot, "spot");
  validatePositiveScalar(input.strike, "strike");
  validatePositiveScalar(input.maturity, "maturity");
  validateFiniteScalar(input.rate, "rate");
  validatePositiveScalar(input.volatility, "volatility");
  validateFiniteScalar(input.dividendYield ?? 0, "dividendYield");
  validateBinomialSteps(input.steps);
}
