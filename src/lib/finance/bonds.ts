export type FixedRateBondInput = {
  faceValue: number;
  couponRate: number;
  yieldToMaturity: number;
  yearsToMaturity: number;
  paymentsPerYear: number;
};

export type BondTradingStatus = "premium" | "discount" | "par";

export type FixedRateBondCashFlow = {
  period: number;
  timeInYears: number;
  cashFlow: number;
  presentValue: number;
};

export type FixedRateBondAnalytics = {
  input: FixedRateBondInput;
  price: number;
  annualCoupon: number;
  periodicCoupon: number;
  currentYield: number;
  macaulayDuration: number;
  modifiedDuration: number;
  pvCoupons: number;
  pvFaceValue: number;
  totalPeriods: number;
  finalCashFlow: number;
  tradingStatus: BondTradingStatus;
  cashFlows: FixedRateBondCashFlow[];
};

export function calculateFixedRateBondAnalytics(
  input: FixedRateBondInput,
): FixedRateBondAnalytics {
  if (input.faceValue <= 0) {
    throw new Error("Face value must be positive.");
  }

  if (input.couponRate < 0) {
    throw new Error("Coupon rate cannot be negative.");
  }

  if (input.yearsToMaturity <= 0) {
    throw new Error("Years to maturity must be positive.");
  }

  if (!Number.isInteger(input.paymentsPerYear) || input.paymentsPerYear <= 0) {
    throw new Error("Payments per year must be a positive integer.");
  }

  const totalPeriodsRaw = input.yearsToMaturity * input.paymentsPerYear;

  if (!Number.isInteger(totalPeriodsRaw)) {
    throw new Error(
      "Years to maturity must align with the selected payment frequency.",
    );
  }

  const periodicYield = input.yieldToMaturity / input.paymentsPerYear;

  if (periodicYield <= -1) {
    throw new Error("Yield to maturity is too low for the selected frequency.");
  }

  const annualCoupon = input.faceValue * input.couponRate;
  const periodicCoupon = annualCoupon / input.paymentsPerYear;
  const totalPeriods = totalPeriodsRaw;
  const pvFaceValue =
    input.faceValue / (1 + periodicYield) ** totalPeriods;

  let pvCoupons = 0;
  let weightedPresentValueTime = 0;

  const cashFlows = Array.from({ length: totalPeriods }, (_, index) => {
    const period = index + 1;
    const timeInYears = period / input.paymentsPerYear;
    const cashFlow =
      period === totalPeriods
        ? periodicCoupon + input.faceValue
        : periodicCoupon;
    const presentValue = cashFlow / (1 + periodicYield) ** period;

    if (period < totalPeriods) {
      pvCoupons += presentValue;
    } else {
      pvCoupons += periodicCoupon / (1 + periodicYield) ** period;
    }

    weightedPresentValueTime += timeInYears * presentValue;

    return {
      period,
      timeInYears,
      cashFlow,
      presentValue,
    };
  });

  const price = pvCoupons + pvFaceValue;
  const macaulayDuration = weightedPresentValueTime / price;
  const modifiedDuration = macaulayDuration / (1 + periodicYield);

  return {
    input,
    price,
    annualCoupon,
    periodicCoupon,
    currentYield: annualCoupon / price,
    macaulayDuration,
    modifiedDuration,
    pvCoupons,
    pvFaceValue,
    totalPeriods,
    finalCashFlow: periodicCoupon + input.faceValue,
    tradingStatus: classifyBondTradingStatus(price, input.faceValue),
    cashFlows,
  };
}

export function classifyBondTradingStatus(
  price: number,
  faceValue: number,
  toleranceRatio: number = 0.001,
): BondTradingStatus {
  const tolerance = faceValue * toleranceRatio;

  if (Math.abs(price - faceValue) <= tolerance) {
    return "par";
  }

  return price > faceValue ? "premium" : "discount";
}
