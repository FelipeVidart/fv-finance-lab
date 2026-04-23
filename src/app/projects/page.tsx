import { PageContainer } from "@/components/page-container";
import { SurfaceCard } from "@/components/ui/surface-card";

const featuredProjects = [
  {
    key: "risk",
    eyebrow: "Portfolio Risk",
    title: "portfolio-risk-pipeline",
    description:
      "Python pipeline for portfolio market risk analysis, including EWMA volatility, VaR/ETL, regime detection, Markov simulation, factor betas, and risk attribution.",
    summary:
      "A portfolio analytics implementation focused on measurement, regime context, and interpretable decomposition.",
    tags: ["Python", "EWMA", "VaR / ETL", "Factor Betas"],
    moduleType: "Implementation module",
    role: "Supports the risk side of FV Finance Lab with credible analytical depth and workflow direction.",
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
    summary:
      "A numerical derivatives project centered on valuation techniques, model comparison, and practical implementation.",
    tags: ["Python", "Numerical Methods", "European / American", "Barrier Options"],
    moduleType: "Quant module",
    role: "Gives the options tooling side a real implementation backbone instead of purely conceptual framing.",
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
    summary:
      "An applied fixed-income research project linking empirical credit spread behavior to broader macro and firm-level drivers.",
    tags: ["Credit Spreads", "Refinitiv", "Python", "Empirical Research"],
    moduleType: "Research module",
    role: "Anchors the broader platform in real fixed-income research and data-backed finance work.",
    icon: "research" as const,
    tone: "default" as const,
    gridClassName: "xl:col-span-3",
  },
] as const;

const projectSignals = [
  {
    label: "Coverage",
    value: "Risk, derivatives, and credit research",
  },
  {
    label: "Working style",
    value: "Implementation-led, model-aware, research-backed",
  },
  {
    label: "Platform role",
    value: "Projects inform product credibility and analytical direction",
  },
] as const;

const researchThemes = [
  {
    title: "Quantitative finance",
    description:
      "Modeling and valuation work around derivatives pricing, numerical methods, and analytical comparison.",
  },
  {
    title: "Portfolio risk systems",
    description:
      "Risk measurement, attribution, volatility estimation, scenario framing, and portfolio interpretation.",
  },
  {
    title: "Fixed-income research",
    description:
      "Credit spread behavior, macro shock transmission, and firm-level exposure in bond markets.",
  },
  {
    title: "Implementation discipline",
    description:
      "Projects are framed around code, analysis, and outputs that can feed a cleaner product layer.",
  },
] as const;

const catalogNotes = [
  "Project set grounded in real Python implementation",
  "Research and product direction stay intentionally connected",
  "Catalog supports the credibility of future analytical tools",
] as const;

const bottomStrip = [
  {
    label: "Project modules",
    value: "3 current featured cases",
  },
  {
    label: "Research areas",
    value: "Portfolio risk, derivatives, credit spreads",
  },
  {
    label: "Implementation depth",
    value: "Modeling, pipelines, and empirical finance work",
  },
  {
    label: "Catalog role",
    value: "Technical backbone for the broader platform",
  },
] as const;

