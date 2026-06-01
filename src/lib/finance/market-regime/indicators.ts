import { calculateDailyReturns } from "@/lib/finance/returns";
import { calculateAnnualizedVolatility } from "@/lib/finance/metrics";
import type {
  MarketRegimeAlignedPoint,
  MarketRegimeBlockId,
  MarketRegimePriceSeries,
  MarketRegimeTicker,
} from "@/lib/finance/market-regime/types";
import { MARKET_REGIME_TICKER_CONFIG } from "@/lib/finance/market-regime/types";

export const MARKET_REGIME_LOOKBACK_MONTHS = 18;
export const MARKET_REGIME_MIN_OBSERVATIONS = 253;
export const ONE_MONTH_TRADING_DAYS = 21;
export const THREE_MONTH_TRADING_DAYS = 63;
export const SMA_50_DAYS = 50;
export const SMA_200_DAYS = 200;
export const DRAWDOWN_LOOKBACK_DAYS = 252;
export const VIX_AVERAGE_DAYS = 60;
export const REALIZED_VOLATILITY_DAYS = 20;

export const MARKET_REGIME_BLOCK_DEFINITIONS = [
  {
    id: "equityTrend",
    label: "Equity Trend",
    weight: 0.3,
  },
  {
    id: "riskMomentum",
    label: "Risk Momentum",
    weight: 0.2,
  },
  {
    id: "volatility",
    label: "Volatility",
    weight: 0.2,
  },
  {
    id: "creditConditions",
    label: "Credit Conditions",
    weight: 0.2,
  },
  {
    id: "ratesDuration",
    label: "Rates / Duration",
    weight: 0.1,
  },
] as const satisfies readonly {
  id: MarketRegimeBlockId;
  label: string;
  weight: number;
}[];

export function getMarketRegimeFetchSymbols(): string[] {
  return MARKET_REGIME_TICKER_CONFIG.map((entry) => entry.fetchSymbol);
}

export function resolveMarketRegimeDateRange(
  referenceDate: Date = new Date(),
): { startDate: string; endDate: string } {
  const endDate = toIsoDate(referenceDate);
  const startDate = new Date(referenceDate);

  startDate.setUTCMonth(
    startDate.getUTCMonth() - MARKET_REGIME_LOOKBACK_MONTHS,
  );

  return {
    startDate: toIsoDate(startDate),
    endDate,
  };
}

export function alignMarketRegimeSeries(
  series: MarketRegimePriceSeries[],
): MarketRegimeAlignedPoint[] {
  const seriesByTicker = new Map(
    series.map((entry) => [entry.ticker, entry] as const),
  );

  for (const config of MARKET_REGIME_TICKER_CONFIG) {
    const entry = seriesByTicker.get(config.ticker);

    if (!entry || entry.points.length < MARKET_REGIME_MIN_OBSERVATIONS) {
      throw new Error(
        `${config.ticker} needs at least ${MARKET_REGIME_MIN_OBSERVATIONS} aligned observations for the market regime model.`,
      );
    }
  }

  const pointMaps = new Map(
    MARKET_REGIME_TICKER_CONFIG.map((config) => {
      const entry = seriesByTicker.get(config.ticker);
      const pointMap = new Map(
        entry?.points.map((point) => [point.date, point.close] as const) ?? [],
      );

      return [config.ticker, pointMap] as const;
    }),
  );
  const sharedDates = MARKET_REGIME_TICKER_CONFIG.reduce<Set<string> | null>(
    (current, config) => {
      const dates = new Set(pointMaps.get(config.ticker)?.keys() ?? []);

      if (current === null) {
        return dates;
      }

      return new Set([...current].filter((date) => dates.has(date)));
    },
    null,
  );
  const sortedDates = [...(sharedDates ?? new Set<string>())].sort((left, right) =>
    left.localeCompare(right),
  );

  if (sortedDates.length < MARKET_REGIME_MIN_OBSERVATIONS) {
    throw new Error(
      `Only ${sortedDates.length} shared observations were available. The model needs at least ${MARKET_REGIME_MIN_OBSERVATIONS}.`,
    );
  }

  return sortedDates.map((date) => {
    const prices = {} as Record<MarketRegimeTicker, number>;

    for (const config of MARKET_REGIME_TICKER_CONFIG) {
      const close = pointMaps.get(config.ticker)?.get(date);

      if (!close || close <= 0) {
        throw new Error(`Missing valid ${config.ticker} close for ${date}.`);
      }

      prices[config.ticker] = close;
    }

    return { date, prices };
  });
}

export function getTickerPrices(
  points: MarketRegimeAlignedPoint[],
  ticker: MarketRegimeTicker,
): number[] {
  return points.map((point) => point.prices[ticker]);
}

export function calculateLookbackReturn(
  prices: number[],
  tradingDays: number,
): number {
  if (prices.length <= tradingDays) {
    throw new Error(`Need more than ${tradingDays} prices to calculate return.`);
  }

  const latest = prices[prices.length - 1];
  const previous = prices[prices.length - 1 - tradingDays];

  if (!previous || previous <= 0) {
    throw new Error("Invalid prior price for return calculation.");
  }

  return latest / previous - 1;
}

export function calculateSimpleMovingAverage(
  prices: number[],
  windowSize: number,
): number {
  if (prices.length < windowSize) {
    throw new Error(`Need ${windowSize} prices to calculate SMA.`);
  }

  const window = prices.slice(-windowSize);

  return window.reduce((sum, value) => sum + value, 0) / window.length;
}

export function calculateDrawdownFromHigh(
  prices: number[],
  windowSize: number,
): number {
  if (prices.length < windowSize) {
    throw new Error(`Need ${windowSize} prices to calculate drawdown.`);
  }

  const window = prices.slice(-windowSize);
  const high = Math.max(...window);
  const latest = prices[prices.length - 1];

  if (!high || high <= 0) {
    throw new Error("Invalid high-water mark for drawdown calculation.");
  }

  return latest / high - 1;
}

export function calculateRealizedVolatility(
  prices: number[],
  windowSize: number,
): number {
  const returns = calculateDailyReturns(prices).slice(-windowSize);

  if (returns.length < windowSize) {
    throw new Error(`Need ${windowSize} daily returns to calculate volatility.`);
  }

  return calculateAnnualizedVolatility(returns);
}

export function scoreRange(
  value: number,
  bearishThreshold: number,
  bullishThreshold: number,
): number {
  if (bullishThreshold === bearishThreshold) {
    return 0;
  }

  const normalized =
    ((value - bearishThreshold) / (bullishThreshold - bearishThreshold)) * 2 -
    1;

  return clampScore(normalized);
}

export function scoreInverseRange(
  value: number,
  bullishThreshold: number,
  bearishThreshold: number,
): number {
  if (bullishThreshold === bearishThreshold) {
    return 0;
  }

  const normalized =
    ((bearishThreshold - value) / (bearishThreshold - bullishThreshold)) * 2 -
    1;

  return clampScore(normalized);
}

export function clampScore(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

export function formatPercent(value: number, digits: number = 1): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(digits)}%`;
}

export function formatUnsignedPercent(
  value: number,
  digits: number = 1,
): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatNumber(value: number, digits: number = 1): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

