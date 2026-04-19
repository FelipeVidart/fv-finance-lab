"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/navigation";

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
      className={
        variant === "header"
          ? "flex flex-wrap items-center justify-end gap-2"
          : "flex flex-wrap gap-2"
      }
      aria-label={variant === "header" ? "Primary navigation" : "Tool navigation"}
    >
      {items.map((item) => {
        const active = isItemActive(pathname, item);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              variant === "header"
                ? `rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-white text-slate-950"
                      : "text-slate-300 hover:bg-white/6 hover:text-white"
                  }`
                : `rounded-full border px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "border-sky-300/40 bg-sky-300/12 text-sky-100"
                      : "border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5 hover:text-white"
                  }`
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
