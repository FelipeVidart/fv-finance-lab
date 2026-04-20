import type { MarketDataPeriod } from "@/lib/market-data/types";

const PERIODS = ["1M", "3M", "6M", "1Y"] as const satisfies readonly MarketDataPeriod[];
const TICKER_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;

const PERIOD_MONTHS: Record<MarketDataPeriod, number> = {
  "1M": 1,
  "3M": 3,
  "6M": 6,
  "1Y": 12,
};

export function isMarketDataPeriod(value: string): value is MarketDataPeriod {
  return PERIODS.includes(value as MarketDataPeriod);
}

export function parseTickerInput(rawValue: string): {
  tickers?: string[];
  error?: string;
} {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return { error: "Enter between 1 and 5 tickers." };
  }

  const candidates = trimmed
    .split(/[,\s]+/)
    .map((ticker) => ticker.trim().toUpperCase())
    .filter(Boolean);

  if (candidates.length === 0) {
    return { error: "Enter between 1 and 5 tickers." };
  }

  const uniqueTickers = [...new Set(candidates)];

  if (uniqueTickers.length > 5) {
    return { error: "Use at most 5 unique tickers." };
  }

  const invalidTicker = uniqueTickers.find(
    (ticker) => !TICKER_PATTERN.test(ticker),
  );

  if (invalidTicker) {
    return {
      error:
        "Use comma-separated tickers with letters, numbers, dots, or dashes only.",
    };
  }

  return { tickers: uniqueTickers };
}

export function resolvePeriodDateRange(
  period: MarketDataPeriod,
  referenceDate: Date = new Date(),
): { startDate: string; endDate: string } {
  const endDate = toIsoDate(referenceDate);
  const startDate = new Date(referenceDate);

  startDate.setUTCMonth(startDate.getUTCMonth() - PERIOD_MONTHS[period]);

  return {
    startDate: toIsoDate(startDate),
    endDate,
  };
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
