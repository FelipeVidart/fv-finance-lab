import { blackScholesPrice } from "@/lib/finance/options/blackScholes";
import { priceCrrBinomial } from "@/lib/finance/options/binomial";
import type {
  SensitivityPricingInput,
  SensitivityScenarioResult,
  SensitivityScenarioRow,
  SensitivityScenarioType,
} from "@/lib/finance/options/types";
import { validateOptionPricingInput } from "@/lib/finance/options/validation";

const MIN_POSITIVE_INPUT = 0.0001;
const DEFAULT_AMERICAN_STEPS = 100;

function clampPositive(value: number): number {
  return Math.max(value, MIN_POSITIVE_INPUT);
}

function uniqueSorted(values: number[]): number[] {
  return Array.from(new Set(values.map((value) => Number(value.toFixed(8))))).sort(
    (a, b) => a - b,
  );
}

function formatSignedInteger(value: number): string {
  const rounded = Math.round(value);

  if (rounded > 0) {
    return `+${rounded}`;
  }

  return `${rounded}`;
}

function priceScenario(input: SensitivityPricingInput): number {
  const exerciseStyle = input.exerciseStyle ?? "european";

  if (exerciseStyle === "american") {
    return priceCrrBinomial({
      spot: input.spot,
      strike: input.strike,
      rate: input.rate,
      volatility: input.volatility,
      maturity: input.maturity,
      steps: input.steps ?? DEFAULT_AMERICAN_STEPS,
      optionType: input.optionType,
      dividendYield: input.dividendYield,
      exerciseStyle: "american",
    }).price;
  }

  return blackScholesPrice(input);
}

function buildRows({
  input,
  scenarioType,
  values,
  formatLabel,
  applyValue,
}: {
  input: SensitivityPricingInput;
  scenarioType: SensitivityScenarioType;
  values: number[];
  formatLabel: (value: number, isBase: boolean) => string;
  applyValue: (value: number) => SensitivityPricingInput;
}): SensitivityScenarioResult {
  validateOptionPricingInput(input);

  const exerciseStyle = input.exerciseStyle ?? "european";
  const basePrice = priceScenario(input);

  const rows: SensitivityScenarioRow[] = values.map((value) => {
    const isBase =
      (scenarioType === "volatility" &&
        Math.abs(value - input.volatility) < 1e-8) ||
      (scenarioType === "spot" && Math.abs(value - input.spot) < 1e-8) ||
      (scenarioType === "maturity" && Math.abs(value - input.maturity) < 1e-8);
    const price = priceScenario(applyValue(value));
    const priceDifference = price - basePrice;

    return {
      label: formatLabel(value, isBase),
      inputValue: value,
      price,
      priceDifference,
      percentageDifference:
        basePrice === 0 ? 0 : (priceDifference / Math.abs(basePrice)) * 100,
      isBase,
    };
  });

  return {
    scenarioType,
    basePrice,
    exerciseStyle,
    rows,
  };
}

export function buildOptionSensitivityScenarios(
  input: SensitivityPricingInput,
  scenarioType: SensitivityScenarioType,
): SensitivityScenarioResult {
  if (scenarioType === "volatility") {
    const values = uniqueSorted(
      [-0.1, -0.05, 0, 0.05, 0.1].map((shift) =>
        clampPositive(input.volatility + shift),
      ),
    );

    return buildRows({
      input,
      scenarioType,
      values,
      formatLabel: (value, isBase) =>
        isBase
          ? "Base"
          : `Vol ${formatSignedInteger((value - input.volatility) * 100)} pp`,
      applyValue: (volatility) => ({
        ...input,
        volatility,
      }),
    });
  }

  if (scenarioType === "spot") {
    const values = uniqueSorted(
      [0.8, 0.9, 0.95, 1, 1.05, 1.1, 1.2].map((multiplier) =>
        clampPositive(input.spot * multiplier),
      ),
    );

    return buildRows({
      input,
      scenarioType,
      values,
      formatLabel: (value, isBase) =>
        isBase
          ? "Base"
          : `Spot ${formatSignedInteger((value / input.spot - 1) * 100)}%`,
      applyValue: (spot) => ({
        ...input,
        spot,
      }),
    });
  }

  const values = uniqueSorted(
    [0.5, 0.75, 1, 1.25, 1.5].map((multiplier) =>
      clampPositive(input.maturity * multiplier),
    ),
  );

  return buildRows({
    input,
    scenarioType,
    values,
    formatLabel: (value, isBase) =>
      isBase
        ? "Base"
        : `Maturity ${formatSignedInteger(
            (value / input.maturity - 1) * 100,
          )}%`,
    applyValue: (maturity) => ({
      ...input,
      maturity,
    }),
  });
}
