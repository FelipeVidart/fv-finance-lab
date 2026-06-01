import { NavLinks } from "@/components/nav-links";
import { SurfaceCard } from "@/components/ui/surface-card";
import { toolNavigation } from "@/lib/navigation";

export function ToolTabs() {
  return (
    <SurfaceCard tone="elevated" padding="sm" className="border-border-strong/80">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
            Tools
          </p>
          <p className="mt-1 text-sm leading-6 text-foreground-soft">
            Jump into the module you need.
          </p>
        </div>
        <NavLinks items={toolNavigation} variant="tabs" />
      </div>
    </SurfaceCard>
  );
}
