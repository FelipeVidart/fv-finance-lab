import { calculateMaxDrawdown } from "@/lib/finance/drawdown";
import { calculateAnnualizedVolatility } from "@/lib/finance/metrics";
import {
  calculateDailyReturns,
  calculateTotalReturn,
} from "@/lib/finance/returns";
import type {
  BatchHistoricalPriceResponse,
  HistoricalPriceResponse,
  MarketDataProviderDiagnostic,
  MarketDataProviderId,
  MarketDataWarning,
} from "@/lib/market-data/types";

export const SECTOR_ROTATION_BENCHMARK = "SPY";
export const SECTOR_ROTATION_PERIOD = "1Y";

const ONE_MONTH_TRADING_DAYS = 21;
const THREE_MONTH_TRADING_DAYS = 63;
const SIX_MONTH_TRADING_DAYS = 126;
const MOVING_AVERAGE_DAYS = 50;
const MINIMUM_OBSERVATIONS = THREE_MONTH_TRADING_DAYS + 1;

export type SectorRotationTicker =
  | "XLK"
  | "XLF"
  | "XLE"
  | "XLV"
  | "XLI"
  | "XLY"
  | "XLP"
  | "XLU"
  | "XLRE"
  | "XLB"
  | "XLC";

export type SectorRotationSignal =
  | "Strong Leader"
  | "Leader"
  | "Neutral"
  | "Laggard"
  | "Weak Laggard";

export type SectorRotationBucket =
  | "offensive"
  | "defensive"
  | "rateSensitive"
  | "inflationSensitive";

export type SectorRotationDefinition = {
  ticker: SectorRotationTicker;
  name: string;
  buckets: SectorRotationBucket[];
};

export type SectorRotationRow = {
  ticker: SectorRotationTicker;
  name: string;
  score: number;
  signal: SectorRotationSignal;
  oneMonthReturn: number;
  threeMonthReturn: number;
  sixMonthReturn: number;
  relativeThreeMonthReturn: number;
  distanceToMa50: number;
  threeMonthVolatility: number;
  sixMonthMaxDrawdown: number;
  latestPrice: number;
};

export type SectorRotationInterpretation = {
  title: string;
  observations: string[];
  caveat: string;
};

export type SectorRotationDashboard = {
  sectors: SectorRotationRow[];
  leaders: SectorRotationRow[];
  laggards: SectorRotationRow[];
  benchmark: {
    ticker: typeof SECTOR_ROTATION_BENCHMARK;
    threeMonthReturn: number;
    latestPrice: number;
  };
  interpretation: SectorRotationInterpretation;
  meta: {
    commonStartDate: string;
    commonEndDate: string;
    observations: number;
    warnings: MarketDataWarning[];
    providerDiagnostics: MarketDataProviderDiagnostic[];
    providers: MarketDataProviderId[];
    cache: {
      hits: number;
      misses: number;
    };
    dataNotes: string[];
  };
};

type RawSectorMetrics = Omit<SectorRotationRow, "score" | "signal">;

export const SECTOR_ROTATION_ETFS: SectorRotationDefinition[] = [
  {
    ticker: "XLK",
    name: "Technology",
    buckets: ["offensive", "rateSensitive"],
  },
  { ticker: "XLF", name: "Financials", buckets: ["offensive"] },
  {
    ticker: "XLE",
    name: "Energy",
    buckets: ["inflationSensitive"],
  },
  { ticker: "XLV", name: "Healthcare", buckets: ["defensive"] },
  { ticker: "XLI", name: "Industrials", buckets: ["offensive"] },
  {
    ticker: "XLY",
    name: "Consumer Discretionary",
    buckets: ["offensive"],
  },
  { ticker: "XLP", name: "Consumer Staples", buckets: ["defensive"] },
  {
    ticker: "XLU",
    name: "Utilities",
    buckets: ["defensive", "rateSensitive"],
  },
  {
    ticker: "XLRE",
    name: "Real Estate",
    buckets: ["rateSensitive"],
  },
  {
    ticker: "XLB",
    name: "Materials",
    buckets: ["offensive", "inflationSensitive"],
  },
  {
    ticker: "XLC",
    name: "Communication Services",
    buckets: ["offensive"],
  },
];

