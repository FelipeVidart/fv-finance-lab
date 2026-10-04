import type { Metadata } from "next";
import { cookies } from "next/headers";
import { WorkspaceLoader } from "@/components/workspace/workspace-loader";

export const metadata: Metadata = { title: "Espacio de trabajo", description: "Cargar carteras, analizar y preparar informes para clientes." };

export default async function WorkspacePage() {
  const theme = (await cookies()).get("fv-workspace-theme")?.value === "dark" ? "dark" : "light";
  return <WorkspaceLoader initialTheme={theme} />;
}
