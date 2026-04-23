export type SearchEntry = {
  label: string;
  href: string;
  description?: string;
  keywords: string[];
  group: "Page" | "Module" | "Section";
};

export const searchIndex: SearchEntry[] = [
  {
    label: "Home",
    href: "/",
    description: "Platform overview and product positioning.",
    keywords: ["landing", "overview", "platform", "main"],
    group: "Page",
  },
  {
    label: "Projects",
    href: "/projects",
    description: "Research, implementation modules, and technical catalog.",
    keywords: ["research", "catalog", "implementation", "project"],
    group: "Page",
  },
  {
    label: "Tools",
    href: "/tools",
    description: "Global tools layer and module entry points.",
    keywords: ["workspace", "tooling", "modules", "tools page"],
    group: "Page",
  },
  {
    label: "Tools Overview",
    href: "/tools",
    description: "Overview of Options, Risk, and Bonds workspaces.",
    keywords: ["overview", "tool overview", "modules", "entry points"],
    group: "Page",
  },
  {
    label: "Options",
    href: "/tools/options",
    description: "Derivatives pricing, payoff analysis, and model comparison.",
    keywords: ["derivatives", "pricing", "payoff", "black-scholes", "binomial"],
    group: "Module",
  },
  {
    label: "Options Pricing",
    href: "/tools/options",
    description: "Contract setup, valuation, and Greeks.",
    keywords: ["pricing", "option pricing", "valuation", "greeks"],
    group: "Section",
  },
  {
    label: "Model Comparison",
    href: "/tools/options",
    description: "Compare Black-Scholes with the CRR tree workflow.",
    keywords: ["comparison", "binomial", "crr", "convergence"],
    group: "Section",
  },
  {
    label: "Risk",
    href: "/tools/risk",
    description: "Portfolio risk workspace with setup and analytics layers.",
    keywords: ["portfolio", "risk", "sandbox", "dataset", "analytics"],
    group: "Module",
  },
  {
    label: "Portfolio Analytics",
    href: "/tools/risk",
    description: "Portfolio-level metrics, holdings, and review surfaces.",
    keywords: ["portfolio analytics", "holdings", "metrics", "portfolio"],
    group: "Section",
  },
  {
    label: "Bonds",
    href: "/tools/bonds",
    description: "Fixed-income pricing, analytics, and market monitoring.",
    keywords: ["fixed income", "bonds", "duration", "cash flows", "monitor"],
    group: "Module",
  },
  {
    label: "Market Monitor",
    href: "/tools/bonds",
    description: "Desk-style market history, spread context, and reference views.",
    keywords: ["monitor", "market", "spreads", "benchmark", "registry"],
    group: "Section",
  },
];

const MAX_RESULTS = 6;

function normalizeValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function searchNavigationEntries(query: string): SearchEntry[] {
  const normalizedQuery = normalizeValue(query);

  if (!normalizedQuery) {
    return searchIndex.slice(0, MAX_RESULTS);
  }

  const results = searchIndex
    .map((entry) => {
      const normalizedLabel = normalizeValue(entry.label);
      const normalizedDescription = normalizeValue(entry.description ?? "");
      const normalizedKeywords = entry.keywords.map(normalizeValue);
      let score = 0;

      if (normalizedLabel === normalizedQuery) {
        score += 120;
      } else if (normalizedLabel.startsWith(normalizedQuery)) {
        score += 90;
      } else if (normalizedLabel.includes(normalizedQuery)) {
        score += 72;
      }

      if (normalizedDescription.includes(normalizedQuery)) {
        score += 30;
      }

      for (const keyword of normalizedKeywords) {
        if (keyword === normalizedQuery) {
          score += 64;
          continue;
        }

        if (keyword.startsWith(normalizedQuery)) {
          score += 44;
          continue;
        }

        if (keyword.includes(normalizedQuery)) {
          score += 22;
        }
      }

      return { entry, score };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.entry.label.localeCompare(right.entry.label);
    })
    .slice(0, MAX_RESULTS)
    .map((result) => result.entry);

  return results;
}

