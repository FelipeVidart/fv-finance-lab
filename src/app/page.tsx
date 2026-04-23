import { PageContainer } from "@/components/page-container";
import { ButtonLink } from "@/components/ui/button-link";
import { SurfaceCard } from "@/components/ui/surface-card";

const heroSignals = [
  {
    label: "Core toolset",
    value: "Options, risk, and bond workflows",
  },
  {
    label: "Product approach",
    value: "Clean analytical surfaces over generic content pages",
  },
  {
    label: "Project backbone",
    value: "Applied finance work informs the platform direction",
  },
] as const;

const featureCards = [
  {
    key: "tools",
    eyebrow: "Tools",
    title: "Practical utilities for everyday analytical finance work",
    description:
      "The platform is organized around usable product surfaces for option pricing, portfolio risk review, and fixed-income analysis.",
    bullets: [
      "Structured around real workflow categories instead of generic navigation.",
      "Built to support clearer pricing, exposure, and reference tasks.",
      "Designed so deeper calculators can evolve without breaking the shell.",
    ],
    cta: {
      href: "/tools",
      label: "Explore tools",
    },
    tone: "accent" as const,
    gridClassName: "lg:col-span-5",
    icon: "grid" as const,
  },
  {
    key: "workflows",
    eyebrow: "Workflows",
    title: "A cleaner bridge between finance models and usable interfaces",
    description:
      "FV Finance Lab is meant to make technical finance work easier to navigate, review, and extend through coherent interaction patterns.",
    bullets: [
      "Reusable shell, tabs, forms, and metrics for analytical sessions.",
      "Separation between finance logic and UI presentation.",
      "A foundation that can scale into more complete tool experiences.",
    ],
    cta: {
      href: "/tools",
      label: "Open workflows",
    },
    tone: "elevated" as const,
    gridClassName: "lg:col-span-4",
    icon: "workflow" as const,
  },
  {
    key: "projects",
    eyebrow: "Projects",
    title: "Research and implementation work that keeps the platform credible",
    description:
      "The projects side gives the tools context by showing the Python, modeling, and research direction behind the product.",
    bullets: [
      "Portfolio risk pipeline work.",
      "Numerical option pricing implementation.",
      "Credit-spread and fixed-income research context.",
    ],
    cta: {
      href: "/projects",
      label: "View projects",
    },
    tone: "default" as const,
    gridClassName: "lg:col-span-3",
    icon: "document" as const,
  },
] as const;

const capabilityPillars = [
  {
    title: "Pricing and valuation",
    description:
      "Option and bond surfaces focused on inputs, results, comparison, and interpretable outputs.",
  },
  {
    title: "Risk review",
    description:
      "Portfolio and asset-level diagnostics organized around setup, inspection, and portfolio analytics.",
  },
  {
    title: "Applied implementation",
    description:
      "Projects provide the modeling depth and technical seriousness behind the product direction.",
  },
  {
    title: "Reusable product system",
    description:
      "Shared shell, surfaces, navigation, and UI primitives make later analytical modules easier to build cleanly.",
  },
] as const;

const platformNotes = [
  "Frontend-first finance platform foundation",
  "Shared premium shell and reusable UI primitives",
  "Current scope centered on tools, workflows, and projects",
] as const;

const platformMap = [
  {
    label: "Options",
    detail: "Pricing, model comparison, payoff inspection, and future strategy work.",
  },
  {
    label: "Risk",
    detail: "Market data setup, asset analytics, and portfolio-level diagnostics.",
  },
  {
    label: "Bonds",
    detail: "Fixed-rate valuation, analytics, and market-monitoring workflows.",
  },
] as const;

