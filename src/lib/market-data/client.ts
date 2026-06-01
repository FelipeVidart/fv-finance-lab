import type {
  BatchHistoricalPriceResponse,
  MarketDataExplorerPayload,
  MarketDataPeriod,
  MarketDataProviderMode,
  MarketDataRouteResponse,
} from "@/lib/market-data/types";

type HistoricalPricesRouteResponse =
  | {
      ok: true;
      data: BatchHistoricalPriceResponse;
    }
  | {
      ok: false;
      error: string;
    };

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

export async function loadHistoricalPrices(input: {
  symbols: string[];
  period: MarketDataPeriod;
  provider: MarketDataProviderMode;
  maxSymbols?: number;
}): Promise<BatchHistoricalPriceResponse> {
  const url = new URL(
    "/api/market-data/historical-prices",
    window.location.origin,
  );

  url.searchParams.set("symbols", input.symbols.join(","));
  url.searchParams.set("period", input.period);
  url.searchParams.set(
    "maxSymbols",
    (input.maxSymbols ?? input.symbols.length).toString(),
  );
  url.searchParams.set("provider", input.provider);

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });
  const payload = (await response.json()) as HistoricalPricesRouteResponse;

  if (!payload.ok) {
    throw new Error(payload.error);
  }

  return payload.data;
}
