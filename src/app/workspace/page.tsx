import type { Metadata } from "next";
import { cookies } from "next/headers";
import { WorkspacePreview } from "@/components/workspace/workspace-preview";

export const metadata: Metadata = { title: "Espacio de trabajo", description: "Cargar carteras, analizar y preparar informes para clientes." };

export default async function WorkspacePage() {
  const theme = (await cookies()).get("fv-workspace-theme")?.value === "dark" ? "dark" : "light";
  return <WorkspacePreview initialTheme={theme} />;
}
