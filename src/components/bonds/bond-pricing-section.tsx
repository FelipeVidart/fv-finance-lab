import type { ReactNode } from "react";
import { Card } from "@/components/card";
import { BondMetricCard } from "@/components/bonds/bond-shared";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
import type {
  BondPricingSectionProps,
  TradingStateToneMap,
} from "@/components/bonds/types";
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
      className="space-y-6"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(340px,0.95fr)_minmax(0,1.05fr)]">
        <Card
          eyebrow="Pricing"
          title="Fixed-rate bond control panel"
          description="Set the core bond terms, coupon structure, and yield assumptions for the manual valuation workflow."
          className="h-fit xl:sticky xl:top-24"
          tone="elevated"
          actions={<StepBadge label="Manual desk pricing" />}
        >
          <form className="space-y-6" onSubmit={onSubmit}>
            <InputGroup
              title="Core bond terms"
              description="Principal, coupon, yield, and maturity assumptions."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {numericFieldConfig.map((field) => (
                  <label key={field.name} className="space-y-2">
                    <span className="block text-sm font-semibold text-foreground">
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
                      className={cn(
                        "w-full rounded-[1.15rem] border bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition",
                        errors[field.name]
                          ? "border-rose-400/70 focus:border-rose-300"
                          : "border-white/10 focus:border-accent/60",
                      )}
                    />
                    <div className="min-h-10 space-y-1">
                      <p className="text-xs leading-5 text-foreground-muted">
                        {field.hint}
                      </p>
                      {errors[field.name] ? (
                        <p className="text-xs leading-5 text-rose-300">
                          {errors[field.name]}
                        </p>
                      ) : null}
                    </div>
                  </label>
                ))}
              </div>
            </InputGroup>

            <InputGroup
              title="Coupon schedule"
              description="Coupon frequency must produce a whole number of periods."
            >
              <label className="space-y-2">
                <span className="block text-sm font-semibold text-foreground">
                  Payments per year
                </span>
                <select
                  value={form.paymentsPerYear}
                  onChange={(event) =>
                    onUpdateField("paymentsPerYear", event.target.value)
                  }
                  className={cn(
                    "w-full rounded-[1.15rem] border bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition",
                    errors.paymentsPerYear
                      ? "border-rose-400/70 focus:border-rose-300"
                      : "border-white/10 focus:border-accent/60",
                  )}
                >
                  {PAYMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="min-h-10 space-y-1">
                  <p className="text-xs leading-5 text-foreground-muted">
                    Use a frequency that produces a whole number of coupon periods.
                  </p>
                  {errors.paymentsPerYear ? (
                    <p className="text-xs leading-5 text-rose-300">
                      {errors.paymentsPerYear}
                    </p>
                  ) : null}
                </div>
              </label>
            </InputGroup>

            <div className="rounded-[1.3rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.78),rgba(10,17,26,0.56))] px-4 py-3 text-xs leading-6 text-foreground-muted">
              Coupon and yield are decimal inputs. `0.05` means 5%. Keep maturity and payment frequency aligned so the schedule resolves cleanly.
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-[1.2rem] bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
              >
                Value bond
              </button>
              <button
                type="button"
                onClick={onReset}
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
            title="Headline pricing result"
            description="Primary fixed-income valuation output from the current bond assumptions."
            tone="elevated"
          >
            <div className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.04fr)_minmax(20rem,0.96fr)]">
                <SurfaceCard tone="accent" padding="md" className="border-accent/25">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-foreground/80">
                        Bond price
                      </p>
                      <p className="mt-5 text-[3rem] font-semibold tracking-[-0.05em] text-foreground">
                        {formatCurrency(analytics.price)}
                      </p>
                    </div>
                    <TradingStatusBadge status={analytics.tradingStatus} />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-foreground-soft">
                    {pricingInterpretation(
                      analytics.tradingStatus,
                      analytics.input.faceValue,
                    )}
                  </p>
                </SurfaceCard>

                <div className="grid gap-3">
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
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  label="Face value"
                  value={formatCurrency(analytics.input.faceValue)}
                />
                <SummaryCard
                  label="Coupon rate"
                  value={formatPercent(analytics.input.couponRate)}
                />
                <SummaryCard
                  label="Yield to maturity"
                  value={formatPercent(analytics.input.yieldToMaturity)}
                />
                <SummaryCard
                  label="Coupon frequency"
                  value={describePaymentFrequency(analytics.input.paymentsPerYear)}
                />
              </div>

              <SurfaceCard padding="sm" className="border-white/[0.08]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                  Interpretation
                </p>
                <p className="mt-3 text-sm leading-7 text-foreground-soft">
                  {buildShortInterpretation(analytics)}
                </p>
              </SurfaceCard>

              {calculationError ? (
                <div className="rounded-[1.3rem] border border-rose-400/30 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-200">
                  {calculationError}
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InputGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
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
        {children}
      </div>
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

function StepBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
      {label}
    </span>
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
