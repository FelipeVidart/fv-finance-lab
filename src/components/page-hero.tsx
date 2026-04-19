import type { ReactNode } from "react";

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
    <section className="space-y-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
        {eyebrow}
      </p>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
        <div className="space-y-4">
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            {description}
          </p>
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}
