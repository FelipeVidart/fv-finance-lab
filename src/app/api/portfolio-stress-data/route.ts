import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/lib/market-data/provider";
import { parseTickerInput } from "@/lib/market-data/request";
import type {
  StressMarketDataPayload,
  StressMarketDataRouteResponse,
} from "@/lib/finance/portfolio/types";
import type { HistoricalPriceSeries } from "@/lib/market-data/types";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const runtime = "nodejs";

export async function GET(
  request: Request,
): Promise<NextResponse<StressMarketDataRouteResponse>> {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get("tickers") ?? "";
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
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

  try {
    const provider = getMarketDataProvider();
    const results = await Promise.allSettled(
      parsedTickers.tickers.map(async (ticker) => {
        const [series] = await provider.getDailySeries({
          tickers: [ticker],
          startDate,
          endDate,
        });

        return series;
      }),
    );
    const series: HistoricalPriceSeries[] = [];
    const missing: StressMarketDataPayload["missing"] = [];

    results.forEach((result, index) => {
      const ticker = parsedTickers.tickers?.[index] ?? "UNKNOWN";

      if (result.status === "fulfilled") {
        series.push(result.value);
        return;
      }

      missing.push({
        ticker,
        error:
          result.reason instanceof Error
            ? result.reason.message
            : "Unable to load daily history for this ticker.",
      });
    });

    return NextResponse.json({
      ok: true,
      data: {
        provider: provider.id,
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

function isValidDateRange(startDate: string, endDate: string): boolean {
  if (!ISO_DATE_PATTERN.test(startDate) || !ISO_DATE_PATTERN.test(endDate)) {
    return false;
  }

  const startTime = Date.parse(`${startDate}T00:00:00Z`);
  const endTime = Date.parse(`${endDate}T00:00:00Z`);

  return (
    Number.isFinite(startTime) &&
    Number.isFinite(endTime) &&
    startTime <= endTime
  );
}
