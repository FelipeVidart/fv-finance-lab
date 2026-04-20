import type {
  BondExplorerRecord,
  BondRegistryEntry,
} from "@/lib/bonds/types";

const LOCAL_BOND_REGISTRY: BondRegistryEntry[] = [
  {
    symbol: "US2Y",
    displayName: "US Treasury 2Y Benchmark Proxy",
    issuer: "United States Treasury",
    currency: "USD",
    faceValue: 100,
    couponRate: 0.0425,
    maturityDate: "2028-03-31",
    paymentsPerYear: 2,
    providerSymbol: "US2Y",
  },
  {
    symbol: "US5Y",
    displayName: "US Treasury 5Y Benchmark Proxy",
    issuer: "United States Treasury",
    currency: "USD",
    faceValue: 100,
    couponRate: 0.04125,
    maturityDate: "2031-03-31",
    paymentsPerYear: 2,
    providerSymbol: "US5Y",
  },
  {
    symbol: "US10Y",
    displayName: "US Treasury 10Y Benchmark Proxy",
    issuer: "United States Treasury",
    currency: "USD",
    faceValue: 100,
    couponRate: 0.045,
    maturityDate: "2036-02-15",
    paymentsPerYear: 2,
    providerSymbol: "US10Y",
  },
  {
    symbol: "US30Y",
    displayName: "US Treasury 30Y Benchmark Proxy",
    issuer: "United States Treasury",
    currency: "USD",
    faceValue: 100,
    couponRate: 0.04875,
    maturityDate: "2056-02-15",
    paymentsPerYear: 2,
    providerSymbol: "US30Y",
  },
  {
    symbol: "DE10Y",
    displayName: "German Bund 10Y Benchmark Proxy",
    issuer: "Federal Republic of Germany",
    currency: "EUR",
    faceValue: 100,
    couponRate: 0.025,
    maturityDate: "2035-02-15",
    paymentsPerYear: 1,
    providerSymbol: "DE10Y",
  },
] as const;

export function getBondRegistry(): BondRegistryEntry[] {
  return [...LOCAL_BOND_REGISTRY];
}

export function findBondRegistryEntry(
  symbol: string,
): BondRegistryEntry | undefined {
  return LOCAL_BOND_REGISTRY.find((entry) => entry.symbol === symbol);
}

export function resolveBondSelections(symbols: string[]): BondExplorerRecord[] {
  return symbols.map((symbol) => {
    const metadata = findBondRegistryEntry(symbol);

    return {
      symbol,
      marketSymbol: metadata?.providerSymbol ?? symbol,
      metadataStatus: metadata ? "available" : "missing",
      metadataSource: metadata ? "local-registry" : "none",
      metadata: metadata ?? null,
    };
  });
}
