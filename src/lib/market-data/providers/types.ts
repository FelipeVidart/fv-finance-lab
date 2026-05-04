import type {
  HistoricalPriceResponse,
  MarketDataProviderId,
} from "@/lib/market-data/types";

export type ProviderHistoricalPriceRequest = {
  symbol: string;
  startDate?: string;
  endDate?: string;
  interval: "1day";
};

export type MarketDataProvider = {
  readonly id: MarketDataProviderId;
  readonly label: string;
  readonly supports: {
    dailyHistorical: boolean;
    dateRange: boolean;
    batch: boolean;
    requiresApiKey: boolean;
  };
  getHistoricalPrices(
    request: ProviderHistoricalPriceRequest,
  ): Promise<HistoricalPriceResponse>;
};
