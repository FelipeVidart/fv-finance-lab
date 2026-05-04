import { createMarketDataWarning, getErrorMessage } from "@/lib/market-data/errors";
import type { MarketDataProvider } from "@/lib/market-data/providers/types";
import type {
  HistoricalPriceResponse,
  PricePoint,
} from "@/lib/market-data/types";

const TWELVE_DATA_BASE_URL = "https://api.twelvedata.com/time_series";

type TwelveDataValue = {
  datetime?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
};

type TwelveDataResponse = {
  status?: string;
  code?: number;
  message?: string;
  values?: TwelveDataValue[];
};

export class TwelveDataHistoricalPriceProvider implements MarketDataProvider {
  readonly id = "twelveData" as const;
  readonly label = "Twelve Data";
  readonly supports = {
    dailyHistorical: true,
    dateRange: true,
    batch: false,
    requiresApiKey: true,
  };

  async getHistoricalPrices(input: {
    symbol: string;
    startDate?: string;
    endDate?: string;
    interval: "1day";
  }): Promise<HistoricalPriceResponse> {
    const apiKey = process.env.TWELVE_DATA_API_KEY;

    if (!apiKey) {
      return createFailureResponse({
        symbol: input.symbol,
        sourceSymbol: input.symbol,
        startDate: input.startDate,
        endDate: input.endDate,
        code: "missing_api_key",
        message:
          "The TWELVE_DATA_API_KEY environment variable is not set on the server.",
      });
    }

    try {
      const url = new URL(TWELVE_DATA_BASE_URL);

      url.searchParams.set("symbol", input.symbol);
      url.searchParams.set("interval", "1day");
      url.searchParams.set("order", "asc");
      url.searchParams.set("adjust", "all");
      url.searchParams.set("apikey", apiKey);

      if (input.startDate) {
        url.searchParams.set("start_date", input.startDate);
      }

      if (input.endDate) {
        url.searchParams.set("end_date", input.endDate);
      }

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return createFailureResponse({
          symbol: input.symbol,
          sourceSymbol: input.symbol,
          startDate: input.startDate,
          endDate: input.endDate,
          code: response.status === 429 ? "provider_rate_limit" : "provider_http_error",
          message: `Twelve Data request failed for ${input.symbol} with status ${response.status}.`,
        });
      }

      const payload = (await response.json()) as TwelveDataResponse;

      if (payload.status === "error" || !payload.values) {
        return createFailureResponse({
          symbol: input.symbol,
          sourceSymbol: input.symbol,
          startDate: input.startDate,
          endDate: input.endDate,
          code: resolveTwelveDataErrorCode(payload),
          message:
            payload.message ||
            `Unable to load daily history for ${input.symbol} from Twelve Data.`,
        });
      }

      const prices = normalizeTwelveDataValues(payload.values);

      if (prices.length < 2) {
        return createFailureResponse({
          symbol: input.symbol,
          sourceSymbol: input.symbol,
          startDate: input.startDate,
          endDate: input.endDate,
          code: "provider_no_data",
          message: `Twelve Data returned insufficient daily close history for ${input.symbol}.`,
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
          sourceSymbol: input.symbol,
        },
      };
    } catch (error) {
      return createFailureResponse({
        symbol: input.symbol,
        sourceSymbol: input.symbol,
        startDate: input.startDate,
        endDate: input.endDate,
        code: "provider_error",
        message: getErrorMessage(
          error,
          `Unable to load daily history for ${input.symbol} from Twelve Data.`,
        ),
      });
    }
  }
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
    provider: "twelveData",
    prices: [],
    warnings: [
      createMarketDataWarning({
        symbol: input.symbol,
        provider: "twelveData",
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

function normalizeTwelveDataValues(values: TwelveDataValue[]): PricePoint[] {
  const pointsByDate = new Map<string, PricePoint>();

  for (const value of values) {
    const close = Number(value.close);

    if (!value.datetime || !Number.isFinite(close) || close <= 0) {
      continue;
    }

    const open = parsePositiveNumber(value.open);
    const high = parsePositiveNumber(value.high);
    const low = parsePositiveNumber(value.low);
    const volume = parseNonNegativeNumber(value.volume);

    pointsByDate.set(value.datetime, {
      date: value.datetime,
      ...(open === undefined ? {} : { open }),
      ...(high === undefined ? {} : { high }),
      ...(low === undefined ? {} : { low }),
      close,
      adjustedClose: close,
      ...(volume === undefined ? {} : { volume }),
    });
  }

  return [...pointsByDate.values()].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

function resolveTwelveDataErrorCode(payload: TwelveDataResponse): string {
  const message = payload.message?.toLowerCase() ?? "";

  if (message.includes("rate limit") || payload.code === 429) {
    return "provider_rate_limit";
  }

  if (message.includes("symbol") || message.includes("not found")) {
    return "invalid_symbol";
  }

  return "provider_error";
}

function parsePositiveNumber(value: string | undefined): number | undefined {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseNonNegativeNumber(value: string | undefined): number | undefined {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}
