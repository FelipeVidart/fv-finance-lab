export type NavItem = {
  href: string;
  label: string;
  match?: "exact" | "prefix";
};

export const primaryNavigation = [
  { href: "/", label: "Home", match: "exact" },
  { href: "/projects", label: "Projects", match: "exact" },
  { href: "/tools", label: "Tools", match: "prefix" },
] as const satisfies readonly NavItem[];

export const toolNavigation = [
  { href: "/tools", label: "Overview", match: "exact" },
  { href: "/tools/options", label: "Options", match: "exact" },
  { href: "/tools/risk", label: "Risk", match: "exact" },
  { href: "/tools/bonds", label: "Bonds", match: "exact" },
] as const satisfies readonly NavItem[];
