import { Card } from "@/components/card";
import { PageContainer } from "@/components/page-container";
import { PageHero } from "@/components/page-hero";

export default function ProjectsPage() {
  return (
    <PageContainer className="space-y-10">
      <PageHero
        eyebrow="Projects"
        title="Current build work and the direction of the FV Finance Lab ecosystem."
        description="This section highlights what exists now, what the website is setting up, and the types of finance-focused projects that can grow out of this foundation."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card
          eyebrow="Current Repository"
          title="fv-finance-lab"
          description="The active repository is the frontend shell for the platform itself, built in Next.js with a reusable layout, route structure, and clean starting point for future calculators."
        />
        <Card
          eyebrow="Near-Term Direction"
          title="Tool-first product surfaces"
          description="The next layer can turn the placeholder routes into working interfaces for pricing, scenario analysis, and fixed-income workflows without changing the overall shell."
        />
        <Card
          eyebrow="Future Direction"
          title="A broader finance lab"
          description="Beyond calculators, the platform can expand into project notes, reusable research views, and supporting repositories that make the lab feel like a coherent toolkit."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card
          eyebrow="What This Website Enables"
          title="A consistent frontend standard"
          description="By establishing shared layout primitives now, each new tool or project page can ship faster and still feel part of the same product."
        >
          <ul className="space-y-3 text-sm text-slate-300">
            <li>Shared navigation, spacing, and card patterns.</li>
            <li>Route-level organization for each finance domain.</li>
            <li>A visual system that can hold more complex interfaces later.</li>
          </ul>
        </Card>

        <Card
          eyebrow="Planned Expansion"
          title="From repository showcase to working lab"
          description="As the platform matures, this area can evolve into a live project index covering tool releases, supporting libraries, experiments, and implementation notes."
        />
      </section>
    </PageContainer>
  );
}
