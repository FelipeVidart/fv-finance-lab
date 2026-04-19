import { Card } from "@/components/card";
import { PageContainer } from "@/components/page-container";
import { PageHero } from "@/components/page-hero";

const featuredProjects = [
  {
    eyebrow: "Portfolio Risk",
    title: "portfolio-risk-pipeline",
    description:
      "Python pipeline for portfolio market risk analysis, including EWMA volatility, VaR/ETL, regime detection, Markov simulation, factor betas, and risk attribution.",
  },
  {
    eyebrow: "Derivatives",
    title: "option-pricing-numerical-methods",
    description:
      "Python implementation of numerical methods for pricing European, American, and barrier options.",
  },
  {
    eyebrow: "Credit Research",
    title: "sp500-credit-spreads-thesis",
    description:
      "Undergraduate finance thesis on corporate bond credit spreads, aggregate shocks, and firm-level exposure using Python and Refinitiv data.",
  },
] as const;

export default function ProjectsPage() {
  return (
    <PageContainer className="space-y-10">
      <PageHero
        eyebrow="Projects"
        title="A selection of finance and analytics projects behind FV Finance Lab."
        description="These projects reflect the technical and analytical direction of the platform, spanning portfolio risk, numerical derivatives pricing, and credit spread research."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {featuredProjects.map((project) => (
          <Card
            key={project.title}
            eyebrow={project.eyebrow}
            title={project.title}
            description={project.description}
          />
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card
          eyebrow="Project Themes"
          title="Quantitative finance, risk analysis, and implementation depth"
          description="Taken together, the featured work shows a consistent focus on applied finance problems that combine modeling, data work, and interpretable outputs."
        >
          <ul className="space-y-3 text-sm text-slate-300">
            <li>Portfolio market risk measurement and attribution.</li>
            <li>Numerical methods for derivative pricing across product types.</li>
            <li>Empirical fixed-income research on credit spreads and macro shocks.</li>
          </ul>
        </Card>

        <Card
          eyebrow="Role In The Platform"
          title="Projects that support a more credible tools ecosystem"
          description="The projects section grounds FV Finance Lab in real technical work. It gives the tools side of the site context by showing the modeling and research foundation behind the broader platform."
        />
      </section>
    </PageContainer>
  );
}
