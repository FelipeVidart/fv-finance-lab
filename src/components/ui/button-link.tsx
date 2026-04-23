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
        "inline-flex items-center justify-center gap-2 rounded-full border text-sm font-semibold transition duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        size === "sm" ? "px-4 py-2.5" : "px-5 py-3",
        variant === "primary" &&
          "border-accent bg-accent text-slate-950 shadow-[0_14px_30px_rgba(196,154,74,0.24)] hover:border-accent-strong hover:bg-accent-strong",
        variant === "secondary" &&
          "border-border-strong bg-surface-elevated/80 text-foreground hover:border-accent/30 hover:bg-white/[0.04]",
        variant === "ghost" &&
          "border-transparent bg-transparent text-foreground-soft hover:border-border hover:bg-white/[0.04] hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
