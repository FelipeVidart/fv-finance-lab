import {
  DRAWDOWN_LOOKBACK_DAYS,
  MARKET_REGIME_BLOCK_DEFINITIONS,
  MARKET_REGIME_MIN_OBSERVATIONS,
  ONE_MONTH_TRADING_DAYS,
  REALIZED_VOLATILITY_DAYS,
  SMA_50_DAYS,
  SMA_200_DAYS,
  THREE_MONTH_TRADING_DAYS,
  VIX_AVERAGE_DAYS,
  calculateDrawdownFromHigh,
  calculateLookbackReturn,
  calculateRealizedVolatility,
  calculateSimpleMovingAverage,
  clampScore,
  formatNumber,
  formatPercent,
  formatUnsignedPercent,
  getTickerPrices,
  scoreInverseRange,
  scoreRange,
} from "@/lib/finance/market-regime/indicators";
import type {
  MarketRegimeAlignedPoint,
  MarketRegimeBlock,
  MarketRegimeBlockId,
  MarketRegimeConfidence,
  MarketRegimeIndicator,
  MarketRegimeName,
  MarketRegimeResult,
  MarketRegimeSource,
} from "@/lib/finance/market-regime/types";
import type {
  MarketDataProviderMode,
  MarketDataWarning,
} from "@/lib/market-data/types";

type CalculationInput = {
  points: MarketRegimeAlignedPoint[];
  source: MarketRegimeSource;
  provider: string;
  requestedProvider: MarketDataProviderMode;
  warnings?: string[];
  providerWarnings?: MarketDataWarning[];
  lastUpdated?: string;
};

type IndicatorDraft = Omit<
  MarketRegimeIndicator,
  "blockLabel" | "contribution"
>;

