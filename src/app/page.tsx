import { Card } from "@/components/card";
import { PageContainer } from "@/components/page-container";
import { PageHero } from "@/components/page-hero";
import { ButtonLink } from "@/components/ui/button-link";

export default function HomePage() {
  return (
    <PageContainer className="space-y-12">
      <PageHero
        eyebrow="Personal Finance And Analytics Platform"
        title="FV Finance Lab brings together practical finance tools, analytical workflows, and applied research projects."
        description="The platform is designed as a focused environment for exploring pricing, risk, and fixed-income workflows through clean interfaces, technical projects, and finance-oriented utilities."
        actions={
          <>
            <ButtonLink href="/tools" variant="primary">
              Explore tools
            </ButtonLink>
            <ButtonLink href="/projects" variant="secondary">
              View projects
            </ButtonLink>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card
          eyebrow="Tools"
          title="Practical utilities for core finance workflows"
          description="FV Finance Lab is organized around tools for options, risk, and bonds, with product surfaces designed for analytical work rather than generic content pages."
        />
        <Card
          eyebrow="Workflows"
          title="A bridge between models and usable interfaces"
          description="The site is meant to connect quantitative ideas with lightweight, usable pages that support pricing, exposure analysis, and fixed-income review."
        />
        <Card
          eyebrow="Projects"
          title="Built alongside real finance projects"
          description="The project library complements the tools side of the platform with implementation work in portfolio risk, numerical option pricing, and credit spreads research."
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr,0.95fr]">
        <Card
          eyebrow="What You Will Find Here"
          title="A focused environment for finance and analytics work"
          description="FV Finance Lab combines three complementary parts of applied finance work: usable tools, structured analytical workflows, and technical projects that reflect how those ideas are implemented."
        >
          <ul className="space-y-3 text-sm text-foreground-soft">
            <li>Tool hubs for options, risk, and bonds.</li>
            <li>Project pages grounded in real Python and finance research work.</li>
            <li>A consistent interface for expanding into deeper analytical utilities.</li>
          </ul>
        </Card>

        <Card
          eyebrow="Positioning"
          title="A personal platform with a clear analytical focus"
          description="Rather than functioning as a generic portfolio site, FV Finance Lab is framed as a working finance platform centered on tools, models, and project-based analysis."
        />
      </section>
    </PageContainer>
  );
}
