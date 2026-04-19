import type { ReactNode } from "react";
import { PageContainer } from "@/components/page-container";
import { PageHero } from "@/components/page-hero";
import { ToolTabs } from "@/components/tool-tabs";

export default function ToolsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <PageContainer className="space-y-8">
      <PageHero
        eyebrow="Tools"
        title="The FV Finance Lab tools hub."
        description="This section gathers the first calculator categories under one shared structure. The pages are intentionally lightweight for now and ready for future implementation work."
      />
      <ToolTabs />
      {children}
    </PageContainer>
  );
}
