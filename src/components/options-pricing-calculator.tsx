"use client";

import { useState } from "react";
import { Card } from "@/components/card";
import {
  blackScholesValuation,
  type BlackScholesInput,
  type OptionType,
  type BlackScholesValuation,
} from "@/lib/finance/black-scholes";

type FormState = {
  spot: string;
  strike: string;
  maturity: string;
  rate: string;
  volatility: string;
  dividendYield: string;
  optionType: OptionType;
};

type FieldName = keyof Omit<FormState, "optionType">;
type FormErrors = Partial<Record<keyof FormState, string>>;
type PricingState = {
  valuation: BlackScholesValuation;
  inputs: BlackScholesInput;
};

const DEFAULT_FORM: FormState = {
  optionType: "call",
  spot: "100",
  strike: "100",
  maturity: "1",
  rate: "0.05",
  volatility: "0.20",
  dividendYield: "0.02",
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

function parseForm(form: FormState): {
  errors: FormErrors;
  values?: BlackScholesInput;
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

  if (spot.error) errors.spot = spot.error;
  if (strike.error) errors.strike = strike.error;
  if (maturity.error) errors.maturity = maturity.error;
  if (rate.error) errors.rate = rate.error;
  if (volatility.error) errors.volatility = volatility.error;
  if (dividendYield.error) errors.dividendYield = dividendYield.error;

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors,
    values: {
      optionType: form.optionType,
      spot: spot.value as number,
      strike: strike.value as number,
      maturity: maturity.value as number,
      rate: rate.value as number,
      volatility: volatility.value as number,
      dividendYield: dividendYield.value as number,
    },
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function createInitialPricingState(): PricingState {
  const parsed = parseForm(DEFAULT_FORM);

  if (!parsed.values) {
    throw new Error("Default form values must be valid");
  }

  return {
    valuation: blackScholesValuation(parsed.values),
    inputs: parsed.values,
  };
}

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

export function OptionsPricingCalculator() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pricing, setPricing] = useState<PricingState>(createInitialPricingState);
  const [pricingError, setPricingError] = useState<string | null>(null);

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
      const valuation = blackScholesValuation(parsed.values);
      setErrors({});
      setPricing({ valuation, inputs: parsed.values });
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
    setPricing(createInitialPricingState());
    setPricingError(null);
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <Card
        eyebrow="European Option"
        title="Black-Scholes-Merton input panel"
        description="Enter scalar assumptions for a European call or put. Rates, volatility, and dividend yield should be entered in decimal form."
        className="h-full"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Option type
            </span>
            <div className="grid grid-cols-2 gap-3">
              {(["call", "put"] as const).map((type) => {
                const isActive = form.optionType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateField("optionType", type)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium capitalize transition ${
                      isActive
                        ? "border-sky-400/70 bg-sky-400/15 text-sky-100"
                        : "border-white/10 bg-slate-950/60 text-slate-300 hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {numericFieldConfig.map((field) => (
              <label key={field.name} className="space-y-2">
                <span className="block text-sm font-medium text-slate-100">
                  {field.label}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step={field.step}
                  value={form[field.name]}
                  onChange={(event) => updateField(field.name, event.target.value)}
                  className={`w-full rounded-2xl border bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition ${
                    errors[field.name]
                      ? "border-rose-400/70 focus:border-rose-300"
                      : "border-white/10 focus:border-sky-400/60"
                  }`}
                />
                <div className="min-h-10 space-y-1">
                  <p className="text-xs text-slate-400">{field.hint}</p>
                  {errors[field.name] ? (
                    <p className="text-xs text-rose-300">{errors[field.name]}</p>
                  ) : null}
                </div>
              </label>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs leading-6 text-slate-400">
            Use decimals for rates and volatility: 0.05 means 5%, 0.20 means
            20%.
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              Price option
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.04]"
            >
              Reset defaults
            </button>
          </div>
        </form>
      </Card>

      <Card
        eyebrow="Result"
        title="European option value and Greeks"
        description="The output uses the dividend-yield Black-Scholes-Merton model for price and first- and second-order sensitivities."
        className="h-full"
      >
        <div className="space-y-6">
          <div className="rounded-3xl border border-sky-400/20 bg-sky-400/[0.08] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200/80">
              Option price
            </p>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-white">
              {formatNumber(pricing.valuation.price)}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {pricing.inputs.optionType === "call" ? "Call" : "Put"} with spot{" "}
              {formatNumber(pricing.inputs.spot)}, strike{" "}
              {formatNumber(pricing.inputs.strike)}, maturity{" "}
              {formatNumber(pricing.inputs.maturity)}, rate{" "}
              {formatNumber(pricing.inputs.rate)}, volatility{" "}
              {formatNumber(pricing.inputs.volatility)}, and dividend yield{" "}
              {formatNumber(pricing.inputs.dividendYield)}.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
              Greeks
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {greekDisplayConfig.map((greek) => (
                <div
                  key={greek.key}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-100">
                        {greek.label}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {greek.unit}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {formatNumber(pricing.valuation[greek.key])}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs leading-6 text-slate-400">
              Vega and rho are reported per 1.00 absolute change in volatility
              and rate. Theta is annualized.
            </p>
          </div>

          {pricingError ? (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-200">
              {pricingError}
            </div>
          ) : null}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
              Model note
            </h3>
            <p className="text-sm leading-7 text-slate-300">
              This implementation validates inputs, computes d1 and d2, applies
              continuous discounting for both the risk-free rate and dividend
              yield, and then prices either the call or put branch with the
              corresponding Greeks.
            </p>
            <p className="text-sm leading-7 text-slate-300">
              It remains intentionally minimal: pure reusable finance functions,
              scalar inputs only, and frontend-only presentation.
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}
