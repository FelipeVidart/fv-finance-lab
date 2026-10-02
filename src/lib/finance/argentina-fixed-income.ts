export type InstrumentCashFlow = { time: number; coupon: number; principal: number };
export type ManualBondInput = {
  cleanPrice: number;
  accruedInterest: number;
  technicalValue: number;
  cashFlows: InstrumentCashFlow[];
};

export function analyzeManualBond(input: ManualBondInput) {
  const { cleanPrice, accruedInterest, technicalValue, cashFlows } = input;
  if (![cleanPrice, accruedInterest, technicalValue].every(Number.isFinite) ||
      cleanPrice <= 0 || accruedInterest < 0 || technicalValue <= 0) {
    throw new Error("Price and technical value must be positive; accrued interest cannot be negative.");
  }
  if (!cashFlows.length || cashFlows.length > 500 || cashFlows.some((flow, index) =>
    ![flow.time, flow.coupon, flow.principal].every(Number.isFinite) ||
    flow.time <= 0 || flow.coupon < 0 || flow.principal < 0 ||
    flow.coupon + flow.principal <= 0 || (index > 0 && flow.time <= cashFlows[index - 1].time))) {
    throw new Error("Enter 1 to 500 positive, chronological cash flows with nonnegative coupons and principal.");
  }
  const dirtyPrice = cleanPrice + accruedInterest;
  const priceAt = (rate: number) => cashFlows.reduce((sum, flow) =>
    sum + (flow.coupon + flow.principal) / (1 + rate) ** flow.time, 0);
  // Positive flows make PV monotonic, allowing a unique bracketed yield solve.
  let low = -0.999999;
  let high = 1;
  while (priceAt(high) > dirtyPrice && high < 1e12) high *= 2;
  if (priceAt(low) < dirtyPrice || priceAt(high) > dirtyPrice) {
    throw new Error("Yield is outside the supported numerical range.");
  }
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    if (priceAt(mid) > dirtyPrice) low = mid;
    else high = mid;
  }
  const yieldRate = (low + high) / 2;
  const macaulayDuration = cashFlows.reduce((sum, flow) =>
    sum + flow.time * (flow.coupon + flow.principal) / (1 + yieldRate) ** flow.time, 0) / dirtyPrice;
  const modifiedDuration = macaulayDuration / (1 + yieldRate);
  const scenarios = [-200, -100, 0, 100, 200].map((basisPoints) => {
    const shockedYield = yieldRate + basisPoints / 10000;
    const price = shockedYield > -1 ? priceAt(shockedYield) : null;
    return { basisPoints, yieldRate: shockedYield, price,
      priceReturn: price === null ? null : price / dirtyPrice - 1,
      durationEstimate: -modifiedDuration * basisPoints / 10000 };
  });
  return {
    dirtyPrice, yieldRate, macaulayDuration, modifiedDuration,
    parity: dirtyPrice / technicalValue,
    nextYearCouponYield: cashFlows.filter((flow) => flow.time <= 1)
      .reduce((sum, flow) => sum + flow.coupon, 0) / cleanPrice,
    totalPayments: cashFlows.reduce((sum, flow) => sum + flow.coupon + flow.principal, 0),
    scenarios,
  };
}
