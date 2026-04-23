"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/card";
import { ExpandableChartCard } from "@/components/expandable-chart-card";
import { OptionsPayoffChart } from "@/components/options-payoff-chart";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
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
    description: "Reserved for implied-volatility and surface-oriented workflows.",
  },
  {
    id: "strategies",
    step: "04",
    label: "Strategies",
    description: "Reserved for multi-leg structures and scenario comparison workspaces.",
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

  const contractSummary = useMemo(
    () => [
      {
        label: "Instrument",
        value:
          pricing.inputs.optionType === "call" ? "European call" : "European put",
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
    [pricing.inputs],
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
                label="Valuation and Greeks"
                body="Read the Black-Scholes result as the primary valuation layer, then inspect sensitivities."
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
              value="Black-Scholes-Merton"
              detail="The analytical benchmark remains the default pricing lens for the workspace."
              tone="ready"
            />
            <WorkspaceSignal
              label="Cross-check"
              value={`${pricing.inputs.steps} step CRR tree`}
              detail="The binomial layer stays visible as a validation benchmark rather than a competing primary surface."
              tone="active"
            />
            <WorkspaceSignal
              label="Current contract"
              value={
                pricing.inputs.optionType === "call" ? "European call" : "European put"
              }
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
                title="Analytical valuation block"
                description="Primary price output and model context for the current European contract."
                tone="elevated"
              >
                <div className="space-y-6">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.06fr)_minmax(20rem,0.94fr)]">
                    <SurfaceCard tone="accent" padding="md" className="border-accent/25">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-foreground/80">
                        Black-Scholes value
                      </p>
                      <p className="mt-5 text-[3rem] font-semibold tracking-[-0.05em] text-foreground">
                        {formatNumber(pricing.blackScholes.price)}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-foreground-soft">
                        {pricing.inputs.optionType === "call" ? "Call" : "Put"} valuation under continuous dividend treatment. This remains the primary analytical output in the workspace.
                      </p>
                    </SurfaceCard>

                    <div className="grid gap-3">
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
                title="Greeks snapshot"
                description="Sensitivity measures from the current Black-Scholes run, presented as the immediate risk surface for the option."
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
                    Vega and rho are reported per 1.00 absolute move in volatility and rate. Theta is annualized, so read it as a model sensitivity rather than a daily decay number.
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
                  <OptionMetricCard
                    label="Payoff structure"
                    value={
                      pricing.inputs.optionType === "call" ? "Long call" : "Long put"
                    }
                    meta="Intrinsic value at expiry"
                  />
                  <OptionMetricCard
                    label="Premium basis"
                    value={formatNumber(pricing.blackScholes.price)}
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
          className="space-y-6"
        >
          <SurfaceCard tone="elevated" padding="md" className="border-white/[0.08]">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(23rem,0.84fr)]">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
                  Model comparison
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  Validate the analytical benchmark against the CRR tree.
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-soft">
                  The comparison layer exists to strengthen pricing confidence,
                  not to distract from the primary valuation block. Read the gap
                  and convergence path as quality checks on the current setup.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
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
              </div>
            </div>
          </SurfaceCard>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
            <Card
              eyebrow="Comparison"
              title="Model framing"
              description="Compact context for how the two valuation views relate to each other."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryCard
                  label="Contract"
                  value={
                    pricing.inputs.optionType === "call" ? "European call" : "European put"
                  }
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
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.14fr)_minmax(18rem,0.86fr)]">
              <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
                <div className="min-w-[620px]">
                  <div className="grid grid-cols-[0.8fr_1.2fr_1fr] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                    <span>Steps</span>
                    <span>Binomial price</span>
                    <span>Abs diff</span>
                  </div>
                  {pricing.convergence.map((row, index) => (
                    <div
                      key={row.steps}
                      className={cn(
                        "grid grid-cols-[0.8fr_1.2fr_1fr] gap-3 px-5 py-4 text-sm text-foreground-soft not-last:border-b not-last:border-white/[0.08]",
                        index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                      )}
                    >
                      <span className="font-semibold text-foreground">{row.steps}</span>
                      <span>{formatNumber(row.price)}</span>
                      <span>{formatNumber(row.absoluteDifference)}</span>
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
                    title="Convergence direction"
                    body="For European contracts, the CRR estimate should generally tighten toward the analytical benchmark as depth increases."
                  />
                  <NoteCard
                    title="Numerical discipline"
                    body="Large residual gaps at high depth usually point back to assumptions, not presentation."
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
        >
          <ComingNextCard
            eyebrow="Volatility"
            title="Volatility workflows are planned next"
            description="This area is being reserved for implied-volatility and volatility-term-structure work once the core pricing workflow is fully settled."
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
                value: "Surface-ready layout",
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
            description="This area is being reserved for multi-leg structures, payoff aggregation, and scenario-aware derivatives workflows once the single-option surface is complete."
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
            <SectionSignal label="Volatility" value="Reserved" tone="pending" />
            <SectionSignal label="Strategies" value="Reserved" tone="pending" />
          </div>
        </div>

        <div
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          role="tablist"
          aria-label="Options analytics sections"
        >
          {optionSections.map((section) => {
            const isActive = activeSection === section.id;
            const reserved =
              section.id === "volatility" || section.id === "strategies";

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
                          !isActive && !reserved &&
                            "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200",
                          !isActive && reserved &&
                            "border-white/[0.08] bg-background-muted/80 text-foreground-subtle",
                        )}
                      >
                        {isActive ? "Current" : reserved ? "Reserved" : "Live"}
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
    <Card eyebrow={eyebrow} title={title} description={description} tone="elevated">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(19rem,0.92fr)]">
        <div className="rounded-[1.7rem] border border-dashed border-border/80 bg-[linear-gradient(180deg,rgba(10,17,26,0.8),rgba(8,13,20,0.56))] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-strong/85">
            Reserved product area
          </p>
          <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-foreground">
            Intentionally held for the next options workflow layer
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-soft">
            The pricing surface ships first. This section stays structured and
            intentional so the module can expand without feeling unfinished.
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
