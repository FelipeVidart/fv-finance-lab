import { NextResponse } from "next/server";
import {
  convertBatchToHistoricalSeries,
  getBatchHistoricalPrices,
} from "@/lib/market-data/market-data-service";
import {
  isMarketDataProviderMode,
  isValidDateRange,
  parseTickerInput,
} from "@/lib/market-data/request";
import type {
  StressMarketDataPayload,
  StressMarketDataRouteResponse,
} from "@/lib/finance/portfolio/types";

export const runtime = "nodejs";

export async function GET(
  request: Request,
): Promise<NextResponse<StressMarketDataRouteResponse>> {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get("tickers") ?? "";
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const providerParam = searchParams.get("provider") ?? "auto";
  const maxTickersParam = Number(searchParams.get("maxTickers") ?? "10");
  const maxTickers =
    Number.isInteger(maxTickersParam) && maxTickersParam >= 1
      ? Math.min(maxTickersParam, 10)
      : 10;
  const parsedTickers = parseTickerInput(tickersParam, { maxTickers });

  if (!parsedTickers.tickers) {
    return NextResponse.json(
      {
        ok: false,
        error: parsedTickers.error ?? `Enter between 1 and ${maxTickers} tickers.`,
      },
      { status: 400 },
    );
  }

  if (!isValidDateRange(startDate, endDate)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Provide valid ISO startDate and endDate values.",
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
    const batch = await getBatchHistoricalPrices({
      symbols: parsedTickers.tickers,
      startDate,
      endDate,
      interval: "1day",
      provider: providerParam,
    });
    const series = convertBatchToHistoricalSeries(batch);
    const missing: StressMarketDataPayload["missing"] = batch.missingSymbols.map(
      (ticker) => ({
        ticker,
        error:
          batch.warnings.find((warning) => warning.symbol === ticker)?.message ??
          "Unable to load daily history for this ticker.",
      }),
    );

    return NextResponse.json({
      ok: true,
      data: {
        provider: summarizeResolvedProviders(batch.providerDiagnostics),
        startDate,
        endDate,
        series,
        missing,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load stress-test market data right now.";

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
