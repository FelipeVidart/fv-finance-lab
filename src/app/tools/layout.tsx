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
        title="Finance tools organized around real analytical workflows."
        description="FV Finance Lab groups its tools by the kinds of tasks they support, from option pricing to risk review and fixed-income analysis."
      />
      <ToolTabs />
      {children}
    </PageContainer>
  );
}
