import { NextResponse } from "next/server";
import { getBatchHistoricalPrices } from "@/lib/market-data/market-data-service";
import {
  isMarketDataPeriod,
  isMarketDataProviderMode,
  isValidDateRange,
  parseTickerInput,
  resolvePeriodDateRange,
} from "@/lib/market-data/request";
import type {
  BatchHistoricalPriceResponse,
} from "@/lib/market-data/types";

export const runtime = "nodejs";

type HistoricalPricesRouteResponse =
  | {
      ok: true;
      data: BatchHistoricalPriceResponse;
    }
  | {
      ok: false;
      error: string;
    };

export async function GET(
  request: Request,
): Promise<NextResponse<HistoricalPricesRouteResponse>> {
  const { searchParams } = new URL(request.url);
  const symbolsParam =
    searchParams.get("symbols") ??
    searchParams.get("tickers") ??
    searchParams.get("symbol") ??
    "";
  const maxSymbolsParam = Number(searchParams.get("maxSymbols") ?? "25");
  const maxSymbols =
    Number.isInteger(maxSymbolsParam) && maxSymbolsParam >= 1
      ? Math.min(maxSymbolsParam, 50)
      : 25;
  const parsedSymbols = parseTickerInput(symbolsParam, {
    maxTickers: maxSymbols,
  });

  if (!parsedSymbols.tickers) {
    return NextResponse.json(
      {
        ok: false,
        error:
          parsedSymbols.error ?? `Enter between 1 and ${maxSymbols} symbols.`,
      },
      { status: 400 },
    );
  }

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

  const range = resolveRouteDateRange(searchParams);

  if (!range) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Provide valid ISO startDate and endDate values, or a supported period.",
      },
      { status: 400 },
    );
  }

  const data = await getBatchHistoricalPrices({
    symbols: parsedSymbols.tickers,
    startDate: range.startDate,
    endDate: range.endDate,
    interval: "1day",
    provider: providerParam,
  });

  return NextResponse.json({
    ok: true,
    data,
  });
}

function resolveRouteDateRange(
  searchParams: URLSearchParams,
): { startDate: string; endDate: string } | null {
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";

  if (startDate || endDate) {
    return isValidDateRange(startDate, endDate) ? { startDate, endDate } : null;
  }

  const periodParam = searchParams.get("period") ?? "1Y";

  if (!isMarketDataPeriod(periodParam)) {
    return null;
  }

  return resolvePeriodDateRange(periodParam);
}
