import type {
  FutureStrategyCandidate,
  StrategyPresetId,
  StrategyScreenerInput,
  StrategyScreenerResult,
  StrategySuggestion,
  VolatilityView,
} from "@/lib/finance/options/types";
import {
  validateFiniteScalar,
  validatePositiveScalar,
} from "@/lib/finance/options/validation";

const ABSOLUTE_VOL_THRESHOLD = 0.02;
const RELATIVE_VOL_THRESHOLD = 0.1;

const STRATEGY_NAMES: Record<StrategyPresetId, string> = {
  "long-call": "Long call",
  "long-put": "Long put",
  "bull-call-spread": "Bull call spread",
  "bear-put-spread": "Bear put spread",
  "long-straddle": "Long straddle",
  "long-strangle": "Long strangle",
};

function classifyVolatilityView(
  expectedVolatility: number,
  impliedVolatility: number,
): VolatilityView {
  const spread = expectedVolatility - impliedVolatility;
  const relativeSpread = spread / Math.max(impliedVolatility, 1e-9);
  const isMeaningful =
    Math.abs(spread) >= ABSOLUTE_VOL_THRESHOLD ||
    Math.abs(relativeSpread) >= RELATIVE_VOL_THRESHOLD;

  if (!isMeaningful) {
    return "fair";
  }

  return spread > 0 ? "cheap" : "expensive";
}

function volatilityLogicFor(view: VolatilityView): string {
  if (view === "cheap") {
    return "Expected volatility is above implied volatility, so long-premium structures may be worth analyzing.";
  }

  if (view === "expensive") {
    return "Expected volatility is below implied volatility, so premium-heavy long-volatility structures may be costly.";
  }

  return "Expected and implied volatility are close enough to treat volatility as roughly fair in this simple screen.";
}

function addSuggestion(
  suggestions: StrategySuggestion[],
  strategyId: StrategyPresetId,
  scenarioFit: string,
  explanation: string,
  riskNote: string,
  volatilityLogic: string,
  directionalLogic: string,
) {
  if (suggestions.some((suggestion) => suggestion.strategyId === strategyId)) {
    return;
  }

  suggestions.push({
    strategyId,
    strategyName: STRATEGY_NAMES[strategyId],
    scenarioFit,
    explanation,
    riskNote,
    volatilityLogic,
    directionalLogic,
  });
}

function addFutureCandidate(
  futureCandidates: FutureStrategyCandidate[],
  name: string,
  note: string,
) {
  if (futureCandidates.some((candidate) => candidate.name === name)) {
    return;
  }

  futureCandidates.push({ name, note });
}

function validateScreenerInput(input: StrategyScreenerInput) {
  validatePositiveScalar(input.expectedVolatility, "expectedVolatility");
  validatePositiveScalar(input.impliedVolatility, "impliedVolatility");
  validateFiniteScalar(input.expectedVolatility, "expectedVolatility");
  validateFiniteScalar(input.impliedVolatility, "impliedVolatility");
}