export default function HomePage() {
  return (
    <PageContainer className="space-y-12 lg:space-y-16">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
        <div className="space-y-7">
          <div className="space-y-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-accent-strong/90">
              Finance Analytics Platform
            </p>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-balance font-display text-5xl leading-[1.01] tracking-[-0.045em] text-foreground sm:text-[4rem] lg:text-[5rem]">
                Practical tools for options, risk, and fixed-income work.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-foreground-soft">
                FV Finance Lab is the front door to a focused finance product:
                a place for analytical tools, structured workflows, and
                project-backed implementation with a clear professional tone.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/tools" variant="primary">
              Explore tools
            </ButtonLink>
            <ButtonLink href="/projects" variant="secondary">
              View projects
            </ButtonLink>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {heroSignals.map((signal) => (
              <SurfaceCard key={signal.label} padding="sm" className="min-h-[8.75rem]">
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
                Platform focus
              </p>
              <h2 className="max-w-md text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-[1.9rem]">
                Built as a working analytics environment, not a generic portfolio site.
              </h2>
              <p className="text-sm leading-7 text-foreground-soft">
                The home experience should immediately communicate practical
                finance tooling, clean workflow structure, and enough technical
                depth to support future product expansion.
              </p>
            </div>

            <div className="space-y-3">
              {platformMap.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.45rem] border border-border/80 bg-background-muted/80 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-foreground-soft">
                        {item.detail}
                      </p>
                    </div>
                    <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-foreground">
                      Active area
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {platformNotes.map((note) => (
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
              Product roles
            </p>
            <h2 className="max-w-3xl text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-[2.35rem]">
              Three connected layers shape the platform experience.
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-foreground-soft">
            The home page should explain how the product is organized before a
            user ever opens a calculator: tools for execution, workflows for
            navigation, and projects for technical credibility.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {featureCards.map(({ key, ...card }) => (
            <FeatureCard key={key} {...card} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <SurfaceCard tone="accent" padding="lg">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-accent-foreground/80">
                Positioning
              </p>
              <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-[2.45rem]">
                A focused platform for applied finance work with a product mindset.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-foreground-soft">
                FV Finance Lab is intentionally narrow: it brings together
                practical finance tooling, clean interface thinking, and real
                project context so the site feels like a working analytical
                platform rather than a static showcase.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <PositioningStat
                label="Practical scope"
                value="Options, risk, bonds"
              />
              <PositioningStat
                label="Design stance"
                value="Premium, restrained, analytical"
              />
              <PositioningStat
                label="Build posture"
                value="Reusable shell, logic kept separate"
              />
            </div>
          </div>
        </SurfaceCard>

        <div className="grid gap-4 sm:grid-cols-2">
          {capabilityPillars.map((pillar, index) => (
            <SurfaceCard
              key={pillar.title}
              padding="md"
              className="flex h-full flex-col justify-between"
            >
              <div className="space-y-4">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-xs font-semibold tracking-[0.12em] text-accent-foreground">
                  0{index + 1}
                </span>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="text-sm leading-7 text-foreground-soft">
                    {pillar.description}
                  </p>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <SurfaceCard padding="sm" className="overflow-hidden">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,0.85fr))]">
          <div className="rounded-[1.45rem] border border-border/80 bg-background-muted/80 px-4 py-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-accent-strong/85">
              Current platform status
            </p>
            <p className="mt-2 text-sm leading-7 text-foreground-soft">
              The first release focuses on establishing the shell, route
              structure, and reusable surfaces for future analytical depth.
            </p>
          </div>
          <StatusCell
            label="Interface"
            value="Premium shell and dark analytical system"
          />
          <StatusCell
            label="Product structure"
            value="Home, Projects, and Tools routes in place"
          />
          <StatusCell
            label="Next layers"
            value="Deeper page-specific refinement and richer tool internals"
          />
        </div>
      </SurfaceCard>
    </PageContainer>
  );
}

function FeatureCard({
  eyebrow,
  title,
  description,
  bullets,
  cta,
  tone,
  gridClassName,
  icon,
}: Omit<(typeof featureCards)[number], "key">) {
  return (
    <SurfaceCard
      tone={tone}
      padding="lg"
      className={`flex h-full flex-col justify-between ${gridClassName}`}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-accent/20 bg-accent/10 text-accent-foreground">
            <FeatureIcon kind={icon} />
          </span>
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
              {eyebrow}
            </p>
            <h3 className="max-w-md text-2xl font-semibold tracking-[-0.035em] text-foreground">
              {title}
            </h3>
            <p className="max-w-2xl text-sm leading-7 text-foreground-soft">
              {description}
            </p>
          </div>
        </div>

        <ul className="space-y-3">
          {bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-start gap-3 text-sm leading-7 text-foreground-soft"
            >
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <ButtonLink href={cta.href} variant="ghost" size="sm">
          {cta.label}
        </ButtonLink>
      </div>
    </SurfaceCard>
  );
}

function PositioningStat({
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

function StatusCell({
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

function FeatureIcon({ kind }: { kind: "grid" | "workflow" | "document" }) {
  if (kind === "grid") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
        <path
          d="M4 4.75h4.75V9.5H4V4.75Zm7.25 0H16V9.5h-4.75V4.75ZM4 11h4.75v4.25H4V11Zm7.25 0H16v4.25h-4.75V11Z"
          stroke="currentColor"
          strokeWidth="1.3"
        />
      </svg>
    );
  }

  if (kind === "workflow") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
        <path
          d="M3.75 5.25h6.5m-6.5 4.75h12.5m-12.5 4.75h8.5M13.25 3.5l2.75 1.75-2.75 1.75M10.5 12.25l2.75 1.75-2.75 1.75"
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
        d="M6 3.75h5.25L15 7.5v8.75H6V3.75Zm5 0v4h4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
