import { blackScholesPrice } from "@/lib/finance/options/blackScholes";
import type {
  OptionLeg,
  OptionType,
  StrategyAnalysis,
  StrategyDefinition,
  StrategyMetrics,
  StrategyPayoffPoint,
  StrategyPresetId,
} from "@/lib/finance/options/types";
import {
  validateFiniteScalar,
  validateOptionType,
  validatePositiveScalar,
} from "@/lib/finance/options/validation";

export const strategyPresetIds: StrategyPresetId[] = [
  "long-call",
  "long-put",
  "bull-call-spread",
  "bear-put-spread",
  "long-straddle",
  "long-strangle",
];

const MIN_SPOT = 0.01;

type StrategyContext = {
  spot: number;
  strike: number;
  maturity: number;
  rate: number;
  volatility: number;
  dividendYield: number;
};

function validateStrategyContext(context: StrategyContext) {
  validatePositiveScalar(context.spot, "spot");
  validatePositiveScalar(context.strike, "strike");
  validatePositiveScalar(context.maturity, "maturity");
  validateFiniteScalar(context.rate, "rate");
  validatePositiveScalar(context.volatility, "volatility");
  validateFiniteScalar(context.dividendYield, "dividendYield");
}

function optionPremium(context: StrategyContext, optionType: OptionType, strike: number) {
  return blackScholesPrice({
    spot: context.spot,
    strike,
    maturity: context.maturity,
    rate: context.rate,
    volatility: context.volatility,
    dividendYield: context.dividendYield,
    optionType,
  });
}

function optionLeg({
  id,
  label,
  optionType,
  position,
  strike,
  premium,
}: Omit<OptionLeg, "quantity">): OptionLeg {
  validateOptionType(optionType);
  validatePositiveScalar(strike, "strike");
  validateFiniteScalar(premium, "premium");

  return {
    id,
    label,
    optionType,
    position,
    strike,
    premium,
    quantity: 1,
  };
}

export function buildStrategyPreset(
  presetId: StrategyPresetId,
  context: StrategyContext,
): StrategyDefinition {
  validateStrategyContext(context);

  const atmStrike = context.strike;
  const lowerStrike = context.strike * 0.9;
  const upperStrike = context.strike * 1.1;

  if (presetId === "long-call") {
    return {
      id: presetId,
      name: "Long call",
      description: "Bullish single-leg call with limited premium at risk.",
      bias: "bullish",
      legs: [
        optionLeg({
          id: "long-call",
          label: "Long call",
          optionType: "call",
          position: "long",
          strike: atmStrike,
          premium: optionPremium(context, "call", atmStrike),
        }),
      ],
    };
  }

  if (presetId === "long-put") {
    return {
      id: presetId,
      name: "Long put",
      description: "Bearish single-leg put with limited premium at risk.",
      bias: "bearish",
      legs: [
        optionLeg({
          id: "long-put",
          label: "Long put",
          optionType: "put",
          position: "long",
          strike: atmStrike,
          premium: optionPremium(context, "put", atmStrike),
        }),
      ],
    };
  }

  if (presetId === "bull-call-spread") {
    return {
      id: presetId,
      name: "Bull call spread",
      description: "Long lower-strike call financed by a short higher-strike call.",
      bias: "bullish",
      legs: [
        optionLeg({
          id: "long-lower-call",
          label: "Long lower call",
          optionType: "call",
          position: "long",
          strike: lowerStrike,
          premium: optionPremium(context, "call", lowerStrike),
        }),
        optionLeg({
          id: "short-upper-call",
          label: "Short upper call",
          optionType: "call",
          position: "short",
          strike: upperStrike,
          premium: optionPremium(context, "call", upperStrike),
        }),
      ],
    };
  }

  if (presetId === "bear-put-spread") {
    return {
      id: presetId,
      name: "Bear put spread",
      description: "Long higher-strike put financed by a short lower-strike put.",
      bias: "bearish",
      legs: [
        optionLeg({
          id: "long-upper-put",
          label: "Long upper put",
          optionType: "put",
          position: "long",
          strike: upperStrike,
          premium: optionPremium(context, "put", upperStrike),
        }),
        optionLeg({
          id: "short-lower-put",
          label: "Short lower put",
          optionType: "put",
          position: "short",
          strike: lowerStrike,
          premium: optionPremium(context, "put", lowerStrike),
        }),
      ],
    };
  }

  if (presetId === "long-straddle") {
    return {
      id: presetId,
      name: "Long straddle",
      description: "Long ATM call and put; profits from a large move either way.",
      bias: "volatility expansion",
      legs: [
        optionLeg({
          id: "long-atm-call",
          label: "Long ATM call",
          optionType: "call",
          position: "long",
          strike: atmStrike,
          premium: optionPremium(context, "call", atmStrike),
        }),
        optionLeg({
          id: "long-atm-put",
          label: "Long ATM put",
          optionType: "put",
          position: "long",
          strike: atmStrike,
          premium: optionPremium(context, "put", atmStrike),
        }),
      ],
    };
  }

  return {
    id: presetId,
    name: "Long strangle",
    description: "Long OTM put and call; lower debit than a straddle with wider breakevens.",
    bias: "volatility expansion",
    legs: [
      optionLeg({
        id: "long-lower-put",
        label: "Long lower put",
        optionType: "put",
        position: "long",
        strike: lowerStrike,
        premium: optionPremium(context, "put", lowerStrike),
      }),
      optionLeg({
        id: "long-upper-call",
        label: "Long upper call",
        optionType: "call",
        position: "long",
        strike: upperStrike,
        premium: optionPremium(context, "call", upperStrike),
      }),
    ],
  };
}