export function screenOptionStrategies(
  input: StrategyScreenerInput,
): StrategyScreenerResult {
  validateScreenerInput(input);

  const {
    expectedVolatility,
    impliedVolatility,
    directionalView,
    riskPreference,
    ownershipStatus,
  } = input;
  const volatilityView = classifyVolatilityView(
    expectedVolatility,
    impliedVolatility,
  );
  const volatilitySpread = expectedVolatility - impliedVolatility;
  const volatilitySpreadPercent =
    volatilitySpread / Math.max(impliedVolatility, 1e-9);
  const volatilityLogic = volatilityLogicFor(volatilityView);
  const suggestions: StrategySuggestion[] = [];
  const futureCandidates: FutureStrategyCandidate[] = [];

  if (directionalView === "bullish") {
    const directionalLogic = "The directional view is bullish, so upside-oriented structures are compatible with the scenario.";

    if (volatilityView === "cheap") {
      addSuggestion(
        suggestions,
        "long-call",
        "Compatible with bullish direction and cheaper implied volatility.",
        "A long call gives upside convexity while keeping loss limited to the premium paid.",
        "Premium paid can expire worthless if the underlying does not move above breakeven.",
        volatilityLogic,
        directionalLogic,
      );
    }

    addSuggestion(
      suggestions,
      "bull-call-spread",
      volatilityView === "expensive"
        ? "May fit a bullish view when implied volatility appears expensive."
        : "Defined-risk bullish structure to compare with a single long call.",
      "The spread reduces net premium by selling an upper-strike call, while capping upside.",
      "Upside is capped at the short call strike and the net debit remains at risk.",
      volatilityLogic,
      directionalLogic,
    );

    if (riskPreference === "willing-to-own-underlying") {
      addFutureCandidate(
        futureCandidates,
        "Cash-secured put",
        "A cash-secured put could be relevant for bullish ownership willingness, but it is not implemented in the builder yet.",
      );
    }
  }

  if (directionalView === "bearish") {
    const directionalLogic = "The directional view is bearish, so downside-oriented structures are compatible with the scenario.";

    if (volatilityView === "cheap") {
      addSuggestion(
        suggestions,
        "long-put",
        "Compatible with bearish direction and cheaper implied volatility.",
        "A long put gives downside convexity while keeping loss limited to the premium paid.",
        "Premium paid can expire worthless if the underlying stays above breakeven.",
        volatilityLogic,
        directionalLogic,
      );
    }

    addSuggestion(
      suggestions,
      "bear-put-spread",
      volatilityView === "expensive"
        ? "May fit a bearish view when implied volatility appears expensive."
        : "Defined-risk bearish structure to compare with a single long put.",
      "The spread reduces net premium by selling a lower-strike put, while capping downside profit.",
      "Profit is capped below the short put strike and the net debit remains at risk.",
      volatilityLogic,
      directionalLogic,
    );
  }

  if (directionalView === "neutral") {
    const directionalLogic = "The directional view is neutral, so the screen emphasizes structures that do not require a strong directional move.";

    if (volatilityView === "expensive") {
      addSuggestion(
        suggestions,
        "bull-call-spread",
        "Defined-risk spread to review instead of naked short-volatility exposure.",
        "A vertical spread keeps risk defined while avoiding uncovered option writing in this MVP.",
        "The structure is directional and capped; review payoff before treating it as neutral exposure.",
        volatilityLogic,
        directionalLogic,
      );
      addSuggestion(
        suggestions,
        "bear-put-spread",
        "Defined-risk spread to review instead of naked short-volatility exposure.",
        "A put spread can be compared with the call spread when testing neutral-to-bearish alternatives.",
        "The structure is directional and capped; review payoff before treating it as neutral exposure.",
        volatilityLogic,
        directionalLogic,
      );
      addFutureCandidate(
        futureCandidates,
        "Iron condor",
        "Iron condor would be a natural defined-risk candidate, but it is not implemented in the builder yet.",
      );
    } else {
      addSuggestion(
        suggestions,
        "long-straddle",
        "Structure to analyze if neutrality means a move may still arrive in either direction.",
        "A straddle is direction-agnostic at entry but needs a sufficiently large move to overcome premium paid.",
        "Loss is limited to premium paid, but both legs decay if realized movement is too small.",
        volatilityLogic,
        directionalLogic,
      );
    }
  }

  if (directionalView === "large-move") {
    const directionalLogic = "The view expects a large move without requiring a specific direction.";

    if (volatilityView === "cheap") {
      addSuggestion(
        suggestions,
        "long-straddle",
        "Compatible with a large-move view when implied volatility appears cheap.",
        "A straddle concentrates exposure around the current strike and can benefit from a large move either way.",
        "The total premium paid is at risk if the move is too small.",
        volatilityLogic,
        directionalLogic,
      );
      addSuggestion(
        suggestions,
        "long-strangle",
        "Compatible with a large-move view when implied volatility appears cheap.",
        "A strangle uses out-of-the-money options for lower premium and wider breakevens.",
        "The underlying must move further before the structure reaches breakeven.",
        volatilityLogic,
        directionalLogic,
      );
    } else if (volatilityView === "expensive") {
      addSuggestion(
        suggestions,
        "bull-call-spread",
        "Defined-risk spread to review because long-volatility structures may be costly.",
        "A call spread can test upside exposure while reducing premium outlay compared with a long call.",
        "It is directional and capped; it is not a pure large-move structure.",
        volatilityLogic,
        directionalLogic,
      );
      addSuggestion(
        suggestions,
        "bear-put-spread",
        "Defined-risk spread to review because long-volatility structures may be costly.",
        "A put spread can test downside exposure while reducing premium outlay compared with a long put.",
        "It is directional and capped; it is not a pure large-move structure.",
        volatilityLogic,
        directionalLogic,
      );
    } else {
      addSuggestion(
        suggestions,
        "long-strangle",
        "Structure to analyze for a large move with roughly fair implied volatility.",
        "A strangle gives two-sided exposure with lower premium than an ATM straddle.",
        "Wider breakevens mean the move needs to be larger.",
        volatilityLogic,
        directionalLogic,
      );
    }
  }

  if (
    ownershipStatus === "owns-underlying" &&
    volatilityView === "expensive" &&
    riskPreference === "willing-to-cap-upside"
  ) {
    addFutureCandidate(
      futureCandidates,
      "Covered call",
      "Covered call may be relevant for owners willing to cap upside, but it is not implemented in the builder yet.",
    );
  }

  return {
    volatilityView,
    volatilitySpread,
    volatilitySpreadPercent,
    volatilityInterpretation:
      volatilityView === "cheap"
        ? "Your expected volatility is above implied volatility; implied volatility appears cheap relative to your view."
        : volatilityView === "expensive"
          ? "Your expected volatility is below implied volatility; implied volatility appears expensive relative to your view."
          : "Your expected volatility is close to implied volatility; implied volatility appears roughly fair in this simple screen.",
    suggestions: suggestions.slice(0, 3),
    futureCandidates,
  };
}
