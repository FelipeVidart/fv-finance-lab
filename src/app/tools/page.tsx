import Link from "next/link";
import { Card } from "@/components/card";

const toolCards = [
  {
    href: "/tools/options",
    eyebrow: "Options",
    title: "Option pricing and scenario tooling",
    description:
      "Reserved for future interfaces covering pricing models, payoff views, and comparative option analysis.",
  },
  {
    href: "/tools/risk",
    eyebrow: "Risk",
    title: "Portfolio and position risk workflows",
    description:
      "Prepared for future utilities around exposures, stress testing, and risk summaries across strategies or positions.",
  },
  {
    href: "/tools/bonds",
    eyebrow: "Bonds",
    title: "Fixed-income calculators and reference tools",
    description:
      "Ready for later work on yield, duration, cash flow, and bond valuation experiences.",
  },
] as const;

export default function ToolsPage() {
  return (
    <section className="space-y-4">
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
        eyebrow="Foundation"
        title="A hub ready for real calculators later"
        description="The tools area currently acts as a structured landing page. Once logic is added, each route can grow into a dedicated working surface without changing the information architecture."
      />
    </section>
  );
}
