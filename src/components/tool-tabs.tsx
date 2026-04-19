import { NavLinks } from "@/components/nav-links";
import { toolNavigation } from "@/lib/navigation";

export function ToolTabs() {
  return <NavLinks items={toolNavigation} variant="tabs" />;
}