export function calculateMarketRegime(
  input: CalculationInput,
): MarketRegimeResult {
  if (input.points.length < MARKET_REGIME_MIN_OBSERVATIONS) {
    throw new Error(
      `Market regime calculation needs at least ${MARKET_REGIME_MIN_OBSERVATIONS} aligned observations.`,
    );
  }

  const spyPrices = getTickerPrices(input.points, "SPY");
  const qqqPrices = getTickerPrices(input.points, "QQQ");
  const vixPrices = getTickerPrices(input.points, "VIX");
  const hygPrices = getTickerPrices(input.points, "HYG");
  const lqdPrices = getTickerPrices(input.points, "LQD");
  const tltPrices = getTickerPrices(input.points, "TLT");
  const iefPrices = getTickerPrices(input.points, "IEF");

  const latestSpy = last(spyPrices);
  const spySma50 = calculateSimpleMovingAverage(spyPrices, SMA_50_DAYS);
  const spySma200 = calculateSimpleMovingAverage(spyPrices, SMA_200_DAYS);
  const spyVsSma200 = latestSpy / spySma200 - 1;
  const sma50VsSma200 = spySma50 / spySma200 - 1;
  const spyDrawdown252 = calculateDrawdownFromHigh(
    spyPrices,
    DRAWDOWN_LOOKBACK_DAYS,
  );
  const spyReturn1M = calculateLookbackReturn(
    spyPrices,
    ONE_MONTH_TRADING_DAYS,
  );
  const spyReturn3M = calculateLookbackReturn(
    spyPrices,
    THREE_MONTH_TRADING_DAYS,
  );
  const qqqReturn3M = calculateLookbackReturn(
    qqqPrices,
    THREE_MONTH_TRADING_DAYS,
  );
  const qqqSpyRelative3M = qqqReturn3M - spyReturn3M;
  const latestVix = last(vixPrices);
  const vixAverage60 = calculateSimpleMovingAverage(
    vixPrices,
    VIX_AVERAGE_DAYS,
  );
  const vixVsAverage60 = latestVix / vixAverage60 - 1;
  const realizedVolatility20D = calculateRealizedVolatility(
    spyPrices,
    REALIZED_VOLATILITY_DAYS,
  );
  const hygReturn3M = calculateLookbackReturn(
    hygPrices,
    THREE_MONTH_TRADING_DAYS,
  );
  const lqdReturn3M = calculateLookbackReturn(
    lqdPrices,
    THREE_MONTH_TRADING_DAYS,
  );
  const hygLqdRelative3M = hygReturn3M - lqdReturn3M;
  const tltReturn3M = calculateLookbackReturn(
    tltPrices,
    THREE_MONTH_TRADING_DAYS,
  );
  const iefReturn3M = calculateLookbackReturn(
    iefPrices,
    THREE_MONTH_TRADING_DAYS,
  );
  const tltSpyRelative3M = tltReturn3M - spyReturn3M;

  const drafts: IndicatorDraft[] = [
    buildIndicator({
      id: "spyVsSma200",
      label: "SPY vs SMA200",
      source: "SPY",
      blockId: "equityTrend",
      metricLabel: "Latest close vs 200-day average",
      value: spyVsSma200,
      valueDisplay: formatPercent(spyVsSma200),
      score: scoreRange(spyVsSma200, -0.05, 0.05),
      explanation:
        "Positive when SPY trades meaningfully above its long-term trend.",
    }),
    buildIndicator({
      id: "sma50VsSma200",
      label: "SMA50 vs SMA200",
      source: "SPY",
      blockId: "equityTrend",
      metricLabel: "50-day average vs 200-day average",
      value: sma50VsSma200,
      valueDisplay: formatPercent(sma50VsSma200),
      score: scoreRange(sma50VsSma200, -0.03, 0.03),
      explanation:
        "Positive when the intermediate equity trend is above the long-term trend.",
    }),
    buildIndicator({
      id: "spyDrawdown252",
      label: "SPY drawdown vs 252-day high",
      source: "SPY",
      blockId: "equityTrend",
      metricLabel: "Latest close vs trailing 252-day high",
      value: spyDrawdown252,
      valueDisplay: formatPercent(spyDrawdown252),
      score: scoreRange(spyDrawdown252, -0.15, -0.03),
      explanation:
        "Penalizes deeper equity drawdowns from the trailing one-year high.",
    }),
    buildIndicator({
      id: "spyReturn1M",
      label: "SPY 1M return",
      source: "SPY",
      blockId: "riskMomentum",
      metricLabel: "21-trading-day total return",
      value: spyReturn1M,
      valueDisplay: formatPercent(spyReturn1M),
      score: scoreRange(spyReturn1M, -0.04, 0.04),
      explanation:
        "Captures short-term equity momentum without projecting forward.",
    }),
    buildIndicator({
      id: "spyReturn3M",
      label: "SPY 3M return",
      source: "SPY",
      blockId: "riskMomentum",
      metricLabel: "63-trading-day total return",
      value: spyReturn3M,
      valueDisplay: formatPercent(spyReturn3M),
      score: scoreRange(spyReturn3M, -0.08, 0.08),
      explanation:
        "Captures medium-term equity momentum over the shared dataset.",
    }),
    buildIndicator({
      id: "qqqSpyRelative3M",
      label: "QQQ/SPY 3M relative return",
      source: "QQQ - SPY",
      blockId: "riskMomentum",
      metricLabel: "63-day return spread",
      value: qqqSpyRelative3M,
      valueDisplay: formatPercent(qqqSpyRelative3M),
      score: scoreRange(qqqSpyRelative3M, -0.04, 0.04),
      explanation:
        "Positive when growth-heavy equities outperform broad equities.",
    }),
    buildIndicator({
      id: "vixLevel",
      label: "VIX level",
      source: "VIX",
      blockId: "volatility",
      metricLabel: "Latest VIX close",
      value: latestVix,
      valueDisplay: formatNumber(latestVix, 1),
      score: scoreInverseRange(latestVix, 15, 30),
      explanation:
        "Lower implied volatility is treated as more supportive for risk appetite.",
    }),
    buildIndicator({
      id: "vixVsAverage60",
      label: "VIX vs 60-day average",
      source: "VIX",
      blockId: "volatility",
      metricLabel: "Latest VIX vs 60-day average",
      value: vixVsAverage60,
      valueDisplay: formatPercent(vixVsAverage60),
      score: scoreInverseRange(vixVsAverage60, -0.1, 0.2),
      explanation:
        "Penalizes volatility spikes relative to the recent VIX baseline.",
    }),
    buildIndicator({
      id: "spyRealizedVolatility20D",
      label: "SPY realized volatility 20d",
      source: "SPY",
      blockId: "volatility",
      metricLabel: "Annualized volatility from latest 20 daily returns",
      value: realizedVolatility20D,
      valueDisplay: formatUnsignedPercent(realizedVolatility20D),
      score: scoreInverseRange(realizedVolatility20D, 0.12, 0.28),
      explanation:
        "Lower realized volatility receives a higher risk-appetite score.",
    }),
    buildIndicator({
      id: "hygReturn3M",
      label: "HYG 3M return",
      source: "HYG",
      blockId: "creditConditions",
      metricLabel: "63-trading-day total return",
      value: hygReturn3M,
      valueDisplay: formatPercent(hygReturn3M),
      score: scoreRange(hygReturn3M, -0.04, 0.04),
      explanation:
        "High-yield strength is treated as a sign of credit risk appetite.",
    }),
    buildIndicator({
      id: "lqdReturn3M",
      label: "LQD 3M return",
      source: "LQD",
      blockId: "creditConditions",
      metricLabel: "63-trading-day total return",
      value: lqdReturn3M,
      valueDisplay: formatPercent(lqdReturn3M),
      score: scoreRange(lqdReturn3M, -0.04, 0.04),
      explanation:
        "Investment-grade credit strength supports the credit conditions block.",
    }),
    buildIndicator({
      id: "hygLqdRelative3M",
      label: "HYG/LQD 3M relative return",
      source: "HYG - LQD",
      blockId: "creditConditions",
      metricLabel: "63-day return spread",
      value: hygLqdRelative3M,
      valueDisplay: formatPercent(hygLqdRelative3M),
      score: scoreRange(hygLqdRelative3M, -0.03, 0.03),
      explanation:
        "Positive when lower-quality credit outperforms investment-grade credit.",
    }),
    buildIndicator({
      id: "tltReturn3M",
      label: "TLT 3M return",
      source: "TLT",
      blockId: "ratesDuration",
      metricLabel: "63-trading-day total return",
      value: tltReturn3M,
      valueDisplay: formatPercent(tltReturn3M),
      score: scoreRange(tltReturn3M, -0.08, 0.08),
      explanation:
        "Long-duration Treasury weakness is treated as rates pressure.",
    }),
    buildIndicator({
      id: "iefReturn3M",
      label: "IEF 3M return",
      source: "IEF",
      blockId: "ratesDuration",
      metricLabel: "63-trading-day total return",
      value: iefReturn3M,
      valueDisplay: formatPercent(iefReturn3M),
      score: scoreRange(iefReturn3M, -0.04, 0.04),
      explanation:
        "Intermediate Treasury weakness lowers the rates and duration score.",
    }),
    buildIndicator({
      id: "tltSpyRelative3M",
      label: "TLT/SPY 3M relative return",
      source: "TLT - SPY",
      blockId: "ratesDuration",
      metricLabel: "63-day return spread",
      value: tltSpyRelative3M,
      valueDisplay: formatPercent(tltSpyRelative3M),
      score: scoreInverseRange(tltSpyRelative3M, -0.08, 0.08),
      explanation:
        "Penalizes defensive rotation when long Treasuries outperform equities.",
    }),
  ];

  const blocks = buildBlocks(drafts);
  const indicators = blocks.flatMap((block) => block.indicators);
  const weightedScore = blocks.reduce(
    (sum, block) => sum + block.contribution,
    0,
  );
  const score = Math.round(weightedScore * 100);
  const regime = classifyRegime(score);
  const confidence = calculateConfidence({
    blocks,
    score,
    source: input.source,
  });
  const tags = buildTags(blocks, indicators);
  const explanation = buildExplanation({ regime, blocks, indicators });
  const lastPoint = input.points[input.points.length - 1];

  return {
    regime,
    score,
    confidence,
    tags,
    blocks,
    indicators,
    explanation,
    source: input.source,
    provider: input.provider,
    requestedProvider: input.requestedProvider,
    lastUpdated: input.lastUpdated ?? new Date().toISOString(),
    lastMarketDate: lastPoint.date,
    observationCount: input.points.length,
    warnings: input.warnings ?? [],
    ...(input.providerWarnings ? { providerWarnings: input.providerWarnings } : {}),
  };
}

