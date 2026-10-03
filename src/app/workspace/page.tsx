import type { Metadata } from "next";
import { WorkspacePreview } from "@/components/workspace/workspace-preview";

export const metadata: Metadata = { title: "Espacio de trabajo", description: "Cargar carteras, analizar y preparar informes para clientes." };

export default function WorkspacePage() {
  return <WorkspacePreview />;
}