export default function ProjectsPage() {
  return (
    <PageContainer className="space-y-12 lg:space-y-16">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.06fr)_minmax(20rem,0.94fr)]">
        <div className="space-y-7">
          <div className="space-y-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-accent-strong/90">
              Research And Implementation Catalog
            </p>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-balance font-display text-5xl leading-[1.01] tracking-[-0.045em] text-foreground sm:text-[4rem] lg:text-[5rem]">
                Projects that give FV Finance Lab real analytical weight.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-foreground-soft">
                This page collects the technical and research work behind the
                platform: portfolio risk implementation, numerical derivatives
                pricing, and credit-spread research that make the broader
                product direction more credible.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {projectSignals.map((signal) => (
              <SurfaceCard
                key={signal.label}
                padding="sm"
                className="min-h-[8.5rem]"
              >
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-accent-strong/85">
                  {signal.label}
                </p>
                <p className="mt-4 text-sm leading-7 text-foreground-soft">
                  {signal.value}
                </p>
              </SurfaceCard>
            ))}
          </div>
        </div>

        <SurfaceCard tone="elevated" padding="lg" className="h-fit xl:mt-4">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-foreground-subtle">
                Catalog framing
              </p>
              <h2 className="max-w-md text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-[1.9rem]">
                More than a list of past work, this is the technical backbone of the platform.
              </h2>
              <p className="text-sm leading-7 text-foreground-soft">
                The projects side shows how finance concepts are implemented,
                researched, and structured before they become cleaner product
                surfaces inside FV Finance Lab.
              </p>
            </div>

            <div className="space-y-3">
              {featuredProjects.map((project) => (
                <div
                  key={project.key}
                  className="rounded-[1.45rem] border border-border/80 bg-background-muted/80 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">
                        {project.eyebrow}
                      </p>
                      <p className="text-sm leading-6 text-foreground-soft">
                        {project.summary}
                      </p>
                    </div>
                    <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-foreground">
                      {project.moduleType}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {catalogNotes.map((note) => (
                <span
                  key={note}
                  className="rounded-full border border-border/80 bg-background-muted/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        </SurfaceCard>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-accent-strong/90">
              Featured cases
            </p>
            <h2 className="max-w-3xl text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-[2.35rem]">
              Each project acts like a module inside a broader analytical catalog.
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-foreground-soft">
            The goal is not to present isolated resume entries. These cases show
            the kinds of implementation depth, research discipline, and finance
            context that support the broader platform.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          {featuredProjects.map(({ key, ...project }) => (
            <ProjectModuleCard key={key} {...project} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <SurfaceCard tone="accent" padding="lg">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-accent-foreground/80">
                Why these projects matter
              </p>
              <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-[2.45rem]">
                The catalog gives the platform a research-backed product spine.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-foreground-soft">
                Projects ground the product in real work. They show how pricing,
                risk interpretation, and fixed-income research are actually
                implemented, which makes the tools side of FV Finance Lab feel
                like an extension of real analysis rather than presentation-only
                design.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <ProjectStat
                label="Domain coverage"
                value="Derivatives, market risk, credit"
              />
              <ProjectStat
                label="Output style"
                value="Code, analysis, and interpretable results"
              />
              <ProjectStat
                label="Platform effect"
                value="Makes future tools more credible"
              />
            </div>
          </div>
        </SurfaceCard>

        <div className="grid gap-4 sm:grid-cols-2">
          {researchThemes.map((theme, index) => (
            <SurfaceCard
              key={theme.title}
              padding="md"
              className="flex h-full flex-col justify-between"
            >
              <div className="space-y-4">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-xs font-semibold tracking-[0.12em] text-accent-foreground">
                  0{index + 1}
                </span>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
                    {theme.title}
                  </h3>
                  <p className="text-sm leading-7 text-foreground-soft">
                    {theme.description}
                  </p>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <SurfaceCard padding="sm" className="overflow-hidden">
        <div className="grid gap-3 lg:grid-cols-4">
          {bottomStrip.map((item) => (
            <BottomStripCell
              key={item.label}
              label={item.label}
              value={item.value}
            />
          ))}
        </div>
      </SurfaceCard>
    </PageContainer>
  );
}

function ProjectModuleCard({
  eyebrow,
  title,
  description,
  summary,
  tags,
  moduleType,
  role,
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
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-accent/20 bg-accent/10 text-accent-foreground">
            <ProjectIcon kind={icon} />
          </span>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
                {eyebrow}
              </p>
              <span className="rounded-full border border-border/80 bg-background-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                {moduleType}
              </span>
            </div>
            <h3 className="max-w-md text-2xl font-semibold tracking-[-0.035em] text-foreground">
              {title}
            </h3>
            <p className="text-sm leading-7 text-foreground-soft">{description}</p>
          </div>
        </div>

        <div className="rounded-[1.45rem] border border-border/80 bg-background-muted/80 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
            Case framing
          </p>
          <p className="mt-3 text-sm leading-7 text-foreground-soft">
            {summary}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
            Themes and methods
          </p>
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
      </div>

      <div className="mt-8 rounded-[1.45rem] border border-border/80 bg-background-muted/80 px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
          Role inside FV Finance Lab
        </p>
        <p className="mt-3 text-sm leading-7 text-foreground-soft">{role}</p>
      </div>
    </SurfaceCard>
  );
}

function ProjectStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-border/80 bg-background-muted/80 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-3 text-sm font-semibold leading-6 text-foreground">
        {value}
      </p>
    </div>
  );
}

function BottomStripCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-border/80 bg-background-muted/80 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-3 text-sm leading-7 text-foreground-soft">{value}</p>
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
