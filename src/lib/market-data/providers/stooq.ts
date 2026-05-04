import { createMarketDataWarning, getErrorMessage } from "@/lib/market-data/errors";
import { resolveStooqSymbol } from "@/lib/market-data/symbols";
import type { MarketDataProvider } from "@/lib/market-data/providers/types";
import type {
  HistoricalPriceResponse,
  PricePoint,
} from "@/lib/market-data/types";

const STOOQ_BASE_URL = "https://stooq.com/q/d/l/";
const STOOQ_API_KEY_MESSAGE_PATTERN = /get your apikey|uzyskaj apikey/i;

export class StooqMarketDataProvider implements MarketDataProvider {
  readonly id = "stooq" as const;
  readonly label = "Stooq";
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
    const sourceSymbol = resolveStooqSymbol(input.symbol);
    const apiKey = process.env.STOOQ_API_KEY;

    if (!apiKey) {
      return createFailureResponse({
        symbol: input.symbol,
        sourceSymbol,
        startDate: input.startDate,
        endDate: input.endDate,
        code: "missing_api_key",
        message: "Stooq requires an API key for CSV downloads.",
      });
    }

    try {
      const url = new URL(STOOQ_BASE_URL);

      url.searchParams.set("s", sourceSymbol);
      url.searchParams.set("i", "d");

      if (input.startDate) {
        url.searchParams.set("d1", toStooqDate(input.startDate));
      }

      if (input.endDate) {
        url.searchParams.set("d2", toStooqDate(input.endDate));
      }

      url.searchParams.set("apikey", apiKey);

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "text/csv,text/plain",
        },
      });

      if (!response.ok) {
        return createFailureResponse({
          symbol: input.symbol,
          sourceSymbol,
          startDate: input.startDate,
          endDate: input.endDate,
          code: "provider_http_error",
          message: `Stooq request failed for ${input.symbol} with status ${response.status}.`,
        });
      }

      const csv = await response.text();
      const invalidCsvReason = getInvalidCsvReason(csv);

      if (invalidCsvReason) {
        return createFailureResponse({
          symbol: input.symbol,
          sourceSymbol,
          startDate: input.startDate,
          endDate: input.endDate,
          code: invalidCsvReason.code,
          message: invalidCsvReason.message(input.symbol),
        });
      }

      const prices = parseStooqCsv(csv);

      if (prices.length < 2) {
        return createFailureResponse({
          symbol: input.symbol,
          sourceSymbol,
          startDate: input.startDate,
          endDate: input.endDate,
          code: "provider_no_data",
          message: `Stooq returned no usable daily close history for ${input.symbol}.`,
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
          `Unable to load daily history for ${input.symbol} from Stooq.`,
        ),
      });
    }
  }
}

export function buildStooqDownloadUrl(input: {
  symbol: string;
  startDate?: string;
  endDate?: string;
  includeApiKeyPlaceholder?: boolean;
}): string {
  const url = new URL(STOOQ_BASE_URL);

  url.searchParams.set("s", resolveStooqSymbol(input.symbol));
  url.searchParams.set("i", "d");

  if (input.startDate) {
    url.searchParams.set("d1", toStooqDate(input.startDate));
  }

  if (input.endDate) {
    url.searchParams.set("d2", toStooqDate(input.endDate));
  }

  if (input.includeApiKeyPlaceholder) {
    url.searchParams.set("apikey", "<server-side>");
  }

  return url.toString();
}

export function isStooqConfigured(): boolean {
  return Boolean(process.env.STOOQ_API_KEY);
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
    provider: "stooq",
    prices: [],
    warnings: [
      createMarketDataWarning({
        symbol: input.symbol,
        provider: "stooq",
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

function parseStooqCsv(csv: string): PricePoint[] {
  const trimmed = csv.trim();

  if (getInvalidCsvReason(trimmed)) {
    return [];
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
  const dateIndex = headers.indexOf("date");
  const openIndex = headers.indexOf("open");
  const highIndex = headers.indexOf("high");
  const lowIndex = headers.indexOf("low");
  const closeIndex = headers.indexOf("close");
  const volumeIndex = headers.indexOf("volume");

  if (dateIndex === -1 || closeIndex === -1) {
    return [];
  }

  const pointsByDate = new Map<string, PricePoint>();

  for (const line of lines.slice(1)) {
    const columns = line.split(",").map((value) => value.trim());
    const date = columns[dateIndex];
    const openRaw = openIndex === -1 ? undefined : columns[openIndex];
    const highRaw = highIndex === -1 ? undefined : columns[highIndex];
    const lowRaw = lowIndex === -1 ? undefined : columns[lowIndex];
    const closeRaw = columns[closeIndex];
    const volumeRaw = volumeIndex === -1 ? undefined : columns[volumeIndex];
    const close = Number(closeRaw);

    if (!isIsoDate(date) || !Number.isFinite(close) || close <= 0) {
      continue;
    }

    const open = parsePositiveNumber(openRaw);
    const high = parsePositiveNumber(highRaw);
    const low = parsePositiveNumber(lowRaw);
    const volume = parseNonNegativeNumber(volumeRaw);

    pointsByDate.set(date, {
      date,
      ...(open === undefined ? {} : { open }),
      ...(high === undefined ? {} : { high }),
      ...(low === undefined ? {} : { low }),
      close,
      ...(volume === undefined ? {} : { volume }),
    });
  }

  return [...pointsByDate.values()].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

function toStooqDate(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.replaceAll("-", "") : value;
}

function getInvalidCsvReason(csv: string): {
  code: string;
  message: (symbol: string) => string;
} | null {
  const trimmed = csv.trim();

  if (!trimmed) {
    return {
      code: "provider_empty_response",
      message: (symbol) => `Stooq returned an empty CSV response for ${symbol}.`,
    };
  }

  if (STOOQ_API_KEY_MESSAGE_PATTERN.test(trimmed)) {
    return {
      code: "provider_requires_api_key",
      message: () => "Stooq requires an API key for CSV downloads.",
    };
  }

  if (/no\s*data/i.test(trimmed)) {
    return {
      code: "provider_no_data",
      message: (symbol) => `Stooq returned no data for ${symbol}.`,
    };
  }

  return null;
}

function isIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function parsePositiveNumber(value: string | undefined): number | undefined {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseNonNegativeNumber(value: string | undefined): number | undefined {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}
