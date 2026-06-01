import { ButtonLink } from "@/components/ui/button-link";
import { SurfaceCard } from "@/components/ui/surface-card";

const toolCards = [
  {
    key: "options",
    href: "/tools/options",
    eyebrow: "Options",
    title: "Price and compare option contracts",
    description:
      "Run Black-Scholes, binomial, finite-difference, Monte Carlo, Greeks, payoff, implied-volatility, and strategy views from one desk.",
    tags: ["Pricing", "Greeks", "Payoff", "Strategies"],
    action: "Open options",
    icon: "options" as const,
    tone: "accent" as const,
    gridClassName: "xl:col-span-5",
  },
  {
    key: "risk",
    href: "/tools/risk",
    eyebrow: "Risk",
    title: "Review market and portfolio risk",
    description:
      "Load aligned market data, set weights, inspect assets, and move into portfolio-level risk diagnostics.",
    tags: ["Market Data", "Weights", "VaR", "Drawdown"],
    action: "Open risk",
    icon: "risk" as const,
    tone: "elevated" as const,
    gridClassName: "xl:col-span-4",
  },
  {
    key: "market-regime",
    href: "/tools/market-regime",
    eyebrow: "Regime",
    title: "Classify the current market regime",
    description:
      "Combine trend, momentum, volatility, credit, and rates inputs into an explainable risk-on/risk-off dashboard.",
    tags: ["Regime", "Volatility", "Credit", "Rates"],
    action: "Open regime",
    icon: "regime" as const,
    tone: "default" as const,
    gridClassName: "xl:col-span-3",
  },
  {
    key: "portfolio",
    href: "/tools/portfolio",
    eyebrow: "Portfolio",
    title: "Build and compare ETF allocations",
    description:
      "Compare predefined and custom portfolios against shared historical data, then review performance, risk, and stress outputs.",
    tags: ["ETF Allocation", "Backtest", "Stress", "Comparison"],
    action: "Open portfolio",
    icon: "portfolio" as const,
    tone: "default" as const,
    gridClassName: "xl:col-span-5",
  },
  {
    key: "data-providers",
    href: "/tools/data-providers",
    eyebrow: "Data",
    title: "Check provider configuration",
    description:
      "Review provider availability, API-key requirements, fallback priority, and diagnostics outside the analysis modules.",
    tags: ["Providers", "API Keys", "Fallback", "Status"],
    action: "Open providers",
    icon: "data" as const,
    tone: "elevated" as const,
    gridClassName: "xl:col-span-4",
  },
  {
    key: "bonds",
    href: "/tools/bonds",
    eyebrow: "Bonds",
    title: "Value bonds and monitor fixed income",
    description:
      "Price fixed-rate bonds, read duration and cash-flow analytics, and check market history with spread context.",
    tags: ["Pricing", "Duration", "Cash Flows", "Monitor"],
    action: "Open bonds",
    icon: "bonds" as const,
    tone: "default" as const,
    gridClassName: "xl:col-span-3",
  },
] as const;

const hubStats = [
  { label: "Active modules", value: "6" },
  { label: "Primary desks", value: "Options, risk, regime, portfolio, bonds" },
  { label: "Utility", value: "Provider settings" },
] as const;

export default function ToolsPage() {
  return (
    <section className="space-y-6 lg:space-y-8">
      <SurfaceCard tone="accent" padding="lg">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.55fr)] xl:items-end">
          <div className="space-y-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-accent-foreground/80">
              Tool hub
            </p>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.045em] text-foreground sm:text-5xl">
                Open the finance workspace you need.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-foreground-soft sm:text-[0.96rem]">
                Start with the task: price a derivative, review risk, compare
                allocations, value a bond, or check the data provider layer.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {hubStats.map((stat) => (
              <HubStat key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-12">
        {toolCards.map(({ key, ...tool }) => (
          <ToolModuleCard key={key} {...tool} />
        ))}
      </div>
    </section>
  );
}

function ToolModuleCard({
  href,
  eyebrow,
  title,
  description,
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
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-accent/20 bg-accent/10 text-accent-foreground">
              <ToolIcon kind={icon} />
            </span>
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

      <div className="mt-8">
        <ButtonLink href={href} variant="ghost" size="sm">
          {action}
        </ButtonLink>
      </div>
    </SurfaceCard>
  );
}

function HubStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-white/[0.1] pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground/70">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
        {value}
      </p>
    </div>
  );
}

function ToolIcon({
  kind,
}: {
  kind: "options" | "risk" | "regime" | "portfolio" | "bonds" | "data";
}) {
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

  if (kind === "regime") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
        <path
          d="M4 13.75h12M5.5 13.75l2.75-5 3 3.5 3.25-6M4.25 5.25h3.25m-3.25 3h2"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "portfolio") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
        <path
          d="M4.25 14.75 8 11l2.75 2.75 5-6M4.25 5.5h11.5M4.25 9.25h3.25"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "data") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-4.5 w-4.5">
        <path
          d="M4.25 6.25c0-1.1 2.58-2 5.75-2s5.75.9 5.75 2-2.58 2-5.75 2-5.75-.9-5.75-2Zm0 0v7.5c0 1.1 2.58 2 5.75 2s5.75-.9 5.75-2v-7.5M4.25 10c0 1.1 2.58 2 5.75 2s5.75-.9 5.75-2"
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
