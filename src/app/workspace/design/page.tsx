import { cookies } from "next/headers";
import { WorkspacePreview } from "@/components/workspace/workspace-preview";
export default async function WorkspaceDesignPage() {
  const theme = (await cookies()).get("fv-workspace-theme")?.value === "dark" ? "dark" : "light";
  return <WorkspacePreview initialTheme={theme} />;
}
