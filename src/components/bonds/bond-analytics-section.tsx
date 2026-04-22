import { Card } from "@/components/card";
import { BondMetricCard } from "@/components/bonds/bond-shared";
import type { BondAnalyticsSectionProps } from "@/components/bonds/types";

export function BondAnalyticsSection({
  analytics,
  cashFlowRows,
}: BondAnalyticsSectionProps) {
  return (
    <div
      id="analytics-panel"
      role="tabpanel"
      aria-labelledby="analytics-tab"
      className="space-y-4"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
        <Card
          eyebrow="Analytics"
          title="Duration and present value measures"
          description="Fixed-income analytics derived directly from the current manual bond calculation."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <BondMetricCard
              label="Macaulay duration"
              value={formatYears(analytics.macaulayDuration)}
            />
            <BondMetricCard
              label="Modified duration"
              value={formatYears(analytics.modifiedDuration)}
            />
            <BondMetricCard
              label="Cash flow periods"
              value={analytics.totalPeriods.toString()}
              tone="muted"
            />
            <BondMetricCard
              label="PV of coupons"
              value={formatCurrency(analytics.pvCoupons)}
            />
            <BondMetricCard
              label="PV of face value"
              value={formatCurrency(analytics.pvFaceValue)}
            />
            <BondMetricCard
              label="Final cash flow"
              value={formatCurrency(analytics.finalCashFlow)}
            />
          </div>
        </Card>

        <Card
          eyebrow="Analytics"
          title="Cash flow summary"
          description="Compact summary of the coupon stream and redemption profile."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <BondMetricCard
              label="Periodic coupon"
              value={formatCurrency(analytics.periodicCoupon)}
            />
            <BondMetricCard
              label="Annual coupon"
              value={formatCurrency(analytics.annualCoupon)}
            />
            <BondMetricCard
              label="First coupon bucket"
              value={formatYears(1 / analytics.input.paymentsPerYear)}
              tone="muted"
            />
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Interpretation
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Macaulay duration measures the present-value weighted timing of the
                cash flows, while modified duration turns that timing into an
                approximate price sensitivity to small yield moves.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card
        eyebrow="Analytics"
        title="Cash flow table"
        description="Preview of the opening and closing cash flow buckets from the current bond schedule."
      >
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
          <div className="min-w-[520px]">
            <div className="grid grid-cols-[0.7fr_0.9fr_1fr_1fr] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>Period</span>
              <span>Time</span>
              <span>Cash flow</span>
              <span>PV</span>
            </div>
            {cashFlowRows.map((cashFlow) => (
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
      </Card>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatYears(value: number): string {
  return `${value.toFixed(2)} yrs`;
}
