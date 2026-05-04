import {
  buildHistoricalPriceCacheKey,
  getCachedHistoricalPriceResponse,
  setCachedHistoricalPriceResponse,
} from "@/lib/market-data/cache";
import {
  getAutoProviderPriority,
  getProviderAvailability,
} from "@/lib/market-data/provider-config";
import { createMarketDataWarning } from "@/lib/market-data/errors";
import { StooqMarketDataProvider } from "@/lib/market-data/providers/stooq";
import { TwelveDataHistoricalPriceProvider } from "@/lib/market-data/providers/twelve-data";
import { YahooMarketDataProvider } from "@/lib/market-data/providers/yahoo";
import type { MarketDataProvider } from "@/lib/market-data/providers/types";
import { dedupeSymbols } from "@/lib/market-data/symbols";
import type {
  BatchHistoricalPriceRequest,
  BatchHistoricalPriceResponse,
  HistoricalPriceResponse,
  HistoricalPriceSeries,
  MarketDataProviderDiagnostic,
  MarketDataProviderId,
  MarketDataProviderMode,
  MarketDataWarning,
} from "@/lib/market-data/types";

const providers: Record<MarketDataProviderId, MarketDataProvider> = {
  yahoo: new YahooMarketDataProvider(),
  stooq: new StooqMarketDataProvider(),
  twelveData: new TwelveDataHistoricalPriceProvider(),
};

export async function getBatchHistoricalPrices(
  request: BatchHistoricalPriceRequest,
): Promise<BatchHistoricalPriceResponse> {
  const symbols = dedupeSymbols(request.symbols);
  const entries = await Promise.all(
    symbols.map((symbol) =>
      getHistoricalPricesForSymbol({
        symbol,
        startDate: request.startDate,
        endDate: request.endDate,
        interval: request.interval,
        provider: request.provider,
      }),
    ),
  );
  const results: Record<string, HistoricalPriceResponse> = {};
  const missingSymbols: string[] = [];
  const warnings: MarketDataWarning[] = [];
  const providerDiagnostics: MarketDataProviderDiagnostic[] = [];

  for (const entry of entries) {
    warnings.push(...entry.warnings);
    providerDiagnostics.push(...entry.diagnostics);

    if (entry.response && isValidHistoricalResponse(entry.response)) {
      results[entry.symbol] = entry.response;
      continue;
    }

    missingSymbols.push(entry.symbol);
  }

  return {
    results,
    missingSymbols,
    warnings,
    providerDiagnostics,
  };
}

export function convertBatchToHistoricalSeries(
  batch: BatchHistoricalPriceResponse,
): HistoricalPriceSeries[] {
  return Object.values(batch.results).map((result) => ({
    ticker: result.symbol,
    points: result.prices.map((price) => ({
      date: price.date,
      close: price.adjustedClose ?? price.close,
    })),
  }));
}

async function getHistoricalPricesForSymbol(input: {
  symbol: string;
  startDate?: string;
  endDate?: string;
  interval: "1day";
  provider: MarketDataProviderMode;
}): Promise<{
  symbol: string;
  response: HistoricalPriceResponse | null;
  warnings: MarketDataWarning[];
  diagnostics: MarketDataProviderDiagnostic[];
}> {
  const cacheKey = buildHistoricalPriceCacheKey(input);
  const cached = getCachedHistoricalPriceResponse(cacheKey);

  if (cached) {
    return {
      symbol: input.symbol,
      response: cached,
      warnings: cached.warnings,
      diagnostics: [
        {
          symbol: input.symbol,
          requestedProvider: input.provider,
          provider: cached.provider,
          sourceSymbol: cached.metadata.sourceSymbol,
          status: "cache-hit",
          observations: cached.metadata.observations,
          cacheHit: true,
        },
      ],
    };
  }

  const providerOrder =
    input.provider === "auto" ? getAutoProviderPriority() : [input.provider];
  const warnings: MarketDataWarning[] = [];
  const diagnostics: MarketDataProviderDiagnostic[] = [];

  for (const providerId of providerOrder) {
    const availability = getProviderAvailability(providerId);

    if (!availability?.available) {
      const warning = createMarketDataWarning({
        symbol: input.symbol,
        provider: providerId,
        code: availability?.requiresApiKey ? "missing_api_key" : "provider_unavailable",
        message: buildUnavailableProviderMessage(providerId),
      });

      warnings.push(warning);
      diagnostics.push({
        symbol: input.symbol,
        requestedProvider: input.provider,
        provider: providerId,
        sourceSymbol: input.symbol,
        status: "failure",
        message: warning.message,
        observations: 0,
        cacheHit: false,
      });
      continue;
    }

    const provider = providers[providerId];
    const response = await provider.getHistoricalPrices({
      symbol: input.symbol,
      startDate: input.startDate,
      endDate: input.endDate,
      interval: input.interval,
    });

    warnings.push(...response.warnings);

    if (isValidHistoricalResponse(response)) {
      const finalResponse = {
        ...response,
        warnings,
        metadata: {
          ...response.metadata,
          cacheHit: false,
        },
      };

      diagnostics.push({
        symbol: input.symbol,
        requestedProvider: input.provider,
        provider: providerId,
        sourceSymbol: response.metadata.sourceSymbol,
        status: "success",
        observations: response.metadata.observations,
        cacheHit: false,
      });
      setCachedHistoricalPriceResponse(cacheKey, finalResponse);

      return {
        symbol: input.symbol,
        response: finalResponse,
        warnings,
        diagnostics,
      };
    }

    diagnostics.push({
      symbol: input.symbol,
      requestedProvider: input.provider,
      provider: providerId,
      sourceSymbol: response.metadata.sourceSymbol,
      status: "failure",
      message:
        response.warnings[0]?.message ??
        `No valid daily history returned by ${provider.label}.`,
      observations: response.metadata.observations,
      cacheHit: false,
    });
  }

  return {
    symbol: input.symbol,
    response: null,
    warnings,
    diagnostics,
  };
}

function isValidHistoricalResponse(response: HistoricalPriceResponse): boolean {
  if (response.prices.length < 2) {
    return false;
  }

  return response.prices.every(
    (price) =>
      /^\d{4}-\d{2}-\d{2}$/.test(price.date) &&
      Number.isFinite(price.close) &&
      price.close > 0,
  );
}

function buildUnavailableProviderMessage(providerId: MarketDataProviderId): string {
  const availability = getProviderAvailability(providerId);

  if (!availability) {
    return `Provider ${providerId} is not registered.`;
  }

  if (!availability.implemented) {
    return `${availability.label} is not implemented yet.`;
  }

  if (availability.requiresApiKey) {
    return `${availability.label} requires an API key.`;
  }

  return `${availability.label} is not available.`;
}
