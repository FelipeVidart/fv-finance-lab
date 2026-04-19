import Link from "next/link";
import { Card } from "@/components/card";
import { PageContainer } from "@/components/page-container";
import { PageHero } from "@/components/page-hero";

export default function HomePage() {
  return (
    <PageContainer className="space-y-10">
      <PageHero
        eyebrow="Finance Tools Platform"
        title="FV Finance Lab is a focused workspace for practical finance tools."
        description="The site is being shaped as a clean, professional home for calculator interfaces, analytical workflows, and future finance-focused product experiments."
        actions={
          <>
            <Link
              href="/tools"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Explore tools
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/24 hover:bg-white/5"
            >
              View projects
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card
          eyebrow="Platform"
          title="A single home for finance workflows"
          description="FV Finance Lab is structured to bring together calculators, research utilities, and product ideas under one consistent interface."
        />
        <Card
          eyebrow="Design"
          title="Dark, minimal, and decision-oriented"
          description="The first pass favors clarity, restrained styling, and reusable building blocks that can support more advanced tools later."
        />
        <Card
          eyebrow="Scope"
          title="Frontend foundation first"
          description="This stage focuses on information architecture and reusable UI, without backend services, live data, or calculator logic yet."
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr,0.95fr]">
        <Card
          eyebrow="Current Focus"
          title="Building the base layer for future calculators"
          description="The initial structure is centered on three tool tracks: options, risk, and bonds. Each area gets its own route and ready-to-grow interface shell."
        >
          <ul className="space-y-3 text-sm text-slate-300">
            <li>Dedicated routes for each major tool category.</li>
            <li>Reusable layout pieces that keep navigation and page structure consistent.</li>
            <li>Placeholder sections prepared for future inputs, outputs, and workflow controls.</li>
          </ul>
        </Card>

        <Card
          eyebrow="Next Up"
          title="A platform that can expand without redesigning the shell"
          description="As calculators and datasets arrive later, the current foundation is designed to support deeper tool pages, richer project documentation, and a broader finance product library."
        />
      </section>
    </PageContainer>
  );
}
