import { Card } from "@/components/card";

export default function OptionsPage() {
  return (
    <section className="space-y-4">
      <Card
        eyebrow="Options Placeholder"
        title="Options tools will live here."
        description="This page is the reserved frontend shell for future options calculators, model inputs, and result panels."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          eyebrow="Planned Inputs"
          title="Model parameters and trade assumptions"
          description="Future work can introduce spot price, strike, volatility, rates, tenor, and strategy-specific controls in this space."
        />
        <Card
          eyebrow="Planned Outputs"
          title="Valuation and scenario views"
          description="The layout is ready for calculated premiums, Greeks, payoff summaries, and scenario comparisons once calculator logic is added."
        />
      </div>
    </section>
  );
}
