import { NavLinks } from "@/components/nav-links";
import { SurfaceCard } from "@/components/ui/surface-card";
import { toolNavigation } from "@/lib/navigation";

export function ToolTabs() {
  return (
    <SurfaceCard tone="elevated" padding="sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
            Workspace map
          </p>
          <p className="max-w-2xl text-sm leading-7 text-foreground-soft">
            Open the overview or jump directly into the tool area built for the
            task at hand.
          </p>
        </div>
        <NavLinks items={toolNavigation} variant="tabs" />
      </div>
    </SurfaceCard>
  );
}
