"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type NavLinksProps = {
  items: readonly NavItem[];
  variant?: "header" | "tabs";
};

function isItemActive(pathname: string, item: NavItem) {
  if (item.match === "prefix") {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return pathname === item.href;
}

export function NavLinks({
  items,
  variant = "header",
}: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex flex-wrap gap-2",
        variant === "header" &&
          "items-center rounded-full border border-border/80 bg-surface-elevated/75 p-1.5 shadow-[var(--shadow-soft)] backdrop-blur-xl",
        variant === "tabs" &&
          "rounded-[var(--radius-lg-value)] border border-border/80 bg-surface/70 p-2 shadow-[var(--shadow-soft)]",
      )}
      aria-label={variant === "header" ? "Primary navigation" : "Tool navigation"}
    >
      {items.map((item) => {
        const active = isItemActive(pathname, item);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center rounded-full border px-4 py-2.5 text-sm font-medium transition duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              variant === "header" &&
                (active
                  ? "border-accent/35 bg-accent text-slate-950 shadow-[0_14px_30px_rgba(196,154,74,0.24)]"
                  : "border-transparent text-foreground-muted hover:border-border hover:bg-white/[0.04] hover:text-foreground"),
              variant === "tabs" &&
                (active
                  ? "border-accent/30 bg-accent/12 text-accent-foreground"
                  : "border-transparent text-foreground-muted hover:border-border hover:bg-white/[0.04] hover:text-foreground"),
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
