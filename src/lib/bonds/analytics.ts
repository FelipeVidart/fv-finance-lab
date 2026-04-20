import type {
  BondExplorerRecord,
  BondYieldSpreadRow,
  SolveApproximateYtmInput,
  SolveApproximateYtmResult,
} from "@/lib/bonds/types";
import type { MarketDataExplorerPayload } from "@/lib/market-data/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function buildBondYieldSpreadRows(input: {
  bonds: BondExplorerRecord[];
  marketData: MarketDataExplorerPayload;
  benchmarkSymbol: string;
}): BondYieldSpreadRow[] {
  const metricsBySymbol = new Map(
    input.marketData.metrics.map((metric) => [metric.ticker, metric] as const),
  );
  const benchmarkBond = input.bonds.find(
    (bond) => bond.symbol === input.benchmarkSymbol,
  );
  const benchmarkMetric = metricsBySymbol.get(input.benchmarkSymbol);
  const benchmarkYtm = resolveApproximateYtmResult(benchmarkBond, benchmarkMetric);

  return input.bonds.map((bond) => {
    const metric = metricsBySymbol.get(bond.symbol);
    const latestPrice = metric?.endPrice ?? null;
    const priceDate = metric?.endDate ?? null;
    const ytmResult = resolveApproximateYtmResult(bond, metric);

    let status: BondYieldSpreadRow["status"] = "ok";
    let note = "Approximate YTM is solved from the latest fetched close.";
    let benchmarkYtmValue = benchmarkYtm?.ytm ?? null;
    let spreadBps =
      ytmResult?.ytm !== undefined && benchmarkYtm?.ytm !== undefined
        ? (ytmResult.ytm - benchmarkYtm.ytm) * 10000
        : null;

    if (!latestPrice || !priceDate) {
      status = "missing_market_price";
      note = "Latest market price is unavailable in the current aligned series.";
    } else if (!bond.metadata) {
      status = "missing_metadata";
      note = "Local bond metadata is required to estimate YTM and spread.";
    } else if (!ytmResult) {
      status = "ytm_unavailable";
      note = "Approximate YTM could not be solved cleanly from the latest price.";
    } else if (!benchmarkBond || !benchmarkBond.metadata || !benchmarkMetric) {
      status = "missing_benchmark_data";
      note =
        "The selected benchmark is not available in the current fetched set with usable metadata.";
      benchmarkYtmValue = null;
      spreadBps = null;
    } else if (!benchmarkYtm) {
      status = "benchmark_ytm_unavailable";
      note = "Benchmark YTM could not be solved cleanly from the latest price.";
      benchmarkYtmValue = null;
      spreadBps = null;
    } else if (bond.symbol === input.benchmarkSymbol) {
      spreadBps = 0;
      note = "This row is the selected benchmark bond.";
    }

    return {
      symbol: bond.symbol,
      displayName: bond.metadata?.displayName ?? null,
      latestPrice,
      priceDate,
      benchmarkSymbol: input.benchmarkSymbol,
      approximateYtm: ytmResult?.ytm ?? null,
      benchmarkYtm: benchmarkYtmValue,
      spreadBps,
      status,
      note,
    };
  });
}

export function solveApproximateBondYtm(
  input: SolveApproximateYtmInput,
): SolveApproximateYtmResult | null {
  if (input.price <= 0 || input.faceValue <= 0) {
    return null;
  }

  if (input.couponRate < 0 || input.paymentsPerYear <= 0) {
    return null;
  }

  const yearsToMaturity = calculateYearFraction(
    input.asOfDate,
    input.maturityDate,
  );

  if (!Number.isFinite(yearsToMaturity) || yearsToMaturity <= 0) {
    return null;
  }

  const remainingPeriods = Math.max(
    1,
    Math.round(yearsToMaturity * input.paymentsPerYear),
  );
  const targetPrice = input.price;
  const lowerBound = -0.99;
  let upperBound = 1;
  const priceAtLower = priceBondFromYield({
    ...input,
    annualYield: lowerBound,
    remainingPeriods,
  });
  let priceAtUpper = priceBondFromYield({
    ...input,
    annualYield: upperBound,
    remainingPeriods,
  });

  if (targetPrice > priceAtLower) {
    return null;
  }

  while (priceAtUpper > targetPrice && upperBound < 10) {
    upperBound *= 2;
    priceAtUpper = priceBondFromYield({
      ...input,
      annualYield: upperBound,
      remainingPeriods,
    });
  }

  if (priceAtUpper > targetPrice) {
    return null;
  }

  let low = lowerBound;
  let high = upperBound;

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = (low + high) / 2;
    const midPrice = priceBondFromYield({
      ...input,
      annualYield: mid,
      remainingPeriods,
    });

    if (Math.abs(midPrice - targetPrice) < 1e-8) {
      return {
        ytm: mid,
        yearsToMaturity,
        remainingPeriods,
      };
    }

    if (midPrice > targetPrice) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return {
    ytm: (low + high) / 2,
    yearsToMaturity,
    remainingPeriods,
  };
}

function resolveApproximateYtmResult(
  bond: BondExplorerRecord | undefined,
  metric:
    | MarketDataExplorerPayload["metrics"][number]
    | undefined,
): SolveApproximateYtmResult | null {
  if (!bond?.metadata || !metric) {
    return null;
  }

  return solveApproximateBondYtm({
    price: metric.endPrice,
    faceValue: bond.metadata.faceValue,
    couponRate: bond.metadata.couponRate,
    maturityDate: bond.metadata.maturityDate,
    paymentsPerYear: bond.metadata.paymentsPerYear,
    asOfDate: metric.endDate,
  });
}

function priceBondFromYield(
  input: SolveApproximateYtmInput & {
    annualYield: number;
    remainingPeriods: number;
  },
): number {
  const periodicYield = input.annualYield / input.paymentsPerYear;

  if (periodicYield <= -0.999999999) {
    return Number.POSITIVE_INFINITY;
  }

  const periodicCoupon =
    (input.faceValue * input.couponRate) / input.paymentsPerYear;

  let price = 0;

  for (let period = 1; period <= input.remainingPeriods; period += 1) {
    const cashFlow =
      period === input.remainingPeriods
        ? periodicCoupon + input.faceValue
        : periodicCoupon;

    price += cashFlow / (1 + periodicYield) ** period;
  }

  return price;
}

function calculateYearFraction(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const milliseconds = end.getTime() - start.getTime();

  return milliseconds / MS_PER_DAY / 365.25;
}