function buildIndicator(input: IndicatorDraft): IndicatorDraft {
  return {
    ...input,
    score: clampScore(input.score),
  };
}

function buildBlocks(indicators: IndicatorDraft[]): MarketRegimeBlock[] {
  return MARKET_REGIME_BLOCK_DEFINITIONS.map((definition) => {
    const blockIndicators = indicators.filter(
      (indicator) => indicator.blockId === definition.id,
    );
    const blockScore =
      blockIndicators.reduce((sum, indicator) => sum + indicator.score, 0) /
      Math.max(blockIndicators.length, 1);
    const contribution = blockScore * definition.weight;

    return {
      id: definition.id,
      label: definition.label,
      weight: definition.weight,
      score: blockScore,
      contribution,
      indicators: blockIndicators.map((indicator) => ({
        ...indicator,
        blockLabel: definition.label,
        contribution:
          (indicator.score * definition.weight * 100) /
          Math.max(blockIndicators.length, 1),
      })),
    };
  });
}

function classifyRegime(score: number): MarketRegimeName {
  if (score >= 60) {
    return "Strong Risk On";
  }

  if (score >= 20) {
    return "Risk On";
  }

  if (score <= -60) {
    return "Strong Risk Off";
  }

  if (score <= -20) {
    return "Risk Off";
  }

  return "Neutral / Mixed";
}