export const SECTOR_ROTATION_SYMBOLS = [
  ...SECTOR_ROTATION_ETFS.map((sector) => sector.ticker),
  SECTOR_ROTATION_BENCHMARK,
] as const;

export function buildSectorRotationDashboard(
  batch: BatchHistoricalPriceResponse,
): SectorRotationDashboard {
  const missingSymbols = SECTOR_ROTATION_SYMBOLS.filter(
    (symbol) => !batch.results[symbol],
  );

  if (missingSymbols.length > 0 || batch.missingSymbols.length > 0) {
    const symbols = [...new Set([...missingSymbols, ...batch.missingSymbols])];

    throw new Error(
      `Missing required sector rotation data for ${symbols.join(", ")}.`,
    );
  }

  const historicalSeries = Object.fromEntries(
    SECTOR_ROTATION_SYMBOLS.map((symbol) => [
      symbol,
      normalizeHistoricalPrices(batch.results[symbol]),
    ]),
  ) as Record<(typeof SECTOR_ROTATION_SYMBOLS)[number], HistoricalPoint[]>;
  const sharedDates = findSharedDates(Object.values(historicalSeries));

  if (sharedDates.length < MINIMUM_OBSERVATIONS) {
    throw new Error(
      `Insufficient shared history for sector rotation. Need at least ${MINIMUM_OBSERVATIONS} aligned observations, found ${sharedDates.length}.`,
    );
  }

  const alignedPrices = Object.fromEntries(
    SECTOR_ROTATION_SYMBOLS.map((symbol) => [
      symbol,
      alignPricesToDates(historicalSeries[symbol], sharedDates),
    ]),
  ) as Record<(typeof SECTOR_ROTATION_SYMBOLS)[number], number[]>;
  const benchmarkPrices = alignedPrices[SECTOR_ROTATION_BENCHMARK];
  const benchmarkThreeMonthReturn = calculateTrailingReturn(
    benchmarkPrices,
    THREE_MONTH_TRADING_DAYS,
  );
  const rawRows = SECTOR_ROTATION_ETFS.map((definition) => {
    const prices = alignedPrices[definition.ticker];
    const threeMonthReturn = calculateTrailingReturn(
      prices,
      THREE_MONTH_TRADING_DAYS,
    );

    return {
      ticker: definition.ticker,
      name: definition.name,
      oneMonthReturn: calculateTrailingReturn(prices, ONE_MONTH_TRADING_DAYS),
      threeMonthReturn,
      sixMonthReturn: calculateTrailingReturn(prices, SIX_MONTH_TRADING_DAYS),
      relativeThreeMonthReturn: threeMonthReturn - benchmarkThreeMonthReturn,
      distanceToMa50: calculateMovingAverageDistance(
        prices,
        MOVING_AVERAGE_DAYS,
      ),
      threeMonthVolatility: calculateTrailingAnnualizedVolatility(
        prices,
        THREE_MONTH_TRADING_DAYS,
      ),
      sixMonthMaxDrawdown: calculateMaxDrawdown(
        getTrailingPrices(prices, SIX_MONTH_TRADING_DAYS),
      ),
      latestPrice: prices[prices.length - 1],
    };
  });
  const sectors = scoreSectorRows(rawRows);
  const leaders = sectors.slice(0, 3);
  const laggards = sectors.slice(-3).reverse();

  return {
    sectors,
    leaders,
    laggards,
    benchmark: {
      ticker: SECTOR_ROTATION_BENCHMARK,
      threeMonthReturn: benchmarkThreeMonthReturn,
      latestPrice: benchmarkPrices[benchmarkPrices.length - 1],
    },
    interpretation: buildInterpretation(sectors),
    meta: {
      commonStartDate: sharedDates[0],
      commonEndDate: sharedDates[sharedDates.length - 1],
      observations: sharedDates.length,
      warnings: batch.warnings,
      providerDiagnostics: batch.providerDiagnostics,
      providers: summarizeProviders(batch.providerDiagnostics),
      cache: summarizeCache(batch.providerDiagnostics),
      dataNotes: buildDataNotes(sharedDates.length, batch.warnings.length),
    },
  };
}

export function classifySectorSignal(score: number): SectorRotationSignal {
  if (score >= 75) {
    return "Strong Leader";
  }

  if (score >= 60) {
    return "Leader";
  }

  if (score >= 40) {
    return "Neutral";
  }

  if (score >= 25) {
    return "Laggard";
  }

  return "Weak Laggard";
}

