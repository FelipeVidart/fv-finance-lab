import type { ReactNode } from "react";
import { SurfaceCard } from "@/components/ui/surface-card";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
}: PageHeroProps) {
  return (
    <section className="space-y-7">
      <div className="grid gap-7 xl:grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)] xl:items-end">
        <div className="space-y-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-accent-strong/90">
            {eyebrow}
          </p>
          <div className="space-y-4">
            <h1 className="text-balance max-w-4xl font-display text-4xl leading-[1.02] tracking-[-0.04em] text-foreground sm:text-[3.65rem] lg:text-[4.55rem]">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-foreground-soft sm:text-lg">
              {description}
            </p>
          </div>
        </div>
        {actions ? (
          <SurfaceCard
            tone="elevated"
            padding="sm"
            className="xl:justify-self-end"
          >
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-foreground-subtle">
              Quick paths
            </p>
            <div className="mt-4 flex flex-wrap gap-3">{actions}</div>
          </SurfaceCard>
        ) : null}
      </div>
      <div className="h-px bg-[linear-gradient(90deg,rgba(103,114,134,0),rgba(103,114,134,0.26),rgba(196,154,74,0.42),rgba(103,114,134,0.22),rgba(103,114,134,0))]" />
    </section>
  );
}
