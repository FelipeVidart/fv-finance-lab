import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SurfaceCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: "default" | "elevated" | "accent";
  padding?: "sm" | "md" | "lg";
};

export function SurfaceCard({
  children,
  className,
  tone = "default",
  padding = "md",
  ...props
}: SurfaceCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-xl-value)] border border-border/80 backdrop-blur-xl",
        "bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_28%),linear-gradient(180deg,rgba(15,24,36,0.94),rgba(9,16,25,0.94))]",
        "shadow-[var(--shadow-card)]",
        tone === "elevated" &&
          "border-border-strong/90 bg-[radial-gradient(circle_at_top_right,rgba(226,184,107,0.05),transparent_24%),linear-gradient(180deg,rgba(18,29,43,0.96),rgba(10,18,28,0.96))] shadow-[var(--shadow-elevated)]",
        tone === "accent" &&
          "border-accent/20 bg-[radial-gradient(circle_at_top_right,rgba(226,184,107,0.12),transparent_24%),linear-gradient(180deg,rgba(31,25,16,0.95),rgba(13,19,28,0.95))]",
        padding === "sm" && "p-5",
        padding === "md" && "p-6",
        padding === "lg" && "p-7 sm:p-8",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)]",
          tone === "accent" &&
            "bg-[linear-gradient(90deg,transparent,rgba(226,184,107,0.68),transparent)]",
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.018),transparent_24%,transparent_72%,rgba(0,0,0,0.08))]"
      />
      {children}
    </div>
  );
}
