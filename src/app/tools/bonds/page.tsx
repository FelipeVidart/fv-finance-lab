import { Card } from "@/components/card";

export default function BondsPage() {
  return (
    <section className="space-y-4">
      <Card
        eyebrow="Bonds Placeholder"
        title="Bond tools will live here."
        description="This page is set up as a future home for fixed-income calculators and reference workflows."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          eyebrow="Planned Inputs"
          title="Instrument structure and market assumptions"
          description="Future versions can accept coupon, maturity, frequency, day-count, price, and yield assumptions without changing this shell."
        />
        <Card
          eyebrow="Planned Outputs"
          title="Yield, duration, and cash flow views"
          description="The layout is ready to host valuation summaries, sensitivity metrics, and bond schedule results once implementation begins."
        />
      </div>
    </section>
  );
}
