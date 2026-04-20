import type { MarketDataExplorerPayload } from "@/lib/market-data/types";

export type BondRegistryEntry = {
  symbol: string;
  displayName: string;
  issuer: string;
  currency: string;
  faceValue: number;
  couponRate: number;
  maturityDate: string;
  paymentsPerYear: number;
  providerSymbol?: string;
};

export type BondExplorerRecord = {
  symbol: string;
  marketSymbol: string;
  metadataStatus: "available" | "missing";
  metadataSource: "local-registry" | "none";
  metadata: BondRegistryEntry | null;
};

export type BondMarketExplorerPayload = {
  marketData: MarketDataExplorerPayload;
  bonds: BondExplorerRecord[];
  meta: {
    registrySize: number;
    metadataAvailable: number;
    metadataMissing: number;
    note: string;
  };
};

export type BondMarketDataRouteSuccess = {
  ok: true;
  data: BondMarketExplorerPayload;
};

export type BondMarketDataRouteError = {
  ok: false;
  error: string;
};

export type BondMarketDataRouteResponse =
  | BondMarketDataRouteSuccess
  | BondMarketDataRouteError;
