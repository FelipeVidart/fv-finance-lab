import type { MarketDataProvider } from "@/lib/market-data/provider";
import type { HistoricalPriceSeries } from "@/lib/market-data/types";

const TWELVE_DATA_BASE_URL = "https://api.twelvedata.com/time_series";

type TwelveDataValue = {
  datetime?: string;
  close?: string;
};

type TwelveDataResponse = {
  status?: string;
  code?: number;
  message?: string;
  values?: TwelveDataValue[];
};

export class TwelveDataMarketDataProvider implements MarketDataProvider {
  readonly id = "twelve-data";

  async getDailySeries(input: {
    tickers: string[];
    startDate: string;
    endDate: string;
  }): Promise<HistoricalPriceSeries[]> {
    const apiKey = process.env.TWELVE_DATA_API_KEY;

    if (!apiKey) {
      throw new Error(
        "The TWELVE_DATA_API_KEY environment variable is not set on the server.",
      );
    }

    const seriesResults = await Promise.allSettled(
      input.tickers.map((ticker) =>
        this.fetchTickerSeries({
          ticker,
          apiKey,
          startDate: input.startDate,
          endDate: input.endDate,
        }),
      ),
    );

    const rejected = seriesResults.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    if (rejected) {
      throw rejected.reason;
    }

    return seriesResults.map((result) => {
      if (result.status !== "fulfilled") {
        throw new Error("Unexpected market data promise state.");
      }

      return result.value;
    });
  }

  private async fetchTickerSeries(input: {
    ticker: string;
    apiKey: string;
    startDate: string;
    endDate: string;
  }): Promise<HistoricalPriceSeries> {
    const url = new URL(TWELVE_DATA_BASE_URL);

    url.searchParams.set("symbol", input.ticker);
    url.searchParams.set("interval", "1day");
    url.searchParams.set("start_date", input.startDate);
    url.searchParams.set("end_date", input.endDate);
    url.searchParams.set("order", "asc");
    url.searchParams.set("adjust", "all");
    url.searchParams.set("apikey", input.apiKey);

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Market data request failed for ${input.ticker} with status ${response.status}.`,
      );
    }

    const payload = (await response.json()) as TwelveDataResponse;

    if (payload.status === "error" || !payload.values) {
      throw new Error(
        payload.message ||
          `Unable to load daily history for ${input.ticker} from Twelve Data.`,
      );
    }

    const points = payload.values
      .map((value) => {
        const close = Number(value.close);

        if (!value.datetime || !Number.isFinite(close) || close <= 0) {
          return null;
        }

        return {
          date: value.datetime,
          close,
        };
      })
      .filter((value): value is { date: string; close: number } => value !== null);

    if (points.length < 2) {
      throw new Error(
        `Insufficient daily history returned for ${input.ticker}. Try a different ticker or longer period.`,
      );
    }

    return {
      ticker: input.ticker,
      points,
    };
  }
}
