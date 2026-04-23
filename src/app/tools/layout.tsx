import type { ReactNode } from "react";
import { PageContainer } from "@/components/page-container";
import { ToolTabs } from "@/components/tool-tabs";
import { SurfaceCard } from "@/components/ui/surface-card";

export default function ToolsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <PageContainer className="space-y-12 lg:space-y-16">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.06fr)_minmax(20rem,0.94fr)]">
        <div className="space-y-7">
          <div className="space-y-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-accent-strong/90">
              Product Workspace
            </p>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-balance font-display text-5xl leading-[1.01] tracking-[-0.045em] text-foreground sm:text-[4rem] lg:text-[5rem]">
                Finance tools organized around real analytical tasks.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-foreground-soft">
                The tools layer is the operational side of FV Finance Lab. It
                groups workflows by what a user is actually trying to do, from
                derivatives pricing to portfolio risk review and fixed-income
                analysis.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <SurfaceCard padding="sm" className="min-h-[8.25rem]">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-accent-strong/85">
                Workflow model
              </p>
              <p className="mt-4 text-sm leading-7 text-foreground-soft">
                Modules are organized by analytical task rather than generic
                content buckets.
              </p>
            </SurfaceCard>
            <SurfaceCard padding="sm" className="min-h-[8.25rem]">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-accent-strong/85">
                Product direction
              </p>
              <p className="mt-4 text-sm leading-7 text-foreground-soft">
                Each category can grow into a deeper product surface without
                breaking the shared shell.
              </p>
            </SurfaceCard>
            <SurfaceCard padding="sm" className="min-h-[8.25rem]">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-accent-strong/85">
                Current scope
              </p>
              <p className="mt-4 text-sm leading-7 text-foreground-soft">
                Options, risk, and bonds define the first layer of the working
                platform.
              </p>
            </SurfaceCard>
          </div>
        </div>

        <SurfaceCard tone="elevated" padding="lg" className="h-fit xl:mt-4">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-foreground-subtle">
                Workspace framing
              </p>
              <h2 className="max-w-md text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-[1.9rem]">
                Start from the workflow you need, then move into the module built for it.
              </h2>
              <p className="text-sm leading-7 text-foreground-soft">
                The overview is meant to orient the user before entering a more
                focused tool area. It acts as the front door to the product
                workspace, not just an intermediate category page.
              </p>
            </div>

            <div className="space-y-3">
              <WorkspaceNote
                title="Options"
                body="Pricing workflows, model comparison, payoff inspection, and future strategy layers."
              />
              <WorkspaceNote
                title="Risk"
                body="Market data setup, asset analytics, portfolio construction, and portfolio review."
              />
              <WorkspaceNote
                title="Bonds"
                body="Fixed-rate valuation, analytics, market monitoring, and reference-style fixed-income tasks."
              />
            </div>
          </div>
        </SurfaceCard>
      </section>
      <ToolTabs />
      {children}
    </PageContainer>
  );
}

function WorkspaceNote({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.45rem] border border-border/80 bg-background-muted/80 px-4 py-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-foreground-soft">{body}</p>
    </div>
  );
}
