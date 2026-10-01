import type {
  CurrentVsProposedFactorRow,
  CurrentVsProposedMetricRow,
  CurrentVsProposedPortfolioInput,
  CurrentVsProposedRiskComparison,
} from "@/lib/finance/risk/types";

const METRIC_CONFIG: Array<{
  key: CurrentVsProposedMetricRow["key"];
  label: string;
  lowerIsBetter: boolean;
}> = [
  {
    key: "annualizedVolatility",
    label: "Annualized volatility",
    lowerIsBetter: true,
  },
  {
    key: "historicalVaR",
    label: "Historical VaR",
    lowerIsBetter: true,
  },
  {
    key: "historicalExpectedShortfall",
    label: "Expected Shortfall",
    lowerIsBetter: true,
  },
  {
    key: "maxDrawdown",
    label: "Max drawdown",
    lowerIsBetter: false,
  },
  {
    key: "topThreeContributionShare",
    label: "Top-3 risk concentration",
    lowerIsBetter: true,
  },
];

export function buildCurrentVsProposedRiskComparison(input: {
  current: CurrentVsProposedPortfolioInput;
  proposed: CurrentVsProposedPortfolioInput;
}): CurrentVsProposedRiskComparison {
  const metricRows = METRIC_CONFIG.map((metric) => ({
    key: metric.key,
    label: metric.label,
    current: input.current[metric.key],
    proposed: input.proposed[metric.key],
    delta: input.proposed[metric.key] - input.current[metric.key],
    lowerIsBetter: metric.lowerIsBetter,
  }));
  const factorRows = buildFactorRows({
    current: input.current,
    proposed: input.proposed,
  });
  const warnings = buildWarnings({
    current: input.current,
    proposed: input.proposed,
    factorRows,
  });

  return {
    current: input.current,
    proposed: input.proposed,
    metricRows,
    factorRows,
    summary: {
      volatilityDelta:
        input.proposed.annualizedVolatility - input.current.annualizedVolatility,
      varDelta: input.proposed.historicalVaR - input.current.historicalVaR,
      expectedShortfallDelta:
        input.proposed.historicalExpectedShortfall -
        input.current.historicalExpectedShortfall,
      topThreeConcentrationDelta:
        input.proposed.topThreeContributionShare -
        input.current.topThreeContributionShare,
      maxRiskContributorChanged:
        input.current.maxRiskContributor !== input.proposed.maxRiskContributor,
    },
    methodology: {
      warnings,
    },
  };
}

function buildFactorRows(input: {
  current: CurrentVsProposedPortfolioInput;
  proposed: CurrentVsProposedPortfolioInput;
}): CurrentVsProposedFactorRow[] {
  const currentRows = input.current.factorAttribution ?? [];
  const proposedRows = input.proposed.factorAttribution ?? [];
  const factorIds = [
    ...new Set([
      ...currentRows.map((row) => row.factorId),
      ...proposedRows.map((row) => row.factorId),
    ]),
  ];

  return factorIds
    .map((factorId) => {
      const current = currentRows.find((row) => row.factorId === factorId);
      const proposed = proposedRows.find((row) => row.factorId === factorId);
      const reference = current ?? proposed;

      if (!reference) {
        return null;
      }

      return {
        factorId,
        factorName: reference.factorName,
        proxyTicker: reference.proxyTicker,
        currentContributionShare: current?.contributionShare ?? 0,
        proposedContributionShare: proposed?.contributionShare ?? 0,
        deltaContributionShare:
          (proposed?.contributionShare ?? 0) -
          (current?.contributionShare ?? 0),
      };
    })
    .filter((row): row is CurrentVsProposedFactorRow => row !== null)
    .sort(
      (left, right) =>
        Math.abs(right.deltaContributionShare) -
        Math.abs(left.deltaContributionShare),
    );
}

function buildWarnings(input: {
  current: CurrentVsProposedPortfolioInput;
  proposed: CurrentVsProposedPortfolioInput;
  factorRows: CurrentVsProposedFactorRow[];
}): string[] {
  const warnings: string[] = [];

  if (!input.current.factorAttribution || !input.proposed.factorAttribution) {
    warnings.push(
      "Factor composition comparison is unavailable until both portfolios have factor attribution.",
    );
  } else if (input.factorRows.length === 0) {
    warnings.push(
      "Factor composition comparison did not produce factor rows for this sample.",
    );
  }

  return warnings;
}