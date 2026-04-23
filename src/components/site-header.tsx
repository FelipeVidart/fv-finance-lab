import Link from "next/link";
import { NavLinks } from "@/components/nav-links";
import { PageContainer } from "@/components/page-container";
import { SearchShell } from "@/components/ui/search-shell";
import { primaryNavigation } from "@/lib/navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30">
      <div className="border-b border-border/80 bg-background/78 backdrop-blur-2xl">
        <PageContainer className="py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <Link href="/" className="group inline-flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1.05rem] border border-accent/25 bg-[linear-gradient(180deg,rgba(196,154,74,0.18),rgba(196,154,74,0.06))] text-sm font-semibold tracking-[0.14em] text-accent-foreground shadow-[0_16px_36px_rgba(0,0,0,0.24)] transition group-hover:border-accent/40 group-hover:bg-[linear-gradient(180deg,rgba(196,154,74,0.24),rgba(196,154,74,0.09))]">
                FV
              </span>
              <div className="space-y-0.5">
                <p className="text-[0.96rem] font-semibold tracking-[-0.02em] text-foreground">
                  FV Finance Lab
                </p>
                <p className="text-sm text-foreground-muted">
                  Options, risk, and fixed-income workflows
                </p>
              </div>
            </Link>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
              <NavLinks items={primaryNavigation} />
              <SearchShell />
            </div>
          </div>
        </PageContainer>
      </div>
    </header>
  );
}
