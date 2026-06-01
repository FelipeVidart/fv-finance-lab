import { PageContainer } from "@/components/page-container";
import { SurfaceCard } from "@/components/ui/surface-card";

const featuredProjects = [
  {
    key: "risk",
    eyebrow: "Portfolio Risk",
    title: "portfolio-risk-pipeline",
    description:
      "Python pipeline for portfolio market risk analysis, including EWMA volatility, VaR/ETL, regime detection, Markov simulation, factor betas, and risk attribution.",
    tags: ["Python", "EWMA", "VaR / ETL", "Factor Betas"],
    moduleType: "Implementation",
    icon: "risk" as const,
    tone: "accent" as const,
    gridClassName: "xl:col-span-5",
  },
  {
    key: "derivatives",
    eyebrow: "Derivatives",
    title: "option-pricing-numerical-methods",
    description:
      "Python implementation of numerical methods for pricing European, American, and barrier options.",
    tags: ["Python", "Numerical Methods", "European / American", "Barrier Options"],
    moduleType: "Quant",
    icon: "derivatives" as const,
    tone: "elevated" as const,
    gridClassName: "xl:col-span-4",
  },
  {
    key: "credit",
    eyebrow: "Credit Research",
    title: "sp500-credit-spreads-thesis",
    description:
      "Undergraduate finance thesis on corporate bond credit spreads, aggregate shocks, and firm-level exposure using Python and Refinitiv data.",
    tags: ["Credit Spreads", "Refinitiv", "Python", "Empirical Research"],
    moduleType: "Research",
    icon: "research" as const,
    tone: "default" as const,
    gridClassName: "xl:col-span-3",
  },
] as const;

const projectStats = [
  { label: "Projects", value: "3" },
  { label: "Coverage", value: "Risk, derivatives, credit" },
  { label: "Format", value: "Code, modeling, research" },
] as const;

export default function ProjectsPage() {
  return (
    <PageContainer className="space-y-8 lg:space-y-10">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.56fr)] xl:items-end">
        <div className="space-y-5">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-accent-strong/90">
            Projects
          </p>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-balance font-display text-5xl leading-[1.01] tracking-[-0.045em] text-foreground sm:text-[4rem] lg:text-[5rem]">
              Applied finance work behind the tools.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-foreground-soft">
              A compact catalog of risk, derivatives, and credit work connected
              to the analytical modules in FV Finance Lab.
            </p>
          </div>
        </div>

        <SurfaceCard tone="elevated" padding="lg">
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {projectStats.map((stat) => (
              <ProjectStat key={stat.label} {...stat} />
            ))}
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        {featuredProjects.map(({ key, ...project }) => (
          <ProjectCard key={key} {...project} />
        ))}
      </section>
    </PageContainer>
  );
}

function ProjectCard({
  eyebrow,
  title,
  description,
  tags,
  moduleType,
  icon,
  tone,
  gridClassName,
}: Omit<(typeof featuredProjects)[number], "key">) {
  return (
    <SurfaceCard
      tone={tone}
      padding="lg"
      className={`flex h-full flex-col justify-between ${gridClassName}`}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-accent/20 bg-accent/10 text-accent-foreground">
              <ProjectIcon kind={icon} />
            </span>
            <span className="rounded-full border border-border/80 bg-background-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              {moduleType}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
              {eyebrow}
            </p>
            <h2 className="max-w-md text-2xl font-semibold tracking-[-0.035em] text-foreground">
              {title}
            </h2>
            <p className="text-sm leading-7 text-foreground-soft">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}

function ProjectStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-white/[0.08] pt-4 first:border-t-0 first:pt-0 xl:border-t xl:pt-4 xl:first:border-t-0 xl:first:pt-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
        {value}
      </p>
    </div>
  );
}

function ProjectIcon({ kind }: { kind: "risk" | "derivatives" | "research" }) {
  if (kind === "risk") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
        <path
          d="M4.25 14.75V10m3.75 4.75V6.75m3.75 8V9m3.75 5.75V4.75M3.5 15.25h13"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "derivatives") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
        <path
          d="M3.75 13.75c1.5-4.5 3.5-6.75 6-6.75 2.1 0 3.5 1.25 4.75 3.25.45.75.95 1.55 1.75 2.25M3.75 6.25h12.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
      <path
        d="M5.25 4.5h9.5v11h-9.5v-11Zm2 2.25h5.5M7.25 9.5h5.5M7.25 12.25h3.25"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
