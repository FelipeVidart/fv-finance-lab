import { Card } from "@/components/card";
import { BondMetricCard } from "@/components/bonds/bond-shared";
import type { BondPricingSectionProps, TradingStateToneMap } from "@/components/bonds/types";
import type { BondTradingStatus } from "@/lib/finance/bonds";

const PAYMENT_OPTIONS = [
  { value: "1", label: "Annual" },
  { value: "2", label: "Semiannual" },
  { value: "4", label: "Quarterly" },
  { value: "12", label: "Monthly" },
] as const;

const numericFieldConfig: Array<{
  name: keyof Omit<BondPricingSectionProps["form"], "paymentsPerYear">;
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

const tradingToneMap: TradingStateToneMap = {
  premium: "positive",
  discount: "warning",
  par: "muted",
};

export function BondPricingSection({
  analytics,
  calculationError,
  errors,
  form,
  onReset,
  onSubmit,
  onUpdateField,
}: BondPricingSectionProps) {
  return (
    <div
      id="pricing-panel"
      role="tabpanel"
      aria-labelledby="pricing-tab"
      className="space-y-4"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.05fr)]">
        <Card
          eyebrow="Pricing"
          title="Fixed-rate bond inputs"
          description="Set the core bond terms for the manual valuation workflow."
          className="h-fit xl:sticky xl:top-24"
        >
          <form className="space-y-6" onSubmit={onSubmit}>
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
                      onUpdateField(field.name, event.target.value)
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
                  onUpdateField("paymentsPerYear", event.target.value)
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
                  Use a frequency that produces a whole number of coupon periods.
                </p>
                {errors.paymentsPerYear ? (
                  <p className="text-xs text-rose-300">
                    {errors.paymentsPerYear}
                  </p>
                ) : null}
              </div>
            </label>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs leading-6 text-slate-400">
              Coupon and yield are decimal inputs: `0.05` means 5%.
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
                onClick={onReset}
                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.04]"
              >
                Reset defaults
              </button>
            </div>
          </form>
        </Card>

        <Card
          eyebrow="Pricing"
          title="Headline pricing result"
          description="Primary manual valuation output from the current bond assumptions."
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
                {pricingInterpretation(analytics.tradingStatus, analytics.input.faceValue)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <BondMetricCard
                label="Trading state"
                value={formatTradingState(analytics.tradingStatus)}
                tone={tradingToneMap[analytics.tradingStatus]}
              />
              <BondMetricCard
                label="Annual coupon"
                value={formatCurrency(analytics.annualCoupon)}
              />
              <BondMetricCard
                label="Current yield"
                value={formatPercent(analytics.currentYield)}
              />
              <BondMetricCard
                label="Coupon frequency"
                value={describePaymentFrequency(analytics.input.paymentsPerYear)}
                tone="muted"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Interpretation
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {buildShortInterpretation(analytics)}
              </p>
            </div>

            {calculationError ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-200">
                {calculationError}
              </div>
            ) : null}
          </div>
        </Card>
      </div>
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

function pricingInterpretation(status: BondTradingStatus, faceValue: number) {
  if (status === "premium") {
    return `Price sits above par (${formatCurrency(faceValue)}), consistent with a coupon stream richer than the current yield requirement.`;
  }

  if (status === "discount") {
    return `Price sits below par (${formatCurrency(faceValue)}), consistent with a coupon stream lighter than the current yield requirement.`;
  }

  return `Price is trading near par (${formatCurrency(faceValue)}), which is what you expect when coupon and yield are closely aligned.`;
}

function buildShortInterpretation(analytics: BondPricingSectionProps["analytics"]) {
  return `The bond pays ${formatCurrency(analytics.periodicCoupon)} every ${describePaymentFrequency(
    analytics.input.paymentsPerYear,
  )}, returns ${formatCurrency(analytics.input.faceValue)} at maturity, and currently carries a ${formatPercent(
    analytics.currentYield,
  )} current yield.`;
}

function formatTradingState(status: BondTradingStatus) {
  if (status === "par") {
    return "At par";
  }

  return status === "premium" ? "Premium" : "Discount";
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