function scoreSectorRows(rows: RawSectorMetrics[]): SectorRotationRow[] {
  const oneMonthScores = buildRankPercentiles(
    rows,
    (row) => row.oneMonthReturn,
    true,
  );
  const threeMonthScores = buildRankPercentiles(
    rows,
    (row) => row.threeMonthReturn,
    true,
  );
  const sixMonthScores = buildRankPercentiles(
    rows,
    (row) => row.sixMonthReturn,
    true,
  );
  const relativeScores = buildRankPercentiles(
    rows,
    (row) => row.relativeThreeMonthReturn,
    true,
  );
  const maScores = buildRankPercentiles(
    rows,
    (row) => row.distanceToMa50,
    true,
  );
  const volatilityScores = buildRankPercentiles(
    rows,
    (row) => row.threeMonthVolatility,
    false,
  );
  const drawdownScores = buildRankPercentiles(
    rows,
    (row) => Math.abs(row.sixMonthMaxDrawdown),
    false,
  );

  return rows
    .map((row) => {
      const score = clampScore(
        Math.round(
          100 *
            (0.15 * oneMonthScores[row.ticker] +
              0.25 * threeMonthScores[row.ticker] +
              0.25 * sixMonthScores[row.ticker] +
              0.2 * relativeScores[row.ticker] +
              0.1 * maScores[row.ticker] +
              0.025 * volatilityScores[row.ticker] +
              0.025 * drawdownScores[row.ticker]),
        ),
      );

      return {
        ...row,
        score,
        signal: classifySectorSignal(score),
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.relativeThreeMonthReturn !== left.relativeThreeMonthReturn) {
        return right.relativeThreeMonthReturn - left.relativeThreeMonthReturn;
      }

      return left.ticker.localeCompare(right.ticker);
    });
}

function buildInterpretation(
  sectors: SectorRotationRow[],
): SectorRotationInterpretation {
  const topThree = sectors.slice(0, 3);
  const topFourTickers = new Set(sectors.slice(0, 4).map((row) => row.ticker));
  const offensiveCount = topThree.filter((row) =>
    sectorHasBucket(row.ticker, "offensive"),
  ).length;
  const defensiveCount = topThree.filter((row) =>
    sectorHasBucket(row.ticker, "defensive"),
  ).length;
  const observations: string[] = [];
  const title =
    offensiveCount >= 2
      ? "Offensive / cyclical leadership"
      : defensiveCount >= 2
        ? "Defensive leadership"
        : "Mixed sector leadership";

  observations.push(
    offensiveCount >= 2
      ? "At least two of the top three sectors are offensive or cyclical groups."
      : defensiveCount >= 2
        ? "At least two of the top three sectors are defensive groups."
        : "The top three sectors do not cluster cleanly into one leadership bucket.",
  );

  if (topFourTickers.has("XLE") && topFourTickers.has("XLB")) {
    observations.push(
      "Commodity / inflation-sensitive leadership is present because XLE and XLB are both in the top four.",
    );
  }

  const realEstate = sectors.find((row) => row.ticker === "XLRE");
  const utilities = sectors.find((row) => row.ticker === "XLU");

  if (
    realEstate &&
    utilities &&
    realEstate.score >= 60 &&
    utilities.score >= 60
  ) {
    observations.push(
      "Rate-sensitive leadership is present because XLRE and XLU both score at least 60.",
    );
  }

  if (sectors[0] && sectors[1] && sectors[0].score - sectors[1].score >= 15) {
    observations.push(
      "Leadership is narrow because the top sector score is 15 or more points above the next sector.",
    );
  }

  const negativeThreeMonthReturns = sectors.filter(
    (row) => row.threeMonthReturn < 0,
  ).length;

  if (negativeThreeMonthReturns >= 7) {
    observations.push(
      "Weak sector breadth is present because at least seven sectors have negative 3M returns.",
    );
  }

  return {
    title,
    observations,
    caveat:
      "This is a market interpretation, not a forecast or investment advice.",
  };
}

