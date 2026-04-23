import { PageContainer } from "@/components/page-container";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border/80 bg-[linear-gradient(180deg,rgba(7,16,25,0),rgba(7,16,25,0.6))]">
      <PageContainer className="flex flex-col gap-6 py-8 text-sm text-foreground-muted lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-foreground">
            FV Finance Lab
          </p>
          <p className="max-w-2xl leading-6">
            Frontend foundation for options, portfolio risk, and fixed-income
            analysis.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
          <span className="rounded-full border border-border/80 bg-surface/75 px-3 py-1.5">
            Options
          </span>
          <span className="rounded-full border border-border/80 bg-surface/75 px-3 py-1.5">
            Risk
          </span>
          <span className="rounded-full border border-border/80 bg-surface/75 px-3 py-1.5">
            Bonds
          </span>
        </div>
      </PageContainer>
    </footer>
  );
}
