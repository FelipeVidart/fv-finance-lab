import { Card } from "@/components/card";

export default function RiskPage() {
  return (
    <section className="space-y-4">
      <Card
        eyebrow="Risk Placeholder"
        title="Risk tools will live here."
        description="This route is prepared for future portfolio risk and exposure tooling, while staying frontend-only for now."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          eyebrow="Planned Inputs"
          title="Positions, assumptions, and scenarios"
          description="Later iterations can collect portfolio composition, sensitivities, constraints, and scenario definitions in a structured panel."
        />
        <Card
          eyebrow="Planned Outputs"
          title="Exposure and summary dashboards"
          description="This page can eventually surface risk breakdowns, stress views, and summary metrics once the analytical layer is introduced."
        />
      </div>
    </section>
  );
}
