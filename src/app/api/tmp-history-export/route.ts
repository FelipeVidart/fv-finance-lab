import { NextResponse } from "next/server";
import { getBatchHistoricalPrices } from "@/lib/market-data/market-data-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tickers = (url.searchParams.get("tickers") ?? "")
    .split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
  const startDate = url.searchParams.get("start") ?? undefined;
  const endDate = url.searchParams.get("end") ?? undefined;
  if (!tickers.length) return NextResponse.json({ ok:false, error:"tickers required" }, { status:400 });
  const batch = await getBatchHistoricalPrices({ symbols: tickers, startDate, endDate, interval:"1day", provider:"yahoo" });
  const data = Object.fromEntries(Object.entries(batch.results).map(([ticker, r]) => [
    ticker,
    {
      currency: r.metadata.currency,
      points: r.prices.map(p => ({ date:p.date, close:p.adjustedClose ?? p.close })),
    },
  ]));
  return NextResponse.json({ ok:true, data, missing:batch.missingSymbols, warnings:batch.warnings });
}
