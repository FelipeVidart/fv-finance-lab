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
          "items-center rounded-[1.55rem] border border-border/75 bg-[linear-gradient(180deg,rgba(18,29,42,0.88),rgba(10,17,26,0.76))] p-1.5 shadow-[var(--shadow-soft)] backdrop-blur-xl",
        variant === "tabs" &&
          "rounded-[1.55rem] border border-border/75 bg-[linear-gradient(180deg,rgba(17,27,40,0.88),rgba(10,17,26,0.76))] p-1.5 shadow-[var(--shadow-soft)] backdrop-blur-xl",
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
              "inline-flex items-center rounded-[1.15rem] border px-4 py-2.5 text-sm font-medium transition duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              variant === "header" &&
                (active
                  ? "border-accent/35 bg-[linear-gradient(180deg,rgba(226,184,107,0.98),rgba(196,154,74,0.96))] text-slate-950 shadow-[0_14px_30px_rgba(196,154,74,0.24)]"
                  : "border-transparent bg-transparent text-foreground-muted hover:border-border/80 hover:bg-white/[0.04] hover:text-foreground"),
              variant === "tabs" &&
                (active
                  ? "border-accent/30 bg-[radial-gradient(circle_at_top,rgba(226,184,107,0.14),transparent_60%),linear-gradient(180deg,rgba(31,40,52,0.96),rgba(14,21,31,0.94))] text-accent-foreground shadow-[0_12px_28px_rgba(196,154,74,0.14)]"
                  : "border-transparent bg-transparent text-foreground-muted hover:border-border/80 hover:bg-white/[0.04] hover:text-foreground"),
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
