import type { ReactNode } from "react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";

type CardProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
  actions?: ReactNode;
  tone?: "default" | "elevated" | "accent";
};

export function Card({
  eyebrow,
  title,
  description,
  children,
  className = "",
  actions,
  tone = "default",
}: CardProps) {
  return (
    <SurfaceCard tone={tone} className={cn("h-full", className)}>
      <div
        className={
          actions
            ? "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
            : undefined
        }
      >
        <div className="space-y-3">
          {eyebrow ? (
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-2.5">
            <h2 className="text-xl font-semibold tracking-[-0.032em] text-foreground sm:text-[1.38rem]">
              {title}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-foreground-soft">
              {description}
            </p>
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </SurfaceCard>
  );
}
