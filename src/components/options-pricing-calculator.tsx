"use client";

import { useState, type ReactNode } from "react";
import { Card } from "@/components/card";
import { ExpandableChartCard } from "@/components/expandable-chart-card";
import { OptionsPayoffChart } from "@/components/options-payoff-chart";
import {
  blackScholesValuation,
  type BlackScholesInput,
  type BlackScholesValuation,
  type OptionType,
} from "@/lib/finance/black-scholes";
import {
  buildBinomialConvergenceSeries,
  priceEuropeanBinomial,
} from "@/lib/finance/binomial";
import { buildOptionPayoffSeries } from "@/lib/finance/option-payoff";

type FormState = {
  spot: string;
  strike: string;
  maturity: string;
  rate: string;
  volatility: string;
  dividendYield: string;
  steps: string;
  optionType: OptionType;
};

type FieldName = keyof Omit<FormState, "optionType">;
type FormErrors = Partial<Record<keyof FormState, string>>;
type CalculatorInput = BlackScholesInput & {
  steps: number;
};
type PricingState = {
  blackScholes: BlackScholesValuation;
  binomialPrice: number;
  absoluteDifference: number;
  percentageDifference: number;
  convergence: Array<{
    steps: number;
    price: number;
    absoluteDifference: number;
  }>;
  inputs: CalculatorInput;
};
type OptionSectionId =
  | "pricing"
  | "comparison"
  | "volatility"
  | "strategies";

