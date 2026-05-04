import type {
  HistoricalPriceResponse,
  MarketDataInterval,
  MarketDataProviderMode,
} from "@/lib/market-data/types";

const DAILY_HISTORY_TTL_MS = 6 * 60 * 60 * 1000;

type CacheEntry = {
  expiresAt: number;
  response: HistoricalPriceResponse;
};

const historicalPriceCache = new Map<string, CacheEntry>();

export function buildHistoricalPriceCacheKey(input: {
  provider: MarketDataProviderMode;
  symbol: string;
  startDate?: string;
  endDate?: string;
  interval: MarketDataInterval;
}): string {
  return [
    input.provider,
    input.symbol.toUpperCase(),
    input.startDate ?? "",
    input.endDate ?? "",
    input.interval,
  ].join("|");
}

export function getCachedHistoricalPriceResponse(
  key: string,
): HistoricalPriceResponse | null {
  const entry = historicalPriceCache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    historicalPriceCache.delete(key);
    return null;
  }

  return {
    ...entry.response,
    metadata: {
      ...entry.response.metadata,
      cacheHit: true,
    },
  };
}

export function setCachedHistoricalPriceResponse(
  key: string,
  response: HistoricalPriceResponse,
  ttlMs = DAILY_HISTORY_TTL_MS,
) {
  historicalPriceCache.set(key, {
    expiresAt: Date.now() + ttlMs,
    response: {
      ...response,
      metadata: {
        ...response.metadata,
        cacheHit: false,
      },
    },
  });
}