function calculateConfidence(input: {
  blocks: MarketRegimeBlock[];
  score: number;
  source: MarketRegimeSource;
}): MarketRegimeConfidence {
  const blockScores = input.blocks.map((block) => block.score);
  const weightedMean = input.score / 100;
  const dispersion = Math.sqrt(
    blockScores.reduce((sum, score) => sum + (score - weightedMean) ** 2, 0) /
      Math.max(blockScores.length, 1),
  );
  const consistency = 1 - Math.min(dispersion / 0.9, 1);
  const direction =
    input.score >= 20 ? 1 : input.score <= -20 ? -1 : 0;
  const agreement =
    direction === 0
      ? blockScores.filter((score) => Math.abs(score) < 0.35).length /
        Math.max(blockScores.length, 1)
      : blockScores.filter((score) => score * direction > 0.1).length /
        Math.max(blockScores.length, 1);
  const magnitude = Math.min(Math.abs(input.score) / 100, 1);
  const mockPenalty = input.source === "mock" ? 0.12 : 0;
  const confidenceScore = Math.round(
    Math.max(
      0,
      Math.min(
        1,
        0.18 + magnitude * 0.36 + agreement * 0.34 + consistency * 0.12 -
          mockPenalty,
      ),
    ) * 100,
  );
  const level =
    confidenceScore >= 72
      ? "High"
      : confidenceScore >= 48
        ? "Medium"
        : "Low";

  return {
    level,
    score: confidenceScore,
    explanation:
      input.source === "mock"
        ? "Reduced because the dashboard is using typed fallback data."
        : "Based on score magnitude, block agreement, and dispersion across model blocks.",
  };
}

function buildTags(
  blocks: MarketRegimeBlock[],
  indicators: MarketRegimeIndicator[],
): string[] {
  const tags: string[] = [];
  const equity = getBlockScore(blocks, "equityTrend");
  const volatility = getBlockScore(blocks, "volatility");
  const credit = getBlockScore(blocks, "creditConditions");
  const rates = getBlockScore(blocks, "ratesDuration");
  const tltSpyRelative = indicators.find(
    (indicator) => indicator.id === "tltSpyRelative3M",
  );

  if (equity >= 0.45) {
    tags.push("Bull Trend");
  } else if (equity <= -0.35) {
    tags.push("Bear Pressure");
  }

  if (volatility >= 0.45) {
    tags.push("Low Volatility");
  } else if (volatility <= -0.35) {
    tags.push("High Volatility");
  }

  if (credit >= 0.35) {
    tags.push("Credit Risk Appetite");
  } else if (credit <= -0.35) {
    tags.push("Credit Stress");
  }

  if (rates <= -0.35) {
    tags.push("Rates Pressure");
  }

  if (tltSpyRelative && tltSpyRelative.score <= -0.35) {
    tags.push("Defensive Rotation");
  }

  return tags.length > 0 ? tags.slice(0, 5) : ["Mixed Signals"];
}

function buildExplanation(input: {
  regime: MarketRegimeName;
  blocks: MarketRegimeBlock[];
  indicators: MarketRegimeIndicator[];
}): string {
  const supportiveBlocks = input.blocks
    .filter((block) => block.score > 0.2)
    .sort((left, right) => right.score - left.score)
    .map((block) => block.label);
  const pressureBlocks = input.blocks
    .filter((block) => block.score < -0.2)
    .sort((left, right) => left.score - right.score)
    .map((block) => block.label);
  const positiveDriver = [...input.indicators].sort(
    (left, right) => right.contribution - left.contribution,
  )[0];
  const negativeDriver = [...input.indicators].sort(
    (left, right) => left.contribution - right.contribution,
  )[0];
  const supportText =
    supportiveBlocks.length > 0
      ? `${supportiveBlocks.slice(0, 2).join(" and ")} are supportive`
      : "the model blocks are not broadly supportive";
  const pressureText =
    pressureBlocks.length > 0
      ? `${pressureBlocks.slice(0, 2).join(" and ")} are weighing on the score`
      : "no block is applying heavy downside pressure";

  return `The current classification is ${input.regime} because ${supportText}, while ${pressureText}. The strongest positive input is ${positiveDriver.label} (${positiveDriver.valueDisplay}); the strongest offset is ${negativeDriver.label} (${negativeDriver.valueDisplay}). This is an observable-state classification, not a forecast or trading recommendation.`;
}

function getBlockScore(
  blocks: MarketRegimeBlock[],
  blockId: MarketRegimeBlockId,
): number {
  return blocks.find((block) => block.id === blockId)?.score ?? 0;
}

function last(values: number[]): number {
  const value = values[values.length - 1];

  if (!Number.isFinite(value)) {
    throw new Error("Missing latest price.");
  }

  return value;
}