const DEFAULT_FORM: FormState = {
  optionType: "call",
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
}> = [
  {
    id: "pricing",
    label: "Pricing",
    description: "Inputs, valuation, Greeks, and expiry profile.",
  },
  {
    id: "comparison",
    label: "Model comparison",
    description: "Black-Scholes versus CRR cross-checks.",
  },
  {
    id: "volatility",
    label: "Volatility",
    description: "Reserved for implied vol and surface workflows.",
  },
  {
    id: "strategies",
    label: "Strategies",
    description: "Reserved for multi-leg structures and scenario views.",
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

function buildPricingState(values: CalculatorInput): PricingState {
  const blackScholes = blackScholesValuation(values);
  const binomialPrice = priceEuropeanBinomial({
    spot: values.spot,
    strike: values.strike,
    rate: values.rate,
    volatility: values.volatility,
    maturityYears: values.maturity,
    steps: values.steps,
    optionType: values.optionType,
    dividendYield: values.dividendYield,
  });
  const absoluteDifference = Math.abs(binomialPrice - blackScholes.price);
  const percentageDifference =
    blackScholes.price === 0
      ? 0
      : (absoluteDifference / Math.abs(blackScholes.price)) * 100;
  const convergence = buildBinomialConvergenceSeries(
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
    [25, 50, 100, 250, 500],
  );

  return {
    blackScholes,
    binomialPrice,
    absoluteDifference,
    percentageDifference,
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
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [activeSection, setActiveSection] =
    useState<OptionSectionId>("pricing");

  const payoffData = buildOptionPayoffSeries(
    pricing.inputs,
    pricing.blackScholes.price,
  );

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
      setPricing(buildPricingState(parsed.values));
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

  const contractSummary = [
    {
      label: "Instrument",
      value: pricing.inputs.optionType === "call" ? "European call" : "European put",
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
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm">
        <div
          className="grid gap-2 md:grid-cols-2 xl:grid-cols-4"
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
                onClick={() => setActiveSection(section.id)}
                className={`rounded-[1.35rem] border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 ${
                  isActive
                    ? "border-sky-400/30 bg-sky-400/[0.12] text-white"
                    : "border-white/5 bg-slate-950/50 text-slate-300 hover:border-white/15 hover:bg-white/[0.05]"
                }`}
              >
                <p className="text-sm font-semibold">{section.label}</p>
                <p
                  className={`mt-2 text-xs leading-5 ${
                    isActive ? "text-sky-100/80" : "text-slate-400"
                  }`}
                >
                  {section.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {pricingError ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-200">
          {pricingError}
        </div>
      ) : null}

      {activeSection === "pricing" ? (
        <div
          id="pricing-panel"
          role="tabpanel"
          aria-labelledby="pricing-tab"
          className="space-y-4"
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
            <Card
              eyebrow="Pricing Setup"
              title="Option inputs"
              description="Set the contract and market assumptions for the pricing run."
              className="h-fit xl:sticky xl:top-24"
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
                        onChange={(event) =>
                          updateField(field.name, event.target.value)
                        }
                        className={`w-full rounded-2xl border bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition ${
                          errors[field.name]
                            ? "border-rose-400/70 focus:border-rose-300"
                            : "border-white/10 focus:border-sky-400/60"
                        }`}
                      />
                      <div className="min-h-10 space-y-1">
                        <p className="text-xs text-slate-400">{field.hint}</p>
                        {errors[field.name] ? (
                          <p className="text-xs text-rose-300">
                            {errors[field.name]}
                          </p>
                        ) : null}
                      </div>
                    </label>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs leading-6 text-slate-400">
                  Use decimals for rates and volatility: `0.05` means 5% and
                  `0.20` means 20%.
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                  >
                    Reprice contract
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

            <div className="space-y-4">
              <Card
                eyebrow="Pricing"
                title="Black-Scholes-Merton valuation"
                description="Primary analytical result for the selected European contract."
              >
                <div className="space-y-6">
                  <div className="rounded-3xl border border-sky-400/20 bg-sky-400/[0.08] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200/80">
                      Model price
                    </p>
                    <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="text-4xl font-semibold tracking-tight text-white">
                          {formatNumber(pricing.blackScholes.price)}
                        </p>
                        <p className="mt-2 text-sm text-slate-300">
                          {pricing.inputs.optionType === "call" ? "Call" : "Put"} priced
                          with continuous dividends.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-sky-300/15 bg-slate-950/35 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/70">
                          Tree benchmark
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {formatNumber(pricing.binomialPrice)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Contract summary
                      </h3>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {pricing.inputs.steps} CRR steps
                      </p>
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
                title="Greeks snapshot"
                description="Analytical sensitivities from the current Black-Scholes-Merton run."
              >
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {greekDisplayConfig.map((greek) => (
                      <MetricCard
                        key={greek.key}
                        label={greek.label}
                        value={formatNumber(pricing.blackScholes[greek.key])}
                        meta={greek.unit}
                      />
                    ))}
                  </div>
                  <p className="text-xs leading-6 text-slate-400">
                    Vega and rho are reported per 1.00 absolute move in volatility
                    and rate. Theta is annualized.
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
                  optionPrice={pricing.blackScholes.price}
                  onChartClick={open}
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard
                    label="Payoff view"
                    value={pricing.inputs.optionType === "call" ? "Long call" : "Long put"}
                    meta="Intrinsic value at expiry"
                  />
                  <MetricCard
                    label="Profit curve"
                    value={formatNumber(pricing.blackScholes.price)}
                    meta="Current premium used as cost basis"
                  />
                  <MetricCard
                    label="Markers"
                    value="Spot and strike"
                    meta="Dashed reference levels"
                  />
                </div>
              </div>
            )}
            detail={
              <OptionsPayoffChart
                data={payoffData}
                inputs={pricing.inputs}
                optionPrice={pricing.blackScholes.price}
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
          className="space-y-4"
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
            <Card
              eyebrow="Comparison"
              title="Black-Scholes vs CRR"
              description="Cross-check the analytical benchmark against a European Cox-Ross-Rubinstein tree."
            >
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Black-Scholes"
                    value={formatNumber(pricing.blackScholes.price)}
                  />
                  <MetricCard
                    label="CRR binomial"
                    value={formatNumber(pricing.binomialPrice)}
                  />
                  <MetricCard
                    label="Absolute difference"
                    value={formatNumber(pricing.absoluteDifference)}
                  />
                  <MetricCard
                    label="Percentage difference"
                    value={`${formatNumber(pricing.percentageDifference)}%`}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <SummaryCard
                    label="Contract"
                    value={pricing.inputs.optionType === "call" ? "European call" : "European put"}
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
              </div>
            </Card>

            <Card
              eyebrow="Notes"
              title="Model context"
              description="Compact guidance on how to interpret the two views."
            >
              <div className="space-y-3">
                <NoteCard
                  title="Analytical benchmark"
                  body="Black-Scholes-Merton provides the primary price and Greeks for the selected European payoff."
                />
                <NoteCard
                  title="Numerical cross-check"
                  body="The CRR tree prices the same contract with backward induction using the selected number of time steps."
                />
                <NoteCard
                  title="Read the gap"
                  body="The comparison is most useful as a validation check and to observe convergence as the tree gets deeper."
                />
              </div>
            </Card>
          </div>

          <Card
            eyebrow="Convergence"
            title="Binomial convergence table"
            description="CRR pricing across increasing tree depths relative to the analytical benchmark."
          >
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
                <div className="grid grid-cols-[1fr_1.3fr_1fr] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <span>Steps</span>
                  <span>Binomial price</span>
                  <span>Abs diff</span>
                </div>
                {pricing.convergence.map((row) => (
                  <div
                    key={row.steps}
                    className="grid grid-cols-[1fr_1.3fr_1fr] gap-3 px-4 py-3 text-sm text-slate-200 not-last:border-b not-last:border-white/10"
                  >
                    <span>{row.steps}</span>
                    <span>{formatNumber(row.price)}</span>
                    <span>{formatNumber(row.absoluteDifference)}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs leading-6 text-slate-400">
                For European options, the CRR estimate should generally tighten
                toward the Black-Scholes benchmark as the number of steps increases.
              </p>
            </div>
          </Card>
        </div>
      ) : null}

      {activeSection === "volatility" ? (
        <div
          id="volatility-panel"
          role="tabpanel"
          aria-labelledby="volatility-tab"
        >
          <ComingNextCard
            eyebrow="Volatility"
            title="Volatility workflows are planned next"
            description="This section is reserved for implied volatility and forward-looking volatility analysis once the pricing workflow is fully settled."
            items={[
              {
                label: "Planned",
                value: "Implied vol solver",
              },
              {
                label: "Planned",
                value: "Sensitivity sweeps",
              },
              {
                label: "Planned",
                value: "Scenario-ready layout",
              },
            ]}
          />
        </div>
      ) : null}

      {activeSection === "strategies" ? (
        <div
          id="strategies-panel"
          role="tabpanel"
          aria-labelledby="strategies-tab"
        >
          <ComingNextCard
            eyebrow="Strategies"
            title="Strategy analytics will live here"
            description="This section is reserved for multi-leg structures, payoff aggregation, and cleaner scenario comparison once the single-option workflow is complete."
            items={[
              {
                label: "Planned",
                value: "Multi-leg payoff builder",
              },
              {
                label: "Planned",
                value: "Strategy P/L views",
              },
              {
                label: "Planned",
                value: "Reusable scenario blocks",
              },
            ]}
          />
        </div>
      ) : null}
    </section>
  );
}

function MetricCard({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
      {meta ? <p className="mt-2 text-xs text-slate-400">{meta}</p> : null}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function NoteCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}

function ComingNextCard({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: Array<{
    label: string;
    value: string;
  }>;
}) {
  return (
    <Card eyebrow={eyebrow} title={title} description={description}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <div className="rounded-3xl border border-dashed border-white/15 bg-slate-950/45 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/80">
            Coming next
          </p>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            Reserved for the next layer of option analytics
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            The pricing surface is in place first. This section stays intentionally
            clean until the next workflow is ready to ship.
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <SummaryCard
              key={`${item.label}-${item.value}`}
              label={item.label}
              value={item.value}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
