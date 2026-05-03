import { calculateDailyReturns } from "@/lib/finance/returns";
import type {
  PortfolioAssetAnalytics,
  PortfolioAssetInput,
  PortfolioPerformancePoint,
  PortfolioValidationResult,
} from "@/lib/finance/portfolio/types";
import type { MarketDataExplorerPayload } from "@/lib/market-data/types";

const WEIGHT_TOLERANCE_PERCENT = 0.05;

export function validatePortfolioInputs(input: {
  initialCapital: number;
  assets: PortfolioAssetInput[];
}): PortfolioValidationResult {
  if (!Number.isFinite(input.initialCapital) || input.initialCapital <= 0) {
    return {
      isValid: false,
      totalWeight: sumWeights(input.assets),
      error: "Initial capital must be greater than zero.",
    };
  }

  if (input.assets.length === 0) {
    return {
      isValid: false,
      totalWeight: 0,
      error: "Add at least one ETF ticker.",
    };
  }

  const normalizedAssets = input.assets.map((asset) => ({
    ...asset,
    ticker: asset.ticker.trim().toUpperCase(),
    assetClass: asset.assetClass.trim() || "Unclassified",
  }));

  const invalidTicker = normalizedAssets.find((asset) => asset.ticker === "");

  if (invalidTicker) {
    return {
      isValid: false,
      totalWeight: sumWeights(normalizedAssets),
      error: "Every ETF row needs a ticker.",
    };
  }

  const invalidWeight = normalizedAssets.find(
    (asset) => !Number.isFinite(asset.weight) || asset.weight <= 0,
  );

  if (invalidWeight) {
    return {
      isValid: false,
      totalWeight: sumWeights(normalizedAssets),
      error: "Every ETF weight must be positive.",
    };
  }

  const tickers = normalizedAssets.map((asset) => asset.ticker);
  const duplicateTicker = tickers.find(
    (ticker, index) => tickers.indexOf(ticker) !== index,
  );

  if (duplicateTicker) {
    return {
      isValid: false,
      totalWeight: sumWeights(normalizedAssets),
      error: `Ticker ${duplicateTicker} appears more than once.`,
    };
  }

  const totalWeight = sumWeights(normalizedAssets);

  if (Math.abs(totalWeight - 100) > WEIGHT_TOLERANCE_PERCENT) {
    return {
      isValid: false,
      totalWeight,
      error: `Portfolio weights must sum to 100%. Current total: ${totalWeight.toFixed(
        2,
      )}%.`,
    };
  }

  return {
    isValid: true,
    totalWeight,
    assets: normalizedAssets,
  };
}

export function calculatePortfolioDailyReturns(input: {
  data: MarketDataExplorerPayload;
  assets: PortfolioAssetInput[];
}): number[] {
  const weightByTicker = new Map(
    input.assets.map((asset) => [asset.ticker, asset.weight / 100] as const),
  );

  if (input.data.points.length < 2) {
    throw new Error(
      "Not enough overlapping daily history was found across the selected ETFs.",
    );
  }

  const assetReturnSeries = input.assets.map((asset) => {
    const prices = input.data.points.map((point) => point.prices[asset.ticker]);

    if (prices.some((price) => !Number.isFinite(price) || price <= 0)) {
      throw new Error(
        `Missing aligned price history for ${asset.ticker}. Try a different ticker or lookback window.`,
      );
    }

    return calculateDailyReturns(prices);
  });

  return assetReturnSeries[0].map((_, dayIndex) =>
    input.assets.reduce(
      (sum, asset, assetIndex) =>
        sum +
        (weightByTicker.get(asset.ticker) ?? 0) *
          assetReturnSeries[assetIndex][dayIndex],
      0,
    ),
  );
}

export function buildPortfolioPerformancePoints(input: {
  dates: string[];
  dailyReturns: number[];
  initialCapital: number;
}): PortfolioPerformancePoint[] {
  const balances = [input.initialCapital];

  for (const dailyReturn of input.dailyReturns) {
    balances.push(balances[balances.length - 1] * (1 + dailyReturn));
  }

  return input.dates.map((date, index) => ({
    date,
    balance: balances[index],
    cumulativeReturn: balances[index] / input.initialCapital - 1,
  }));
}

export function buildPortfolioAssetAnalytics(input: {
  data: MarketDataExplorerPayload;
  assets: PortfolioAssetInput[];
}): PortfolioAssetAnalytics[] {
  return input.assets.map((asset) => {
    const metric = input.data.metrics.find(
      (entry) => entry.ticker === asset.ticker,
    );

    if (!metric) {
      throw new Error(`Missing market analytics for ${asset.ticker}.`);
    }

    return {
      ...asset,
      startDate: metric.startDate,
      endDate: metric.endDate,
      cumulativeReturn: metric.totalReturn,
      annualizedVolatility: metric.annualizedVolatility,
    };
  });
}

function sumWeights(assets: PortfolioAssetInput[]): number {
  return assets.reduce((sum, asset) => sum + asset.weight, 0);
}
