import type { PortfolioPreset } from "@/lib/finance/portfolio/types";

export const MODERATE_GROWTH_ATHLETE_PORTFOLIO: PortfolioPreset = {
  name: "Moderate Growth Athlete Portfolio",
  initialCapital: 100000,
  period: "1Y",
  holdings: [
    { ticker: "IVV", assetClass: "US Large Cap Equity", weight: 30 },
    { ticker: "IJR", assetClass: "US Small Cap Equity", weight: 14 },
    { ticker: "IEV", assetClass: "Developed Markets ex-US Equity", weight: 8 },
    { ticker: "CLOA", assetClass: "CLO Investment Grade", weight: 10 },
    { ticker: "BINC", assetClass: "Multisector Income Bonds", weight: 7 },
    { ticker: "GOVT", assetClass: "US Treasuries", weight: 4 },
    { ticker: "IGSB", assetClass: "Short-Term Corporate IG", weight: 7 },
    { ticker: "EMB", assetClass: "Emerging Market Bonds", weight: 6 },
    { ticker: "IAU", assetClass: "Gold", weight: 13 },
    { ticker: "TBIL", assetClass: "Treasury Bills / Cash", weight: 1 },
  ],
};

export const PORTFOLIO_ASSET_CLASS_BY_TICKER = Object.fromEntries(
  MODERATE_GROWTH_ATHLETE_PORTFOLIO.holdings.map((asset) => [
    asset.ticker,
    asset.assetClass,
  ]),
) as Record<string, string>;
