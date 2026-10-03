import { NextResponse } from "next/server";
import { buildMissingSymbolsMessage } from "@/lib/market-data/errors";
import {
  convertBatchToHistoricalSeries,
  getBatchHistoricalPrices,
} from "@/lib/market-data/market-data-service";
import { buildExplorerPayload } from "@/lib/market-data/normalize";
import {
  MAX_RISK_TICKERS,
  isMarketDataPeriod,
  isMarketDataProviderMode,
  parseTickerInput,
  resolvePeriodDateRange,
} from "@/lib/market-data/request";
import type { MarketDataRouteResponse } from "@/lib/market-data/types";

export const runtime = "nodejs";

export async function GET(
  request: Request,
): Promise<NextResponse<MarketDataRouteResponse>> {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get("tickers") ?? "";
  const periodParam = searchParams.get("period") ?? "6M";
  const providerParam = searchParams.get("provider") ?? "auto";
  const maxTickersParam = Number(searchParams.get("maxTickers") ?? String(MAX_RISK_TICKERS));
  const maxTickers =
    Number.isInteger(maxTickersParam) && maxTickersParam >= 1
      ? Math.min(maxTickersParam, MAX_RISK_TICKERS)
      : MAX_RISK_TICKERS;
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

  const ars = searchParams.get("priceCurrency") === "ARS";
  if (ars && (providerParam !== "yahoo" || parsedTickers.tickers.some((ticker) => !ticker.endsWith(".BA")))) {
    return NextResponse.json({ ok: false, error: "ARS mode requires Yahoo and explicit local .BA symbols. Import CSV for funds or unavailable series." }, { status: 400 });
  }

  try {
    const { startDate, endDate } = resolvePeriodDateRange(periodParam);
    const batch = await getBatchHistoricalPrices({
      symbols: parsedTickers.tickers,
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
          noun: "ticker",
        }),
      );
    }

    if (ars && Object.values(batch.results).some((result) => result.metadata.currency !== "ARS")) {
      throw new Error("Provider did not confirm ARS for every series. No USD fallback or FX conversion was applied.");
    }
    const series = convertBatchToHistoricalSeries(batch);
    const payload = buildExplorerPayload({
      period: periodParam,
      series,
      provider: summarizeResolvedProviders(batch.providerDiagnostics),
      warnings: batch.warnings,
      providerDiagnostics: batch.providerDiagnostics,
    });

    if (ars) payload.meta.priceCurrency = "ARS";

    return NextResponse.json({
      ok: true,
      data: payload,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load market data right now.";

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
