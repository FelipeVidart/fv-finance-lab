import { PageContainer } from "@/components/page-container";
import { ButtonLink } from "@/components/ui/button-link";
import { SurfaceCard } from "@/components/ui/surface-card";

const workspaceLinks = [
  {
    label: "Options",
    href: "/tools/options",
    detail: "Price contracts, compare models, inspect Greeks and payoff.",
  },
  {
    label: "Risk",
    href: "/tools/risk",
    detail: "Load market data, set weights, review portfolio risk.",
  },
  {
    label: "Portfolio",
    href: "/tools/portfolio",
    detail: "Build ETF allocations and compare risk-return profiles.",
  },
  {
    label: "Bonds",
    href: "/tools/bonds",
    detail: "Value fixed-rate bonds and monitor fixed-income context.",
  },
] as const;

const focusCards = [
  {
    eyebrow: "Derivatives",
    title: "Options pricing desk",
    description:
      "Contract inputs, valuation methods, sensitivities, payoff views, and strategy analysis live in one module.",
  },
  {
    eyebrow: "Risk",
    title: "Portfolio review desk",
    description:
      "Market data setup, holdings, drawdowns, VaR, factor views, and allocation comparison stay close to the controls.",
  },
  {
    eyebrow: "Fixed income",
    title: "Bond analytics desk",
    description:
      "Manual pricing, duration, cash-flow inspection, and market monitoring support reference-style bond work.",
  },
] as const;

export default function HomePage() {
  return (
    <PageContainer className="space-y-10 lg:space-y-12">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
        <div className="space-y-7">
          <div className="space-y-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-accent-strong/90">
              FV Finance Lab
            </p>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-balance font-display text-5xl leading-[1.01] tracking-[-0.045em] text-foreground sm:text-[4rem] lg:text-[5rem]">
                Finance tools for pricing, risk, and fixed income.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-foreground-soft">
                Open a module, set assumptions, and read the output. The first
                release is focused on practical analytical work: options,
                portfolio risk, ETF allocation, and bonds.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/tools" variant="primary">
              Open tools
            </ButtonLink>
            <ButtonLink href="/projects" variant="secondary">
              View projects
            </ButtonLink>
          </div>
        </div>

        <SurfaceCard tone="elevated" padding="lg" className="h-fit xl:mt-4">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
                  Start work
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-foreground">
                  Choose a desk.
                </h2>
              </div>
              <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
                4 tools
              </span>
            </div>

            <div className="divide-y divide-white/[0.08]">
              {workspaceLinks.map((workspace) => (
                <WorkspaceRow key={workspace.label} {...workspace} />
              ))}
            </div>
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {focusCards.map((card) => (
          <SurfaceCard key={card.title} padding="lg" className="h-full">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
              {card.eyebrow}
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.035em] text-foreground">
              {card.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-foreground-soft">
              {card.description}
            </p>
          </SurfaceCard>
        ))}
      </section>

      <SurfaceCard tone="accent" padding="lg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-accent-foreground/80">
              Projects
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-foreground">
              Research and implementation work sits behind the tools.
            </h2>
          </div>
          <ButtonLink href="/projects" variant="ghost" size="sm">
            Open project catalog
          </ButtonLink>
        </div>
      </SurfaceCard>
    </PageContainer>
  );
}

function WorkspaceRow({
  label,
  href,
  detail,
}: {
  label: string;
  href: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-sm leading-6 text-foreground-soft">{detail}</p>
      </div>
      <ButtonLink href={href} variant="ghost" size="sm">
        Open
      </ButtonLink>
    </div>
  );
}
