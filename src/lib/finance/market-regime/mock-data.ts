import type {
  MarketRegimePriceSeries,
  MarketRegimeTicker,
} from "@/lib/finance/market-regime/types";
import { MARKET_REGIME_TICKER_CONFIG } from "@/lib/finance/market-regime/types";

const MOCK_OBSERVATIONS = 390;

const MOCK_SERIES_CONFIG: Record<
  MarketRegimeTicker,
  {
    start: number;
    end: number;
    amplitude: number;
    phase: number;
  }
> = {
  SPY: { start: 430, end: 525, amplitude: 10, phase: 0 },
  QQQ: { start: 360, end: 465, amplitude: 12, phase: 0.7 },
  VIX: { start: 22, end: 16, amplitude: 2.6, phase: 1.4 },
  HYG: { start: 74, end: 80, amplitude: 1.1, phase: 0.4 },
  LQD: { start: 103, end: 107, amplitude: 1.3, phase: 1.1 },
  TLT: { start: 92, end: 88, amplitude: 2.5, phase: 2.2 },
  IEF: { start: 95, end: 96, amplitude: 0.8, phase: 2.8 },
};

export function buildMockMarketRegimeSeries(
  referenceDate: Date = new Date(),
): MarketRegimePriceSeries[] {
  const dates = buildMockTradingDates(MOCK_OBSERVATIONS, referenceDate);

  return MARKET_REGIME_TICKER_CONFIG.map((config) => {
    const model = MOCK_SERIES_CONFIG[config.ticker];

    return {
      ticker: config.ticker,
      sourceSymbol: config.fetchSymbol,
      points: dates.map((date, index) => {
        const progress = index / Math.max(dates.length - 1, 1);
        const trend = model.start + (model.end - model.start) * progress;
        const cycle =
          Math.sin(progress * Math.PI * 7 + model.phase) * model.amplitude;
        const close = Math.max(1, trend + cycle);

        return {
          date,
          close: Number(close.toFixed(4)),
        };
      }),
    };
  });
}

function buildMockTradingDates(
  observations: number,
  referenceDate: Date,
): string[] {
  const dates: string[] = [];
  const cursor = new Date(referenceDate);

  while (dates.length < observations) {
    const day = cursor.getUTCDay();

    if (day !== 0 && day !== 6) {
      dates.push(cursor.toISOString().slice(0, 10));
    }

    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return dates.reverse();
}