function buildRankPercentiles(
  rows: RawSectorMetrics[],
  getValue: (row: RawSectorMetrics) => number,
  higherIsBetter: boolean,
): Record<SectorRotationTicker, number> {
  if (rows.length <= 1) {
    return Object.fromEntries(rows.map((row) => [row.ticker, 0.5])) as Record<
      SectorRotationTicker,
      number
    >;
  }

  const values = rows.map(getValue);
  const allEqual = values.every((value) => value === values[0]);

  if (allEqual) {
    return Object.fromEntries(rows.map((row) => [row.ticker, 0.5])) as Record<
      SectorRotationTicker,
      number
    >;
  }

  const sorted = rows
    .map((row) => ({ ticker: row.ticker, value: getValue(row) }))
    .sort((left, right) => left.value - right.value);
  const percentiles = {} as Record<SectorRotationTicker, number>;

  for (let index = 0; index < sorted.length; ) {
    let endIndex = index;

    while (
      endIndex + 1 < sorted.length &&
      sorted[endIndex + 1].value === sorted[index].value
    ) {
      endIndex += 1;
    }

    const averageRank = (index + endIndex) / 2;
    const ascendingPercentile = averageRank / (sorted.length - 1);
    const percentile = higherIsBetter
      ? ascendingPercentile
      : 1 - ascendingPercentile;

    for (let tieIndex = index; tieIndex <= endIndex; tieIndex += 1) {
      percentiles[sorted[tieIndex].ticker] = percentile;
    }

    index = endIndex + 1;
  }

  return percentiles;
}

type HistoricalPoint = {
  date: string;
  close: number;
};

function normalizeHistoricalPrices(
  response: HistoricalPriceResponse,
): HistoricalPoint[] {
  return response.prices
    .map((price) => ({
      date: price.date,
      close: price.adjustedClose ?? price.close,
    }))
    .filter((point) => Number.isFinite(point.close) && point.close > 0)
    .sort((left, right) => left.date.localeCompare(right.date));
}

function findSharedDates(series: HistoricalPoint[][]): string[] {
  const shared = series.reduce<Set<string> | null>((current, points) => {
    const next = new Set(points.map((point) => point.date));

    if (current === null) {
      return next;
    }

    return new Set([...current].filter((date) => next.has(date)));
  }, null);

  return [...(shared ?? new Set<string>())].sort((left, right) =>
    left.localeCompare(right),
  );
}

function alignPricesToDates(
  series: HistoricalPoint[],
  dates: string[],
): number[] {
  const priceByDate = new Map(series.map((point) => [point.date, point.close]));

  return dates.map((date) => {
    const price = priceByDate.get(date);

    if (!price || price <= 0) {
      throw new Error(`Missing aligned close price for ${date}.`);
    }

    return price;
  });
}

function calculateTrailingReturn(prices: number[], tradingDays: number): number {
  return calculateTotalReturn(getTrailingPrices(prices, tradingDays));
}

function calculateTrailingAnnualizedVolatility(
  prices: number[],
  tradingDays: number,
): number {
  const returns = calculateDailyReturns(prices).slice(-tradingDays);

  return calculateAnnualizedVolatility(returns);
}

function calculateMovingAverageDistance(
  prices: number[],
  tradingDays: number,
): number {
  const window = prices.slice(-tradingDays);
  const average = window.reduce((sum, value) => sum + value, 0) / window.length;

  if (!Number.isFinite(average) || average <= 0) {
    return 0;
  }

  return prices[prices.length - 1] / average - 1;
}

function getTrailingPrices(prices: number[], tradingDays: number): number[] {
  return prices.slice(-Math.min(prices.length, tradingDays + 1));
}

function sectorHasBucket(
  ticker: SectorRotationTicker,
  bucket: SectorRotationBucket,
): boolean {
  return Boolean(
    SECTOR_ROTATION_ETFS.find((sector) => sector.ticker === ticker)?.buckets.includes(
      bucket,
    ),
  );
}

function summarizeProviders(
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

function buildDataNotes(observations: number, warningCount: number): string[] {
  const notes: string[] = [];

  if (observations < SIX_MONTH_TRADING_DAYS + 1) {
    notes.push(
      "6M return and drawdown use the available shared history because fewer than 126 trailing trading days were aligned.",
    );
  }

  if (warningCount > 0) {
    notes.push("Provider warnings were returned with this dataset.");
  }

  return notes;
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}
