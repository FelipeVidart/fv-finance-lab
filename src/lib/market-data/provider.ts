import { TwelveDataMarketDataProvider } from "@/lib/market-data/twelve-data";

export interface MarketDataProvider {
  readonly id: string;
  getDailySeries(input: {
    tickers: string[];
    startDate: string;
    endDate: string;
  }): Promise<
    Array<{
      ticker: string;
      points: Array<{
        date: string;
        close: number;
      }>;
    }>
  >;
}

export function getMarketDataProvider(): MarketDataProvider {
  return new TwelveDataMarketDataProvider();
}
