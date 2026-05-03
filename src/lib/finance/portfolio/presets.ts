import type { PortfolioPreset } from "@/lib/finance/portfolio/types";

export const PORTFOLIO_PRESETS: PortfolioPreset[] = [
  {
    id: "conservative-income",
    name: "Conservative Income Portfolio",
    description:
      "Capital preservation, income stability, and lower volatility.",
    riskLevel: "Conservative",
    initialCapital: 100000,
    period: "1Y",
    holdings: [
      { ticker: "IVV", assetClass: "US Large Cap Equity", weight: 15 },
      { ticker: "VXUS", assetClass: "International Equity", weight: 10 },
      { ticker: "AGG", assetClass: "US Aggregate Bonds", weight: 45 },
      { ticker: "IEF", assetClass: "Intermediate Treasuries", weight: 15 },
      { ticker: "BIL", assetClass: "Treasury Bills / Cash", weight: 10 },
      { ticker: "IAU", assetClass: "Gold", weight: 5 },
    ],
  },
  {
    id: "balanced-60-40",
    name: "Balanced 60/40 Portfolio",
    description:
      "Classic balance between long-term growth and portfolio stability.",
    riskLevel: "Balanced",
    initialCapital: 100000,
    period: "1Y",
    holdings: [
      { ticker: "IVV", assetClass: "US Large Cap Equity", weight: 45 },
      { ticker: "VXUS", assetClass: "International Equity", weight: 15 },
      { ticker: "AGG", assetClass: "US Aggregate Bonds", weight: 30 },
      { ticker: "IEF", assetClass: "Intermediate Treasuries", weight: 10 },
    ],
  },
  {
    id: "growth",
    name: "Growth Portfolio",
    description: "Long-term capital growth with some defensive allocation.",
    riskLevel: "Growth",
    initialCapital: 100000,
    period: "1Y",
    holdings: [
      { ticker: "IVV", assetClass: "US Large Cap Equity", weight: 55 },
      { ticker: "IJR", assetClass: "US Small Cap Equity", weight: 10 },
      { ticker: "VXUS", assetClass: "International Equity", weight: 15 },
      { ticker: "AGG", assetClass: "US Aggregate Bonds", weight: 15 },
      { ticker: "IAU", assetClass: "Gold", weight: 5 },
    ],
  },
  {
    id: "aggressive-growth",
    name: "Aggressive Growth Portfolio",
    description: "High long-term growth potential with higher volatility.",
    riskLevel: "Aggressive",
    initialCapital: 100000,
    period: "1Y",
    holdings: [
      { ticker: "IVV", assetClass: "US Large Cap Equity", weight: 65 },
      { ticker: "IJR", assetClass: "US Small Cap Equity", weight: 15 },
      { ticker: "VXUS", assetClass: "International Equity", weight: 15 },
      { ticker: "IAU", assetClass: "Gold", weight: 5 },
    ],
  },
];

export const DEFAULT_PORTFOLIO_PRESET_ID = "balanced-60-40";

export const DEFAULT_PORTFOLIO_PRESET =
  PORTFOLIO_PRESETS.find((preset) => preset.id === DEFAULT_PORTFOLIO_PRESET_ID) ??
  PORTFOLIO_PRESETS[0];

export const PORTFOLIO_ASSET_CLASS_BY_TICKER = Object.fromEntries(
  PORTFOLIO_PRESETS.flatMap((preset) =>
    preset.holdings.map((asset) => [asset.ticker, asset.assetClass] as const),
  ),
) as Record<string, string>;
