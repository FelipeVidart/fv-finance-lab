import { NextResponse } from "next/server";
import {
  alignMarketRegimeSeries,
  buildMockMarketRegimeSeries,
  calculateMarketRegime,
  resolveMarketRegimeDateRange,
} from "@/lib/finance/market-regime";
import { MARKET_REGIME_TICKER_CONFIG } from "@/lib/finance/market-regime/types";
import { buildMissingSymbolsMessage } from "@/lib/market-data/errors";
import { getBatchHistoricalPrices } from "@/lib/market-data/market-data-service";
import { isMarketDataProviderMode } from "@/lib/market-data/request";
import type {
  MarketRegimePriceSeries,
  MarketRegimeRouteResponse,
} from "@/lib/finance/market-regime/types";
import type {
  BatchHistoricalPriceResponse,
  MarketDataProviderMode,
} from "@/lib/market-data/types";

export const runtime = "nodejs";

export async function GET(
  request: Request,
): Promise<NextResponse<MarketRegimeRouteResponse>> {
  const { searchParams } = new URL(request.url);
  const providerParam = searchParams.get("provider") ?? "auto";

  if (!isMarketDataProviderMode(providerParam)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Select a supported provider: auto, yahoo, stooq, or twelveData.",
      },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json({
      ok: true,
      data: await loadRealMarketRegime(providerParam),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load live market regime data.";

    try {
      const mockSeries = buildMockMarketRegimeSeries();
      const mockPoints = alignMarketRegimeSeries(mockSeries);

      return NextResponse.json({
        ok: true,
        data: calculateMarketRegime({
          points: mockPoints,
          source: "mock",
          provider: "typed fallback fixture",
          requestedProvider: providerParam,
          warnings: [
            `Using typed fallback data because live market data could not be completed: ${message}`,
          ],
        }),
      });
    } catch (fallbackError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            fallbackError instanceof Error
              ? fallbackError.message
              : "Unable to calculate market regime data.",
        },
        { status: 502 },
      );
    }
  }
}

async function loadRealMarketRegime(
  requestedProvider: MarketDataProviderMode,
) {
  const { startDate, endDate } = resolveMarketRegimeDateRange();
  const batch = await getBatchHistoricalPrices({
    symbols: MARKET_REGIME_TICKER_CONFIG.map((entry) => entry.fetchSymbol),
    startDate,
    endDate,
    interval: "1day",
    provider: requestedProvider,
  });

  if (batch.missingSymbols.length > 0) {
    throw new Error(
      buildMissingSymbolsMessage({
        symbols: batch.missingSymbols,
        warnings: batch.warnings,
        noun: "market regime symbol",
      }),
    );
  }

  const series = convertMarketRegimeBatch(batch);
  const points = alignMarketRegimeSeries(series);

  return calculateMarketRegime({
    points,
    source: "real",
    provider: summarizeResolvedProviders(batch),
    requestedProvider,
    providerWarnings: batch.warnings,
  });
}

function convertMarketRegimeBatch(
  batch: BatchHistoricalPriceResponse,
): MarketRegimePriceSeries[] {
  return MARKET_REGIME_TICKER_CONFIG.map((config) => {
    const result = batch.results[config.fetchSymbol];

    if (!result) {
      throw new Error(`Missing daily history for ${config.ticker}.`);
    }

    return {
      ticker: config.ticker,
      sourceSymbol: config.fetchSymbol,
      points: result.prices.map((price) => ({
        date: price.date,
        close: price.adjustedClose ?? price.close,
      })),
    };
  });
}

function summarizeResolvedProviders(batch: BatchHistoricalPriceResponse): string {
  const providers = [
    ...new Set(
      batch.providerDiagnostics
        .filter(
          (diagnostic) =>
            diagnostic.status === "success" || diagnostic.status === "cache-hit",
        )
        .map((diagnostic) => diagnostic.provider),
    ),
  ];

  return providers.length > 0 ? providers.join(" + ") : "unavailable";
}

