import { NextResponse } from "next/server";
import { buildExplorerPayload } from "@/lib/market-data/normalize";
import {
  isMarketDataPeriod,
  parseTickerInput,
  resolvePeriodDateRange,
} from "@/lib/market-data/request";
import { getMarketDataProvider } from "@/lib/market-data/provider";
import type { MarketDataRouteResponse } from "@/lib/market-data/types";

export const runtime = "nodejs";

export async function GET(
  request: Request,
): Promise<NextResponse<MarketDataRouteResponse>> {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get("tickers") ?? "";
  const periodParam = searchParams.get("period") ?? "6M";
  const parsedTickers = parseTickerInput(tickersParam);

  if (!parsedTickers.tickers) {
    return NextResponse.json(
      {
        ok: false,
        error: parsedTickers.error ?? "Enter between 1 and 5 tickers.",
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

  try {
    const provider = getMarketDataProvider();
    const { startDate, endDate } = resolvePeriodDateRange(periodParam);
    const series = await provider.getDailySeries({
      tickers: parsedTickers.tickers,
      startDate,
      endDate,
    });
    const payload = buildExplorerPayload({
      period: periodParam,
      series,
      provider: provider.id,
    });

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
