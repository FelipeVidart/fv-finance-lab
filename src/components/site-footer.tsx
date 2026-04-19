import { PageContainer } from "@/components/page-container";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/10">
      <PageContainer className="flex flex-col gap-3 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium text-slate-200">FV Finance Lab</p>
        <p>Frontend foundation for future finance tools and projects.</p>
      </PageContainer>
    </footer>
  );
}
