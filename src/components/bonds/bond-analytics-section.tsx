import { Card } from "@/components/card";
import { BondMetricCard } from "@/components/bonds/bond-shared";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
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
      className="space-y-6"
    >
      <SurfaceCard tone="elevated" padding="md" className="border-white/[0.08]">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(23rem,0.84fr)]">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
              Bond analytics
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
              Read the bond through timing, present-value composition, and rate sensitivity.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-soft">
              This section stays tightly connected to the manual pricing setup so
              duration, coupon timing, and present-value breakdown all trace back
              to the same fixed-income assumptions.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat
              label="Total periods"
              value={analytics.totalPeriods.toString()}
              detail="Coupon schedule length"
            />
            <MiniStat
              label="Periodic coupon"
              value={formatCurrency(analytics.periodicCoupon)}
              detail="Cash flow per period"
            />
            <MiniStat
              label="Macaulay duration"
              value={formatYears(analytics.macaulayDuration)}
              detail="Weighted timing measure"
            />
            <MiniStat
              label="Modified duration"
              value={formatYears(analytics.modifiedDuration)}
              detail="Approximate price sensitivity"
            />
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
        <Card
          eyebrow="Analytics"
          title="Duration and present-value measures"
          description="Core analytical outputs derived directly from the current bond calculation."
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
          title="Reading frame"
          description="Use these notes to connect the bond outputs back to desk interpretation."
        >
          <div className="space-y-3">
            <InsightCard
              title="Duration posture"
              body="Macaulay duration measures the present-value weighted timing of the cash flows, while modified duration converts that timing into an approximate price response to small yield moves."
            />
            <InsightCard
              title="Present-value split"
              body="Separating coupons from principal helps explain whether value is concentrated in the income stream or the terminal redemption."
            />
            <InsightCard
              title="Cash-flow discipline"
              body="Coupon frequency and maturity alignment matter because the schedule defines both timing risk and the valuation path."
            />
          </div>
        </Card>
      </div>

      <Card
        eyebrow="Analytics"
        title="Cash-flow schedule snapshot"
        description="Opening and closing buckets from the current bond schedule, shown as a compact reference table."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.14fr)_minmax(18rem,0.86fr)]">
          <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[0.7fr_0.9fr_1fr_1fr] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                <span>Period</span>
                <span>Time</span>
                <span>Cash flow</span>
                <span>PV</span>
              </div>
              {cashFlowRows.map((cashFlow, index) => (
                <div
                  key={cashFlow.period}
                  className={cn(
                    "grid grid-cols-[0.7fr_0.9fr_1fr_1fr] gap-3 px-5 py-4 text-sm text-foreground-soft not-last:border-b not-last:border-white/[0.08]",
                    index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                  )}
                >
                  <span className="font-semibold text-foreground">{cashFlow.period}</span>
                  <span>{formatYears(cashFlow.timeInYears)}</span>
                  <span>{formatCurrency(cashFlow.cashFlow)}</span>
                  <span>{formatCurrency(cashFlow.presentValue)}</span>
                </div>
              ))}
            </div>
          </div>

          <SurfaceCard padding="sm" className="border-white/[0.08]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
              Schedule note
            </p>
            <p className="mt-3 text-sm leading-7 text-foreground-soft">
              The table intentionally shows the opening and closing buckets so
              the user can verify both the early coupon cadence and the maturity
              redemption structure without scanning the full schedule.
            </p>
          </SurfaceCard>
        </div>
      </Card>
    </div>
  );
}

function MiniStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.76),rgba(10,17,26,0.54))] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-3 text-base font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-xs leading-6 text-foreground-muted">{detail}</p>
    </div>
  );
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.76),rgba(10,17,26,0.54))] px-4 py-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-foreground-soft">{body}</p>
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
