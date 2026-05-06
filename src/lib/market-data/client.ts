import type {
  MarketDataExplorerPayload,
  MarketDataPeriod,
  MarketDataProviderMode,
  MarketDataRouteResponse,
} from "@/lib/market-data/types";

export async function loadMarketDataExplorer(input: {
  tickers: string[];
  period: MarketDataPeriod;
  provider: MarketDataProviderMode;
  maxTickers?: number;
}): Promise<MarketDataExplorerPayload> {
  const url = new URL("/api/market-data", window.location.origin);

  url.searchParams.set("tickers", input.tickers.join(","));
  url.searchParams.set("period", input.period);
  url.searchParams.set(
    "maxTickers",
    (input.maxTickers ?? input.tickers.length).toString(),
  );
  url.searchParams.set("provider", input.provider);

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });
  const payload = (await response.json()) as MarketDataRouteResponse;

  if (!payload.ok) {
    throw new Error(payload.error);
  }

  return payload.data;
}
