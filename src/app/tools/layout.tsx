import type { ReactNode } from "react";
import { PageContainer } from "@/components/page-container";
import { ToolTabs } from "@/components/tool-tabs";

export default function ToolsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <PageContainer className="space-y-8 lg:space-y-10">
      <ToolTabs />
      {children}
    </PageContainer>
  );
}
