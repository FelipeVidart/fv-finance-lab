import { NextResponse } from "next/server";
import { resolveBondSelections, getBondRegistry } from "@/lib/bonds/registry";
import { buildMissingSymbolsMessage } from "@/lib/market-data/errors";
import type {
  BondMarketDataRouteResponse,
  BondMarketExplorerPayload,
} from "@/lib/bonds/types";
import {
  convertBatchToHistoricalSeries,
  getBatchHistoricalPrices,
} from "@/lib/market-data/market-data-service";
import { buildExplorerPayload } from "@/lib/market-data/normalize";
import {
  isMarketDataPeriod,
  isMarketDataProviderMode,
  parseTickerInput,
  resolvePeriodDateRange,
} from "@/lib/market-data/request";

export const runtime = "nodejs";

export async function GET(
  request: Request,
): Promise<NextResponse<BondMarketDataRouteResponse>> {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols") ?? "";
  const periodParam = searchParams.get("period") ?? "6M";
  const providerParam = searchParams.get("provider") ?? "auto";
  const parsedSymbols = parseTickerInput(symbolsParam);

  if (!parsedSymbols.tickers) {
    return NextResponse.json(
      {
        ok: false,
        error: parsedSymbols.error ?? "Enter between 1 and 5 bond symbols.",
      },
      { status: 400 },
    );
  }

  if (!isMarketDataPeriod(periodParam)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Select a supported period: 1M, 3M, 6M, or 1Y.",
      },
      { status: 400 },
    );
  }

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
    const selections = resolveBondSelections(parsedSymbols.tickers);
    const { startDate, endDate } = resolvePeriodDateRange(periodParam);
    const batch = await getBatchHistoricalPrices({
      symbols: selections.map((selection) => selection.marketSymbol),
      startDate,
      endDate,
      interval: "1day",
      provider: providerParam,
    });

    if (batch.missingSymbols.length > 0) {
      throw new Error(
        buildMissingSymbolsMessage({
          symbols: batch.missingSymbols,
          warnings: batch.warnings,
          noun: "symbol",
        }),
      );
    }

    const series = convertBatchToHistoricalSeries(batch);
    const seriesByMarketSymbol = new Map(
      series.map((entry) => [entry.ticker, entry] as const),
    );
    const remappedSeries = selections.map((selection) => {
      const entry = seriesByMarketSymbol.get(selection.marketSymbol);

      if (!entry) {
        throw new Error(
          `Missing daily history for ${selection.symbol} after provider fetch.`,
        );
      }

      return {
        ticker: selection.symbol,
        points: entry.points,
      };
    });
    const payload: BondMarketExplorerPayload = {
      marketData: buildExplorerPayload({
        period: periodParam,
        series: remappedSeries,
        provider: summarizeResolvedProviders(batch.providerDiagnostics),
      }),
      bonds: selections,
      meta: {
        registrySize: getBondRegistry().length,
        metadataAvailable: selections.filter(
          (selection) => selection.metadataStatus === "available",
        ).length,
        metadataMissing: selections.filter(
          (selection) => selection.metadataStatus === "missing",
        ).length,
        note:
          "Local registry metadata is manually maintained reference information and is separate from fetched market time series.",
      },
    };

    return NextResponse.json({
      ok: true,
      data: payload,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load bond market data right now.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 502 },
    );
  }
}

function summarizeResolvedProviders(
  diagnostics: Array<{ status: string; provider: string }>,
): string {
  const providers = [
    ...new Set(
      diagnostics
        .filter(
          (diagnostic) =>
            diagnostic.status === "success" || diagnostic.status === "cache-hit",
        )
        .map((diagnostic) => diagnostic.provider),
    ),
  ];

  return providers.length > 0 ? providers.join(" + ") : "unavailable";
}
