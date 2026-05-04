import { PortfolioBuilder } from "@/components/portfolio/portfolio-builder";
import { SurfaceCard } from "@/components/ui/surface-card";

export const dynamic = "force-dynamic";

export default function PortfolioPage() {
  return (
    <section className="space-y-8">
      <SurfaceCard tone="elevated" padding="lg" className="border-border-strong/95">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(21rem,0.92fr)]">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-accent-foreground">
                Portfolio tool
              </span>
              <span className="rounded-full border border-white/[0.08] bg-background-muted/75 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-foreground-subtle">
                MVP
              </span>
            </div>
            <div className="space-y-4">
              <h2 className="max-w-4xl text-balance text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-[2.8rem]">
                Portfolio Management Lab
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-foreground-soft sm:text-[0.96rem]">
                A tool to build weighted ETF portfolios, backtest historical
                performance, and analyze risk/return metrics.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <HeroSignal label="Current scope" value="One weighted ETF portfolio" />
            <HeroSignal label="Data model" value="Existing aligned daily market data" />
            <HeroSignal label="Return model" value="Fixed target-weight returns" />
          </div>
        </div>
      </SurfaceCard>

      <PortfolioBuilder stooqConfigured={Boolean(process.env.STOOQ_API_KEY)} />
    </section>
  );
}

function HeroSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/[0.08] bg-background-muted/80 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
        {value}
      </p>
    </div>
  );
}
