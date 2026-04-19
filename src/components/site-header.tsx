import Link from "next/link";
import { NavLinks } from "@/components/nav-links";
import { PageContainer } from "@/components/page-container";
import { primaryNavigation } from "@/lib/navigation";

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <PageContainer className="flex min-h-16 flex-col gap-4 py-4 sm:min-h-20 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="group inline-flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-sky-200 transition group-hover:border-white/20 group-hover:bg-white/[0.07]">
            FV
          </span>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
              Finance Lab
            </p>
            <p className="text-sm text-slate-500">
              Finance tools platform
            </p>
          </div>
        </Link>
        <NavLinks items={primaryNavigation} />
      </PageContainer>
    </header>
  );
}
