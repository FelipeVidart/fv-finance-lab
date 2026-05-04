import { calculateDrawdownSeries } from "@/lib/finance/drawdown";
import { calculateTickerMetrics } from "@/lib/finance/metrics";
import {
  calculateCumulativeReturns,
  calculateNormalizedSeries,
} from "@/lib/finance/returns";
import type {
  HistoricalPriceSeries,
  MarketDataExplorerPayload,
  MarketDataPeriod,
  MarketDataProviderDiagnostic,
  MarketDataProviderId,
  MarketDataWarning,
} from "@/lib/market-data/types";

export function buildExplorerPayload(input: {
  period: MarketDataPeriod;
  series: HistoricalPriceSeries[];
  provider: string;
  warnings?: MarketDataWarning[];
  providerDiagnostics?: MarketDataProviderDiagnostic[];
}): MarketDataExplorerPayload {
  if (input.series.length === 0) {
    throw new Error("No price series were returned.");
  }

  const sharedDates = findSharedDates(input.series);

  if (sharedDates.length < 2) {
    throw new Error(
      "Not enough overlapping daily history was found across the selected tickers.",
    );
  }

  const alignedSeries = input.series.map((entry) =>
    alignSeriesToDates(entry, sharedDates),
  );

  const points = sharedDates.map((date, index) => {
    const prices = Object.fromEntries(
      alignedSeries.map((entry) => [entry.ticker, entry.prices[index]]),
    );
    const normalized = Object.fromEntries(
      alignedSeries.map((entry) => [entry.ticker, entry.normalized[index]]),
    );
    const cumulativeReturns = Object.fromEntries(
      alignedSeries.map((entry) => [entry.ticker, entry.cumulativeReturns[index]]),
    );
    const drawdowns = Object.fromEntries(
      alignedSeries.map((entry) => [entry.ticker, entry.drawdowns[index]]),
    );

    return {
      date,
      prices,
      normalized,
      cumulativeReturns,
      drawdowns,
    };
  });

  return {
    tickers: alignedSeries.map((entry) => entry.ticker),
    period: input.period,
    points,
    metrics: alignedSeries.map((entry) =>
      calculateTickerMetrics({
        ticker: entry.ticker,
        prices: entry.prices,
        dates: sharedDates,
      }),
    ),
    meta: {
      provider: input.provider,
      interval: "1day",
      adjustMode: "all",
      observations: sharedDates.length,
      commonStartDate: sharedDates[0],
      commonEndDate: sharedDates[sharedDates.length - 1],
      ...(input.warnings ? { warnings: input.warnings } : {}),
      ...(input.providerDiagnostics
        ? {
            providerDiagnostics: input.providerDiagnostics,
            providers: getResolvedProviders(input.providerDiagnostics),
            cache: summarizeCache(input.providerDiagnostics),
          }
        : {}),
    },
  };
}

function getResolvedProviders(
  diagnostics: MarketDataProviderDiagnostic[],
): MarketDataProviderId[] {
  return [
    ...new Set(
      diagnostics
        .filter((diagnostic) =>
          diagnostic.status === "success" || diagnostic.status === "cache-hit",
        )
        .map((diagnostic) => diagnostic.provider),
    ),
  ];
}

function summarizeCache(
  diagnostics: MarketDataProviderDiagnostic[],
): { hits: number; misses: number } {
  const hits = diagnostics.filter((diagnostic) => diagnostic.cacheHit).length;
  const resolved = diagnostics.filter((diagnostic) =>
    diagnostic.status === "success" || diagnostic.status === "cache-hit",
  ).length;

  return {
    hits,
    misses: Math.max(0, resolved - hits),
  };
}

function findSharedDates(series: HistoricalPriceSeries[]): string[] {
  const shared = series.reduce<Set<string> | null>((current, entry) => {
    const next = new Set(entry.points.map((point) => point.date));

    if (current === null) {
      return next;
    }

    return new Set([...current].filter((date) => next.has(date)));
  }, null);

  return [...(shared ?? new Set<string>())].sort((left, right) =>
    left.localeCompare(right),
  );
}

function alignSeriesToDates(
  series: HistoricalPriceSeries,
  sharedDates: string[],
): {
  ticker: string;
  prices: number[];
  normalized: number[];
  cumulativeReturns: number[];
  drawdowns: number[];
} {
  const priceByDate = new Map(
    series.points.map((point) => [point.date, point.close] as const),
  );
  const prices = sharedDates.map((date) => {
    const price = priceByDate.get(date);

    if (!price || price <= 0) {
      throw new Error(
        `Missing aligned close price for ${series.ticker} on ${date}.`,
      );
    }

    return price;
  });

  return {
    ticker: series.ticker,
    prices,
    normalized: calculateNormalizedSeries(prices),
    cumulativeReturns: calculateCumulativeReturns(prices),
    drawdowns: calculateDrawdownSeries(prices),
  };
}
