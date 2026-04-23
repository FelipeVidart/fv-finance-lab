import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

export function ButtonLink({
  children,
  className,
  size = "md",
  variant = "secondary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[1.2rem] border text-sm font-semibold transition duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        size === "sm" ? "px-4 py-2.5" : "px-5 py-3",
        variant === "primary" &&
          "border-accent/35 bg-[linear-gradient(180deg,rgba(226,184,107,0.98),rgba(196,154,74,0.96))] text-slate-950 shadow-[0_14px_30px_rgba(196,154,74,0.24)] hover:border-accent-strong hover:bg-[linear-gradient(180deg,rgba(239,198,122,0.98),rgba(209,166,83,0.96))]",
        variant === "secondary" &&
          "border-border/80 bg-[linear-gradient(180deg,rgba(19,30,43,0.88),rgba(11,19,29,0.78))] text-foreground shadow-[var(--shadow-soft)] hover:border-accent/25 hover:bg-white/[0.04]",
        variant === "ghost" &&
          "border-border/65 bg-background-muted/55 text-foreground-soft hover:border-accent/20 hover:bg-white/[0.04] hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
