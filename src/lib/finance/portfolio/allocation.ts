import type {
  AssetClassAllocationRow,
  AssetClassAllocationSummary,
  BroadAllocationRow,
  BroadAssetCategory,
  PortfolioAssetInput,
} from "@/lib/finance/portfolio/types";

const BROAD_CATEGORY_BY_ASSET_CLASS: Record<string, BroadAssetCategory> = {
  "US Large Cap Equity": "Equity",
  "US Small Cap Equity": "Equity",
  "Developed Markets ex-US Equity": "Equity",
  "CLO Investment Grade": "Fixed Income",
  "Multisector Income Bonds": "Fixed Income",
  "US Treasuries": "Fixed Income",
  "Short-Term Corporate IG": "Fixed Income",
  "Emerging Market Bonds": "Fixed Income",
  Gold: "Alternatives",
  "Treasury Bills / Cash": "Cash",
};

const GROUPING_TOLERANCE = 1e-8;

export function buildAssetClassAllocation(
  holdings: PortfolioAssetInput[],
): AssetClassAllocationSummary {
  const validHoldings = holdings
    .map((holding) => ({
      ticker: holding.ticker.trim().toUpperCase(),
      assetClass: holding.assetClass.trim(),
      weight: holding.weight,
    }))
    .filter(
      (holding) =>
        holding.ticker !== "" &&
        holding.assetClass !== "" &&
        Number.isFinite(holding.weight) &&
        holding.weight > 0,
    );
  const totalWeight = validHoldings.reduce(
    (sum, holding) => sum + holding.weight,
    0,
  );
  const assetClassMap = new Map<string, AssetClassAllocationRow>();

  for (const holding of validHoldings) {
    const existing = assetClassMap.get(holding.assetClass);
    const broadCategory = getBroadAssetCategory(holding.assetClass);

    if (!existing) {
      assetClassMap.set(holding.assetClass, {
        assetClass: holding.assetClass,
        broadCategory,
        weight: holding.weight,
        holdingCount: 1,
        tickers: [holding.ticker],
      });
      continue;
    }

    existing.weight += holding.weight;
    existing.holdingCount += 1;
    existing.tickers.push(holding.ticker);
  }

  const assetClasses = [...assetClassMap.values()].sort(
    (left, right) => right.weight - left.weight,
  );
  const broadCategories = buildBroadAllocation(assetClasses);
  const groupedWeight = assetClasses.reduce((sum, row) => sum + row.weight, 0);

  return {
    assetClasses,
    broadCategories,
    totalWeight,
    groupedWeight,
    isWeightConsistent: Math.abs(groupedWeight - totalWeight) <= GROUPING_TOLERANCE,
  };
}

function buildBroadAllocation(
  assetClasses: AssetClassAllocationRow[],
): BroadAllocationRow[] {
  const broadMap = new Map<BroadAssetCategory, BroadAllocationRow>();

  for (const assetClass of assetClasses) {
    const existing = broadMap.get(assetClass.broadCategory);

    if (!existing) {
      broadMap.set(assetClass.broadCategory, {
        category: assetClass.broadCategory,
        weight: assetClass.weight,
        holdingCount: assetClass.holdingCount,
        assetClassCount: 1,
      });
      continue;
    }

    existing.weight += assetClass.weight;
    existing.holdingCount += assetClass.holdingCount;
    existing.assetClassCount += 1;
  }

  return [...broadMap.values()].sort((left, right) => right.weight - left.weight);
}

function getBroadAssetCategory(assetClass: string): BroadAssetCategory {
  return BROAD_CATEGORY_BY_ASSET_CLASS[assetClass] ?? "Other";
}
