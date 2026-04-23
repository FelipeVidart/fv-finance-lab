import { ButtonLink } from "@/components/ui/button-link";
import { SurfaceCard } from "@/components/ui/surface-card";

const toolCards = [
  {
    key: "options",
    href: "/tools/options",
    eyebrow: "Options",
    title: "Pricing and derivatives workflows",
    description:
      "A dedicated area for practical options workflows, including pricing-oriented interfaces, scenario comparison, and model-driven analysis.",
    summary:
      "Built for valuation, model comparison, payoff inspection, and future strategy-oriented tooling.",
    tags: ["Pricing", "Black-Scholes", "Binomial", "Payoff"],
    action: "Open options workspace",
    icon: "options" as const,
    tone: "accent" as const,
    gridClassName: "xl:col-span-5",
  },
  {
    key: "risk",
    href: "/tools/risk",
    eyebrow: "Risk",
    title: "Portfolio and market risk workflows",
    description:
      "Focused on useful utilities for exposures, stress views, and portfolio-level risk interpretation across positions and strategies.",
    summary:
      "Structured around setup, asset review, portfolio analytics, and interpretable diagnostics.",
    tags: ["Market Data", "Portfolio Review", "Drawdown", "Holdings"],
    action: "Open risk workspace",
    icon: "risk" as const,
    tone: "elevated" as const,
    gridClassName: "xl:col-span-4",
  },
  {
    key: "bonds",
    href: "/tools/bonds",
    eyebrow: "Bonds",
    title: "Fixed-income calculators and reference workflows",
    description:
      "Structured for bond pricing, yield analysis, duration-oriented workflows, and other fixed-income reference tasks.",
    summary:
      "Combines manual valuation, analytics, and market-monitoring tasks within a cleaner fixed-income module.",
    tags: ["Bond Pricing", "Duration", "Market Monitor", "Reference"],
    action: "Open bonds workspace",
    icon: "bonds" as const,
    tone: "default" as const,
    gridClassName: "xl:col-span-3",
  },
] as const;

const workspacePrinciples = [
  {
    title: "Task-first organization",
    description:
      "Tools are grouped by what the user is trying to analyze, price, or review.",
  },
  {
    title: "Shared interaction system",
    description:
      "Module shells, tabs, forms, and result surfaces stay consistent across the workspace.",
  },
  {
    title: "Room for deeper modules",
    description:
      "Each category is designed to expand into a more complete analytical surface over time.",
  },
  {
    title: "Credible finance focus",
    description:
      "The page stays grounded in practical finance tooling rather than generic feature marketing.",
  },
] as const;

const bottomStrip = [
  {
    label: "Workspace modules",
    value: "Options, Risk, Bonds",
  },
  {
    label: "Navigation model",
    value: "Overview first, then direct module entry",
  },
  {
    label: "Current layer",
    value: "Shared shell plus module-level workflow surfaces",
  },
  {
    label: "Next depth",
    value: "Richer internal module refinement",
  },
] as const;

export default function ToolsPage() {
  return (
    <section className="space-y-10">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <SurfaceCard tone="accent" padding="lg">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-accent-foreground/80">
                Workspace overview
              </p>
              <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-[2.45rem]">
                The tool layer is where the product starts to feel operational.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-foreground-soft">
                This overview is not just a category page. It frames how the
                platform is organized, clarifies where each workflow lives, and
                gives users a clean path into the module that matches the task
                they need to work on.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <WorkspaceStat
                label="Entry model"
                value="Workflow-led module access"
              />
              <WorkspaceStat
                label="Current scope"
                value="Derivatives, risk, and fixed income"
              />
              <WorkspaceStat
                label="Product direction"
                value="Shared system now, deeper module internals next"
              />
            </div>
          </div>
        </SurfaceCard>

        <div className="grid gap-4 sm:grid-cols-2">
          {workspacePrinciples.map((principle, index) => (
            <SurfaceCard
              key={principle.title}
              padding="md"
              className="flex h-full flex-col justify-between"
            >
              <div className="space-y-4">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-xs font-semibold tracking-[0.12em] text-accent-foreground">
                  0{index + 1}
                </span>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
                    {principle.title}
                  </h3>
                  <p className="text-sm leading-7 text-foreground-soft">
                    {principle.description}
                  </p>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-accent-strong/90">
              Module entry points
            </p>
            <h2 className="max-w-3xl text-balance text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-[2.35rem]">
              Open the workspace that matches the financial problem you are solving.
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-foreground-soft">
            Each card acts as an entry surface into a dedicated module, with a
            clearer sense of purpose than a generic category list.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          {toolCards.map(({ key, ...tool }) => (
            <ToolModuleCard key={key} {...tool} />
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
    </section>
  );
}

function ToolModuleCard({
  href,
  eyebrow,
  title,
  description,
  summary,
  tags,
  action,
  icon,
  tone,
  gridClassName,
}: Omit<(typeof toolCards)[number], "key">) {
  return (
    <SurfaceCard
      tone={tone}
      padding="lg"
      className={`flex h-full flex-col justify-between ${gridClassName}`}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-accent/20 bg-accent/10 text-accent-foreground">
            <ToolIcon kind={icon} />
          </span>

          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
              {eyebrow}
            </p>
            <h3 className="max-w-md text-2xl font-semibold tracking-[-0.035em] text-foreground">
              {title}
            </h3>
            <p className="text-sm leading-7 text-foreground-soft">{description}</p>
          </div>
        </div>

        <div className="rounded-[1.45rem] border border-white/10 bg-slate-950/45 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
            Module framing
          </p>
          <p className="mt-3 text-sm leading-7 text-foreground-soft">
            {summary}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
            Workflow focus
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

      <div className="mt-8">
        <ButtonLink href={href} variant="ghost" size="sm">
          {action}
        </ButtonLink>
      </div>
    </SurfaceCard>
  );
}

function WorkspaceStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/40 px-4 py-4">
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
    <div className="rounded-[1.4rem] border border-white/10 bg-slate-950/40 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-3 text-sm leading-7 text-foreground-soft">{value}</p>
    </div>
  );
}

function ToolIcon({ kind }: { kind: "options" | "risk" | "bonds" }) {
  if (kind === "options") {
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

  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
      <path
        d="M5 6.25h10M5 10h10M5 13.75h10M6.25 4.5v11M13.75 4.5v11"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