function optionPayoffAtExpiry(leg: OptionLeg, spot: number): number {
  const intrinsic =
    leg.optionType === "call"
      ? Math.max(spot - leg.strike, 0)
      : Math.max(leg.strike - spot, 0);
  const signedIntrinsic = leg.position === "long" ? intrinsic : -intrinsic;

  return signedIntrinsic * leg.quantity;
}

export function getStrategyNetPremium(legs: OptionLeg[]): number {
  return legs.reduce((total, leg) => {
    const signedPremium = leg.position === "long" ? leg.premium : -leg.premium;

    return total + signedPremium * leg.quantity;
  }, 0);
}

export function buildStrategyPayoffSeries(
  legs: OptionLeg[],
  spot: number,
  points = 121,
): StrategyPayoffPoint[] {
  validatePositiveScalar(spot, "spot");

  if (!Number.isInteger(points) || points < 2) {
    throw new Error("points must be an integer greater than 1");
  }

  const minSpot = Math.max(MIN_SPOT, spot * 0.5);
  const maxSpot = spot * 1.5;
  const step = (maxSpot - minSpot) / (points - 1);
  const netPremium = getStrategyNetPremium(legs);

  return Array.from({ length: points }, (_, index) => {
    const spotAtExpiry = minSpot + step * index;
    const payoff = legs.reduce(
      (total, leg) => total + optionPayoffAtExpiry(leg, spotAtExpiry),
      0,
    );

    return {
      spot: spotAtExpiry,
      payoff,
      profit: payoff - netPremium,
    };
  });
}

function findBreakevenPoints(points: StrategyPayoffPoint[]): number[] {
  const breakevens: number[] = [];

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];

    if (previous.profit === 0) {
      breakevens.push(previous.spot);
      continue;
    }

    if (previous.profit * current.profit < 0) {
      const weight =
        Math.abs(previous.profit) /
        (Math.abs(previous.profit) + Math.abs(current.profit));

      breakevens.push(previous.spot + (current.spot - previous.spot) * weight);
    }
  }

  const last = points[points.length - 1];

  if (last?.profit === 0) {
    breakevens.push(last.spot);
  }

  return breakevens.filter(
    (point, index, values) =>
      values.findIndex((candidate) => Math.abs(candidate - point) < 0.01) ===
      index,
  );
}

function getSingleLeg(strategy: StrategyDefinition): OptionLeg | undefined {
  return strategy.legs[0];
}

function getLongLeg(
  strategy: StrategyDefinition,
  optionType: OptionType,
): OptionLeg | undefined {
  return strategy.legs.find(
    (leg) => leg.position === "long" && leg.optionType === optionType,
  );
}

function getShortLeg(
  strategy: StrategyDefinition,
  optionType: OptionType,
): OptionLeg | undefined {
  return strategy.legs.find(
    (leg) => leg.position === "short" && leg.optionType === optionType,
  );
}

