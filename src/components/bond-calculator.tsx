"use client";

import { useState } from "react";
import { Card } from "@/components/card";
import {
  calculateFixedRateBondAnalytics,
  type BondTradingStatus,
  type FixedRateBondAnalytics,
  type FixedRateBondInput,
} from "@/lib/finance/bonds";

type FormState = {
  faceValue: string;
  couponRate: string;
  yieldToMaturity: string;
  yearsToMaturity: string;
  paymentsPerYear: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const DEFAULT_FORM: FormState = {
  faceValue: "1000",
  couponRate: "0.05",
  yieldToMaturity: "0.045",
  yearsToMaturity: "5",
  paymentsPerYear: "2",
};

const PAYMENT_OPTIONS = [
  { value: "1", label: "Annual" },
  { value: "2", label: "Semiannual" },
  { value: "4", label: "Quarterly" },
  { value: "12", label: "Monthly" },
] as const;

const numericFieldConfig: Array<{
  name: keyof Omit<FormState, "paymentsPerYear">;
  label: string;
  step: string;
  hint: string;
}> = [
  {
    name: "faceValue",
    label: "Face value",
    step: "0.01",
    hint: "Principal repaid at maturity",
  },
  {
    name: "couponRate",
    label: "Coupon rate",
    step: "0.0001",
    hint: "Annual coupon rate in decimal form",
  },
  {
    name: "yieldToMaturity",
    label: "Yield to maturity",
    step: "0.0001",
    hint: "Annual yield in decimal form",
  },
  {
    name: "yearsToMaturity",
    label: "Years to maturity",
    step: "0.5",
    hint: "Must align with the chosen payment frequency",
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

function parseNonNegativeNumber(
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

  if (parsed < 0) {
    return { error: `${label} cannot be negative` };
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
  values?: FixedRateBondInput;
} {
  const errors: FormErrors = {};

  const faceValue = parsePositiveNumber(form.faceValue, "Face value");
  const couponRate = parseNonNegativeNumber(form.couponRate, "Coupon rate");
  const yieldToMaturity = parseNonNegativeNumber(
    form.yieldToMaturity,
    "Yield to maturity",
  );
  const yearsToMaturity = parsePositiveNumber(
    form.yearsToMaturity,
    "Years to maturity",
  );
  const paymentsPerYear = parsePositiveInteger(
    form.paymentsPerYear,
    "Payments per year",
  );

  if (faceValue.error) errors.faceValue = faceValue.error;
  if (couponRate.error) errors.couponRate = couponRate.error;
  if (yieldToMaturity.error) errors.yieldToMaturity = yieldToMaturity.error;
  if (yearsToMaturity.error) errors.yearsToMaturity = yearsToMaturity.error;
  if (paymentsPerYear.error) errors.paymentsPerYear = paymentsPerYear.error;

  if (
    yearsToMaturity.value !== undefined &&
    paymentsPerYear.value !== undefined &&
    !Number.isInteger(yearsToMaturity.value * paymentsPerYear.value)
  ) {
    errors.yearsToMaturity =
      "Years to maturity must produce a whole number of coupon periods.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors,
    values: {
      faceValue: faceValue.value as number,
      couponRate: couponRate.value as number,
      yieldToMaturity: yieldToMaturity.value as number,
      yearsToMaturity: yearsToMaturity.value as number,
      paymentsPerYear: paymentsPerYear.value as number,
    },
  };
}

function createInitialAnalytics(): FixedRateBondAnalytics {
  const parsed = parseForm(DEFAULT_FORM);

  if (!parsed.values) {
    throw new Error("Default bond values must be valid.");
  }

  return calculateFixedRateBondAnalytics(parsed.values);
}

export function BondCalculator() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [analytics, setAnalytics] =
    useState<FixedRateBondAnalytics>(createInitialAnalytics);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  function updateField(name: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      return { ...current, [name]: undefined };
    });
    setCalculationError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = parseForm(form);

    if (!parsed.values) {
      setErrors(parsed.errors);
      setCalculationError("Please correct the highlighted bond inputs.");
      return;
    }

    try {
      setErrors({});
      setAnalytics(calculateFixedRateBondAnalytics(parsed.values));
      setCalculationError(null);
    } catch (error) {
      setCalculationError(
        error instanceof Error ? error.message : "Unable to value bond.",
      );
    }
  }

  function handleReset() {
    setForm(DEFAULT_FORM);
    setErrors({});
    setAnalytics(createInitialAnalytics());
    setCalculationError(null);
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)]">
        <Card
          eyebrow="Fixed-Rate Bond"
          title="Bond input panel"
          description="Enter the core terms for a plain vanilla fixed-rate bond. Coupon rate and yield to maturity should be entered in decimal form."
          className="h-full"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                      <p className="text-xs text-rose-300">{errors[field.name]}</p>
                    ) : null}
                  </div>
                </label>
              ))}
            </div>

            <label className="space-y-2">
              <span className="block text-sm font-medium text-slate-100">
                Payments per year
              </span>
              <select
                value={form.paymentsPerYear}
                onChange={(event) =>
                  updateField("paymentsPerYear", event.target.value)
                }
                className={`w-full rounded-2xl border bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition ${
                  errors.paymentsPerYear
                    ? "border-rose-400/70 focus:border-rose-300"
                    : "border-white/10 focus:border-sky-400/60"
                }`}
              >
                {PAYMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="min-h-10 space-y-1">
                <p className="text-xs text-slate-400">
                  Common coupon frequencies for standard fixed-income instruments.
                </p>
                {errors.paymentsPerYear ? (
                  <p className="text-xs text-rose-300">
                    {errors.paymentsPerYear}
                  </p>
                ) : null}
              </div>
            </label>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs leading-6 text-slate-400">
              Use decimals for coupon and yield: 0.05 means 5%. Years to
              maturity should line up with the payment frequency so the bond has a
              whole number of coupon periods.
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
              >
                Value bond
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
          title="Bond price and duration summary"
          description="The calculator discounts each coupon and the redemption payment using the selected payment frequency, then derives standard duration measures from the present-value weighted cash flows."
          className="h-full"
        >
          <div className="space-y-6">
            <div className="rounded-3xl border border-sky-400/20 bg-sky-400/[0.08] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200/80">
                    Bond price
                  </p>
                  <p className="mt-4 text-4xl font-semibold tracking-tight text-white">
                    {formatCurrency(analytics.price)}
                  </p>
                </div>
                <TradingStatusBadge status={analytics.tradingStatus} />
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                This bond pays {formatCurrency(analytics.periodicCoupon)} every{" "}
                {describePaymentFrequency(analytics.input.paymentsPerYear)} and
                returns {formatCurrency(analytics.input.faceValue)} at maturity.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Annual coupon"
                value={formatCurrency(analytics.annualCoupon)}
              />
              <MetricCard
                label="Current yield"
                value={formatPercent(analytics.currentYield)}
              />
              <MetricCard
                label="Macaulay duration"
                value={formatYears(analytics.macaulayDuration)}
              />
              <MetricCard
                label="Modified duration"
                value={formatYears(analytics.modifiedDuration)}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                Cash flow summary
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label="Periodic coupon"
                  value={formatCurrency(analytics.periodicCoupon)}
                />
                <MetricCard
                  label="Total coupon periods"
                  value={analytics.totalPeriods.toString()}
                />
                <MetricCard
                  label="PV of coupons"
                  value={formatCurrency(analytics.pvCoupons)}
                />
                <MetricCard
                  label="PV of face value"
                  value={formatCurrency(analytics.pvFaceValue)}
                />
                <MetricCard
                  label="Final cash flow"
                  value={formatCurrency(analytics.finalCashFlow)}
                />
                <MetricCard
                  label="First coupon date bucket"
                  value={formatYears(1 / analytics.input.paymentsPerYear)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                Interpretation
              </h3>
              <p className="text-sm leading-7 text-slate-300">
                When the coupon rate is above yield, the bond trades at a premium;
                when the coupon rate is below yield, it trades at a discount. At
                equal coupon and yield, price should sit near par.
              </p>
              <p className="text-sm leading-7 text-slate-300">
                Macaulay duration is the present-value weighted average time of the
                cash flows. Modified duration translates that timing measure into an
                approximate price sensitivity to a small parallel move in yield.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                First and final cash flows
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
                <div className="min-w-[520px]">
                  <div className="grid grid-cols-[0.7fr_0.9fr_1fr_1fr] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <span>Period</span>
                    <span>Time</span>
                    <span>Cash flow</span>
                    <span>PV</span>
                  </div>
                  {buildDisplayCashFlows(analytics).map((cashFlow) => (
                    <div
                      key={cashFlow.period}
                      className="grid grid-cols-[0.7fr_0.9fr_1fr_1fr] gap-3 px-4 py-3 text-sm text-slate-200 not-last:border-b not-last:border-white/10"
                    >
                      <span>{cashFlow.period}</span>
                      <span>{formatYears(cashFlow.timeInYears)}</span>
                      <span>{formatCurrency(cashFlow.cashFlow)}</span>
                      <span>{formatCurrency(cashFlow.presentValue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {calculationError ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-200">
                {calculationError}
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function TradingStatusBadge({ status }: { status: BondTradingStatus }) {
  const styleMap: Record<BondTradingStatus, string> = {
    premium: "border-emerald-400/30 bg-emerald-400/[0.10] text-emerald-200",
    discount: "border-amber-400/30 bg-amber-400/[0.10] text-amber-200",
    par: "border-slate-400/30 bg-slate-400/[0.10] text-slate-200",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${styleMap[status]}`}
    >
      {status}
    </span>
  );
}

function buildDisplayCashFlows(analytics: FixedRateBondAnalytics) {
  if (analytics.cashFlows.length <= 4) {
    return analytics.cashFlows;
  }

  return [
    analytics.cashFlows[0],
    analytics.cashFlows[1],
    analytics.cashFlows[analytics.cashFlows.length - 2],
    analytics.cashFlows[analytics.cashFlows.length - 1],
  ];
}

function describePaymentFrequency(paymentsPerYear: number): string {
  if (paymentsPerYear === 1) return "year";
  if (paymentsPerYear === 2) return "half-year";
  if (paymentsPerYear === 4) return "quarter";
  if (paymentsPerYear === 12) return "month";

  return `${(12 / paymentsPerYear).toFixed(2)} month periods`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatYears(value: number): string {
  return `${value.toFixed(2)} yrs`;
}
