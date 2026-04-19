import Link from "next/link";
import { Card } from "@/components/card";

const toolCards = [
  {
    href: "/tools/options",
    eyebrow: "Options",
    title: "Option pricing and derivatives utilities",
    description:
      "A dedicated area for practical options workflows, including pricing-oriented interfaces, scenario comparison, and model-driven analysis.",
  },
  {
    href: "/tools/risk",
    eyebrow: "Risk",
    title: "Portfolio and market risk workflows",
    description:
      "Focused on useful utilities for exposures, stress views, and portfolio-level risk interpretation across positions and strategies.",
  },
  {
    href: "/tools/bonds",
    eyebrow: "Bonds",
    title: "Fixed-income calculators and bond reference tools",
    description:
      "Structured for bond pricing, yield analysis, duration-oriented workflows, and other fixed-income reference tasks.",
  },
] as const;

export default function ToolsPage() {
  return (
    <section className="space-y-4">
      <Card
        eyebrow="Tools Hub"
        title="Practical finance utilities organized by workflow"
        description="The tools section is the product-facing side of FV Finance Lab. It groups the main areas of work into clear categories so each one can grow into a focused analytical surface."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {toolCards.map((tool) => (
          <Link key={tool.href} href={tool.href} className="block h-full">
            <Card
              eyebrow={tool.eyebrow}
              title={tool.title}
              description={tool.description}
              className="h-full transition hover:border-white/20 hover:bg-white/[0.06]"
            />
          </Link>
        ))}
      </div>

      <Card
        eyebrow="Current Scope"
        title="Clear categories now, implementation depth later"
        description="The calculators are not implemented yet, but the structure is already organized around practical use cases: derivatives, portfolio risk, and fixed-income analysis."
      />
    </section>
  );
}