function getExactPresetMetrics(
  strategy: StrategyDefinition,
): Omit<StrategyMetrics, "bias"> | null {
  const netPremium = getStrategyNetPremium(strategy.legs);

  if (strategy.id === "long-call") {
    const leg = getSingleLeg(strategy);

    if (!leg) return null;

    return {
      netPremium,
      maxProfit: undefined,
      maxLoss: netPremium,
      breakevenPoints: [leg.strike + netPremium],
      metricSource: "exact",
    };
  }

  if (strategy.id === "long-put") {
    const leg = getSingleLeg(strategy);

    if (!leg) return null;

    return {
      netPremium,
      maxProfit: leg.strike - netPremium,
      maxLoss: netPremium,
      breakevenPoints: [leg.strike - netPremium],
      metricSource: "exact",
    };
  }

  if (strategy.id === "bull-call-spread") {
    const longCall = getLongLeg(strategy, "call");
    const shortCall = getShortLeg(strategy, "call");

    if (!longCall || !shortCall) return null;

    const lowerStrike = Math.min(longCall.strike, shortCall.strike);
    const upperStrike = Math.max(longCall.strike, shortCall.strike);

    return {
      netPremium,
      maxProfit: upperStrike - lowerStrike - netPremium,
      maxLoss: netPremium,
      breakevenPoints: [lowerStrike + netPremium],
      metricSource: "exact",
    };
  }

  if (strategy.id === "bear-put-spread") {
    const longPut = getLongLeg(strategy, "put");
    const shortPut = getShortLeg(strategy, "put");

    if (!longPut || !shortPut) return null;

    const lowerStrike = Math.min(longPut.strike, shortPut.strike);
    const upperStrike = Math.max(longPut.strike, shortPut.strike);

    return {
      netPremium,
      maxProfit: upperStrike - lowerStrike - netPremium,
      maxLoss: netPremium,
      breakevenPoints: [upperStrike - netPremium],
      metricSource: "exact",
    };
  }

  if (strategy.id === "long-straddle") {
    const call = getLongLeg(strategy, "call");
    const put = getLongLeg(strategy, "put");

    if (!call || !put) return null;

    const strike = (call.strike + put.strike) / 2;

    return {
      netPremium,
      maxProfit: undefined,
      maxLoss: netPremium,
      breakevenPoints: [strike - netPremium, strike + netPremium],
      metricSource: "exact",
    };
  }

  if (strategy.id === "long-strangle") {
    const call = getLongLeg(strategy, "call");
    const put = getLongLeg(strategy, "put");

    if (!call || !put) return null;

    return {
      netPremium,
      maxProfit: undefined,
      maxLoss: netPremium,
      breakevenPoints: [put.strike - netPremium, call.strike + netPremium],
      metricSource: "exact",
    };
  }

  return null;
}

function inferStrategyMetrics(
  strategy: StrategyDefinition,
  payoffPoints: StrategyPayoffPoint[],
): StrategyMetrics {
  const exactMetrics = getExactPresetMetrics(strategy);

  if (exactMetrics) {
    return {
      ...exactMetrics,
      bias: strategy.bias,
    };
  }

  const netPremium = getStrategyNetPremium(strategy.legs);
  const profits = payoffPoints.map((point) => point.profit);
  const maxGridProfit = Math.max(...profits);
  const minGridProfit = Math.min(...profits);
  const rightSlope =
    payoffPoints[payoffPoints.length - 1].profit -
    payoffPoints[payoffPoints.length - 2].profit;
  const maxProfit = rightSlope > 1e-8 ? undefined : maxGridProfit;
  const maxLoss = rightSlope < -1e-8 ? undefined : Math.abs(minGridProfit);

  return {
    netPremium,
    maxProfit,
    maxLoss,
    breakevenPoints: findBreakevenPoints(payoffPoints),
    bias: strategy.bias,
    metricSource: "plotted range",
  };
}

export function analyzeStrategy(
  strategy: StrategyDefinition,
  spot: number,
): StrategyAnalysis {
  const payoffPoints = buildStrategyPayoffSeries(strategy.legs, spot);

  return {
    strategy,
    payoffPoints,
    metrics: inferStrategyMetrics(strategy, payoffPoints),
  };
}
