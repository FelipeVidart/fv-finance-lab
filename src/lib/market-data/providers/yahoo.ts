import { createMarketDataWarning, getErrorMessage } from "@/lib/market-data/errors";
import { normalizeRequestSymbol } from "@/lib/market-data/symbols";
import type { MarketDataProvider } from "@/lib/market-data/providers/types";
import type {
  HistoricalPriceResponse,
  PricePoint,
} from "@/lib/market-data/types";

const YAHOO_CHART_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart/";

type YahooChartPayload = {
  chart?: {
    result?: YahooChartResult[] | null;
    error?: {
      code?: string;
      description?: string;
    } | null;
  };
};

type YahooChartResult = {
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: Array<number | null>;
      high?: Array<number | null>;
      low?: Array<number | null>;
      close?: Array<number | null>;
      volume?: Array<number | null>;
    }>;
    adjclose?: Array<{
      adjclose?: Array<number | null>;
    }>;
  };
};

export class YahooMarketDataProvider implements MarketDataProvider {
  readonly id = "yahoo" as const;
  readonly label = "Yahoo Finance";
  readonly supports = {
    dailyHistorical: true,
    dateRange: true,
    batch: false,
    requiresApiKey: false,
  };

  async getHistoricalPrices(input: {
    symbol: string;
    startDate?: string;
    endDate?: string;
    interval: "1day";
  }): Promise<HistoricalPriceResponse> {
    const sourceSymbol = normalizeRequestSymbol(input.symbol);

    try {
      const url = new URL(`${YAHOO_CHART_BASE_URL}${sourceSymbol}`);
      const period1 = toUnixSeconds(input.startDate);
      const period2 = toUnixSeconds(input.endDate, { addDays: 1 });

      if (period1 !== undefined) {
        url.searchParams.set("period1", period1.toString());
      }

      if (period2 !== undefined) {
        url.searchParams.set("period2", period2.toString());
      }

      url.searchParams.set("interval", "1d");
      url.searchParams.set("events", "history");
      url.searchParams.set("includeAdjustedClose", "true");

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
        },
      });

      if (!response.ok) {
        return createFailureResponse({
          symbol: input.symbol,
          sourceSymbol,
          startDate: input.startDate,
          endDate: input.endDate,
          code: response.status === 404 ? "invalid_symbol" : "provider_http_error",
          message: `Yahoo Finance request failed for ${input.symbol} with status ${response.status}.`,
        });
      }

      const payload = (await response.json()) as YahooChartPayload;
      const providerError = payload.chart?.error;

      if (providerError) {
        return createFailureResponse({
          symbol: input.symbol,
          sourceSymbol,
          startDate: input.startDate,
          endDate: input.endDate,
          code: resolveYahooErrorCode(providerError.code),
          message:
            providerError.description ||
            `Yahoo Finance could not load daily history for ${input.symbol}.`,
        });
      }

      const result = payload.chart?.result?.[0];

      if (!result) {
        return createFailureResponse({
          symbol: input.symbol,
          sourceSymbol,
          startDate: input.startDate,
          endDate: input.endDate,
          code: "provider_empty_response",
          message: `Yahoo Finance returned an empty chart result for ${input.symbol}.`,
        });
      }

      const prices = normalizeYahooResult(result);

      if (prices.length < 2) {
        return createFailureResponse({
          symbol: input.symbol,
          sourceSymbol,
          startDate: input.startDate,
          endDate: input.endDate,
          code: "provider_no_data",
          message: `Yahoo Finance returned insufficient daily close history for ${input.symbol}.`,
        });
      }

      return {
        symbol: input.symbol,
        provider: this.id,
        prices,
        warnings: [],
        metadata: {
          requestedStartDate: input.startDate,
          requestedEndDate: input.endDate,
          actualStartDate: prices[0].date,
          actualEndDate: prices[prices.length - 1].date,
          observations: prices.length,
          sourceSymbol,
        },
      };
    } catch (error) {
      return createFailureResponse({
        symbol: input.symbol,
        sourceSymbol,
        startDate: input.startDate,
        endDate: input.endDate,
        code: "provider_error",
        message: getErrorMessage(
          error,
          `Unable to load daily history for ${input.symbol} from Yahoo Finance.`,
        ),
      });
    }
  }
}

function normalizeYahooResult(result: YahooChartResult): PricePoint[] {
  const timestamps = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0];
  const adjustedClose = result.indicators?.adjclose?.[0]?.adjclose ?? [];

  if (timestamps.length === 0 || !quote?.close) {
    return [];
  }

  const pointsByDate = new Map<string, PricePoint>();

  timestamps.forEach((timestamp, index) => {
    const date = toIsoDate(timestamp);
    const close = quote.close?.[index];

    if (
      !date ||
      typeof close !== "number" ||
      !Number.isFinite(close) ||
      close <= 0
    ) {
      return;
    }

    const open = normalizeNumber(quote.open?.[index], { positive: true });
    const high = normalizeNumber(quote.high?.[index], { positive: true });
    const low = normalizeNumber(quote.low?.[index], { positive: true });
    const volume = normalizeNumber(quote.volume?.[index], { positive: false });
    const adjClose = normalizeNumber(adjustedClose[index], { positive: true });

    pointsByDate.set(date, {
      date,
      ...(open === undefined ? {} : { open }),
      ...(high === undefined ? {} : { high }),
      ...(low === undefined ? {} : { low }),
      close,
      ...(adjClose === undefined ? {} : { adjustedClose: adjClose }),
      ...(volume === undefined ? {} : { volume }),
    });
  });

  return [...pointsByDate.values()].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

function createFailureResponse(input: {
  symbol: string;
  sourceSymbol: string;
  startDate?: string;
  endDate?: string;
  code: string;
  message: string;
}): HistoricalPriceResponse {
  return {
    symbol: input.symbol,
    provider: "yahoo",
    prices: [],
    warnings: [
      createMarketDataWarning({
        symbol: input.symbol,
        provider: "yahoo",
        code: input.code,
        message: input.message,
      }),
    ],
    metadata: {
      requestedStartDate: input.startDate,
      requestedEndDate: input.endDate,
      observations: 0,
      sourceSymbol: input.sourceSymbol,
    },
  };
}

function toUnixSeconds(
  isoDate: string | undefined,
  options?: { addDays?: number },
): number | undefined {
  if (!isoDate) {
    return undefined;
  }

  const date = new Date(`${isoDate}T00:00:00Z`);

  if (!Number.isFinite(date.getTime())) {
    return undefined;
  }

  if (options?.addDays) {
    date.setUTCDate(date.getUTCDate() + options.addDays);
  }

  return Math.floor(date.getTime() / 1000);
}

function toIsoDate(timestamp: number): string | null {
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function normalizeNumber(
  value: number | null | undefined,
  options: { positive: boolean },
): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  if (options.positive && (!value || value <= 0)) {
    return undefined;
  }

  if (!options.positive && value !== undefined && value !== null && value < 0) {
    return undefined;
  }

  return value;
}

function resolveYahooErrorCode(code: string | undefined): string {
  const normalized = code?.toLowerCase() ?? "";

  if (normalized.includes("not found") || normalized.includes("invalid")) {
    return "invalid_symbol";
  }

  return "provider_error";
}
