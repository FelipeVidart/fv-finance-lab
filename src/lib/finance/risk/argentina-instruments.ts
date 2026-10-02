import type {
  ArgentineFamilyExposureRow,
  ArgentineInstrumentContextAnalysis,
  ArgentineInstrumentContextInput,
  ArgentineInstrumentFamilyDefinition,
  ArgentineInstrumentFamilyId,
} from "@/lib/finance/risk/types";

const ARGENTINA_EQUITY_TICKERS = new Set([
  "ALUA",
  "BBAR",
  "BMA",
  "BYMA",
  "CEPU",
  "COME",
  "EDN",
  "GGAL",
  "LOMA",
  "MIRG",
  "PAMP",
  "SUPV",
  "TECO2",
  "TGNO4",
  "TGSU2",
  "TRAN",
  "TXAR",
  "YPFD",
]);

const HARD_DOLLAR_TICKER_PATTERN = /^(AL|GD|AE|GE)\d{2}[A-Z]?$/;
const CER_TICKER_PATTERN = /^(TX|TZX|TC|T2X|X|CUAP|DICP|PARP)\w*$/;
const FIXED_RATE_ARS_TICKER_PATTERN = /^(S|LECAP|BONCAP)\w*$/;

export const ARGENTINE_INSTRUMENT_FAMILIES: ArgentineInstrumentFamilyDefinition[] =
  [
    {
      id: "sovereign-hard-dollar",
      name: "Sovereign hard-dollar bond",
      shortName: "Hard-dollar sovereign",
      localExamples: ["AL30", "GD30"],
      currencyAndExposure:
        "Contractual flows in USD; local price can be observed in ARS or USD.",
      riskLevel: "High, driven mainly by sovereign credit and exit price.",
      volatilityProfile: "High in USD, especially when spreads or liquidity move.",
      liquidityProfile:
        "Usually stronger in active species, but can deteriorate in stress.",
      horizon: "Years or explicit cash-flow matching.",
      primaryRisks: ["sovereign credit", "spread", "rate", "liquidity"],
      returnDrivers: [
        "coupon and amortization schedule",
        "entry price versus remaining cash flows",
        "sovereign spread compression or widening",
      ],
      usefulFor: [
        "USD income planning",
        "exposure to sovereign credit improvement",
        "cash-flow matching when losses can be tolerated",
      ],
      verificationChecklist: [
        "Verify residual cash-flow schedule, law, accrued interest, clean versus dirty price, and settlement currency.",
        "Check concentration in Argentine sovereign risk before adding exposure.",
        "Confirm MEP/CCL conversion rules and internal procedures if the position is part of an FX workflow.",
      ],
      clientQuestions: [
        "What date do you need the dollars available?",
        "Could you hold if a USD 10,000 position marked near USD 8,000?",
        "How much of your wealth already depends on Argentina?",
      ],
      interpretationBoundary:
        "A USD-denominated bond is not USD cash and does not guarantee capital preservation in dollars.",
    },
    {
      id: "cer",
      name: "CER-linked bond",
      shortName: "CER",
      localExamples: ["TZX27", "TZXM7", "TX26"],
      currencyAndExposure:
        "ARS payment adjusted by CER, with inflation indexation lag and market-price risk.",
      riskLevel: "Medium to high, depending on credit, real duration, and entry price.",
      volatilityProfile:
        "Lower in very short tenors; can be high in longer real-duration bonds.",
      liquidityProfile: "Variable by species and market conditions.",
      horizon: "Months to years, aligned with the inflation-sensitive expense.",
      primaryRisks: ["sovereign credit", "real-rate", "inflation basis", "liquidity"],
      returnDrivers: [
        "CER adjustment",
        "real yield at entry",
        "changes in required real rates",
      ],
      usefulFor: [
        "inflation-linked ARS objectives",
        "real-rate exposure",
        "cash-flow matching for expenses tied to CPI-like references",
      ],
      verificationChecklist: [
        "Verify CER dates, indexation lag, amortization, coupon, technical value, and real yield.",
        "Separate short cash needs from longer CER duration risk.",
        "Check total Treasury exposure, including exposure held through funds.",
      ],
      clientQuestions: [
        "Which expense are you trying to match and does it really follow CPI?",
        "What is the earliest date when you might need to sell?",
        "Do you have a separate emergency reserve?",
      ],
      interpretationBoundary:
        "CER indexation does not mean the position always beats inflation; price, real rates, lag, and credit still matter.",
    },
    {
      id: "dollar-linked",
      name: "Dollar-linked instrument",
      shortName: "Dollar linked",
      localExamples: ["TV26", "corporate dollar-linked notes"],
      currencyAndExposure:
        "Usually pays ARS according to a contractual FX reference and fixing date.",
      riskLevel: "Medium to high, depending on issuer, basis risk, and tenor.",
      volatilityProfile: "Variable; rises with FX expectations and longer tenors.",
      liquidityProfile: "Depends heavily on the specific instrument and demand for hedges.",
      horizon: "Months to years, matched to the reference and payment date.",
      primaryRisks: ["issuer credit", "FX basis", "fixing lag", "liquidity"],
      returnDrivers: [
        "contractual FX reference",
        "price paid for the hedge",
        "issuer spread and ARS rates",
      ],
      usefulFor: [
        "ARS obligations linked to the same FX reference",
        "official-FX hedge analysis",
        "basis-risk education",
      ],
      verificationChecklist: [
        "Read the exact FX reference, fixing date, payment currency, and substitution clauses.",
        "Compare the instrument reference with the client's real obligation currency.",
        "Escalate derivative or basis-hedge questions to the proper internal review.",
      ],
      clientQuestions: [
        "Is your obligation tied to official FX, MEP, CCL, or another formula?",
        "When is the FX fixed and when do you need funds available?",
        "Do you need USD cash or ARS equivalent?",
      ],
      interpretationBoundary:
        "Dollar linked does not mean the client receives dollars or is hedged against every dollar reference.",
    },
    {
      id: "fixed-rate-ars",
      name: "Fixed-rate ARS instrument",
      shortName: "Fixed ARS",
      localExamples: ["LECAP", "BONCAP"],
      currencyAndExposure:
        "Nominal ARS cash flows with no contractual CPI or FX adjustment.",
      riskLevel: "Variable; short instruments can be lower duration but still carry issuer and currency risk.",
      volatilityProfile: "Lower in very short instruments; higher as nominal duration rises.",
      liquidityProfile: "Variable by title, amount, and market depth.",
      horizon: "Days to years, preferably aligned with a nominal ARS expense.",
      primaryRisks: ["inflation", "FX measurement", "rate", "issuer credit"],
      returnDrivers: [
        "entry yield",
        "nominal rate curve",
        "disinflation or rate repricing",
      ],
      usefulFor: [
        "known ARS payments",
        "peso carry",
        "nominal cash-flow planning",
      ],
      verificationChecklist: [
        "Compare TNA, TEA, and holding-period return on the same basis.",
        "Verify cash-flow dates, day-count base, clean/dirty price, and net costs.",
        "Stress the result in purchasing power and in the client's reference currency.",
      ],
      clientQuestions: [
        "Is the expense fixed in pesos or can it move with inflation or FX?",
        "Can you wait until maturity?",
        "Do you measure success in ARS, real terms, or USD?",
      ],
      interpretationBoundary:
        "A fixed peso return can be positive in ARS and still lose purchasing power or USD value.",
    },
    {
      id: "corporate-bond",
      name: "Obligacion Negociable",
      shortName: "ON",
      localExamples: ["local corporate bonds"],
      currencyAndExposure:
        "ARS, USD, dollar-linked, CER, or floating-rate exposure depending on the contract.",
      riskLevel: "From relatively low to high; issuer, guarantees, and duration drive the range.",
      volatilityProfile: "Can be low for strong short credit or high for stressed/longer issues.",
      liquidityProfile: "Often instrument-specific; some issues may require holding to cash flows.",
      horizon: "One to several years, or matched to the bond schedule.",
      primaryRisks: ["corporate credit", "liquidity", "call", "subordination"],
      returnDrivers: [
        "coupon and amortization schedule",
        "issuer spread",
        "business cash-flow quality",
        "currency or indexation terms",
      ],
      usefulFor: [
        "income generation",
        "issuer and sector diversification",
        "cash-flow planning when credit is understood",
      ],
      verificationChecklist: [
        "Review legal issuer, financial statements, prospectus, supplement, covenants, guarantees, and call features.",
        "Check issuer, sector, and group concentration across direct holdings and funds.",
        "Confirm settlement species, minimums, tax treatment, and payment notices.",
      ],
      clientQuestions: [
        "Do you need periodic income or capital accumulation?",
        "Could you hold if there is no buyer at a reasonable price?",
        "What total weight would this issuer and sector have in your portfolio?",
      ],
      interpretationBoundary:
        "A familiar company name, high coupon, or rating is not enough to establish suitability or safety.",
    },
    {
      id: "caucion",
      name: "Caucion colocadora",
      shortName: "Caucion",
      localExamples: ["ARS caucion", "USD caucion"],
      currencyAndExposure:
        "ARS or USD short-term market financing with pledged collateral in the market structure.",
      riskLevel: "Relatively low for the placer, but not zero.",
      volatilityProfile: "Low mark-to-market exposure for matched short placements.",
      liquidityProfile: "Funds are committed until the agreed maturity.",
      horizon: "Very short term, with a specific availability date.",
      primaryRisks: ["liquidity timing", "operational", "inflation", "collateral stress"],
      returnDrivers: [
        "agreed annualized rate",
        "days to maturity",
        "net costs",
        "short-term system liquidity",
      ],
      usefulFor: [
        "temporary cash management",
        "scheduled liquidity",
        "short-term yield on idle cash",
      ],
      verificationChecklist: [
        "Confirm effective date, maturity, currency, day-count base, net rate, total costs, and final cash amount.",
        "Do not assume early exit or weekend availability.",
        "For tomadora, review leverage, collateral calls, and liquidation risk separately.",
      ],
      clientQuestions: [
        "When exactly do you need the money back?",
        "In which currency?",
        "Does the net return justify the costs for this size and term?",
      ],
      interpretationBoundary:
        "Caucion is not a bank deposit or immediate-rescue fund; availability follows the agreed operation.",
    },
    {
      id: "fci",
      name: "Fondo Comun de Inversion",
      shortName: "FCI",
      localExamples: ["open-ended local funds"],
      currencyAndExposure:
        "Depends on fund class, assets, strategy, and permitted exposures.",
      riskLevel: "From relatively low to high depending on the underlying portfolio.",
      volatilityProfile: "Driven by duration, credit, currency, equity, and liquidity in the fund.",
      liquidityProfile: "Redemption follows fund rules, cutoffs, and exceptional contingencies.",
      horizon: "Days to years depending on the actual assets.",
      primaryRisks: ["market", "credit", "liquidity", "strategy", "look-through concentration"],
      returnDrivers: [
        "underlying asset returns",
        "manager positioning",
        "expenses and class conditions",
      ],
      usefulFor: [
        "professional management",
        "diversified access",
        "liquidity, inflation, income, or growth depending on the fund",
      ],
      verificationChecklist: [
        "Read regulation, factsheet, dated holdings, currency, class, fees, minimums, cutoff, and redemption timing.",
        "Look through to avoid duplicate issuers, sectors, or factors.",
        "Do not translate portfolio YTM into a promised investor return.",
      ],
      clientQuestions: [
        "What role should the fund play: cash, inflation, currency, income, or growth?",
        "Do you need frequent redemptions?",
        "Which other funds and direct securities do you already hold?",
      ],
      interpretationBoundary:
        "The fund label is not the risk model; holdings and regulation define the exposure.",
    },
    {
      id: "money-market",
      name: "Money market fund",
      shortName: "Money market",
      localExamples: ["classic ARS money market funds"],
      currencyAndExposure:
        "Usually short-term ARS or USD fund exposure depending on class and regulation.",
      riskLevel: "Relatively low, but not zero.",
      volatilityProfile: "Low in classic funds; dynamic variants can oscillate more.",
      liquidityProfile: "Fast redemption subject to fund, channel, hours, and contingencies.",
      horizon: "Days to weeks.",
      primaryRisks: ["short-rate", "liquidity", "credit", "inflation", "FX measurement"],
      returnDrivers: [
        "short-term rates",
        "portfolio renewal speed",
        "fund expenses",
      ],
      usefulFor: [
        "cash parking",
        "short-term reserves",
        "operational liquidity",
      ],
      verificationChecklist: [
        "Confirm classic versus dynamic category, holdings, currency, redemption hours, channel, and settlement.",
        "Keep a separate direct-availability buffer for exact-hour obligations.",
        "Avoid presenting recent annualized yield as a locked forward rate.",
      ],
      clientQuestions: [
        "Is this an emergency reserve or scheduled cash?",
        "Do you need funds outside operating hours?",
        "Does the objective tolerate variable returns and redemption contingencies?",
      ],
      interpretationBoundary:
        "A stable daily series does not prove zero risk or guaranteed access.",
    },
    {
      id: "argentina-equity",
      name: "Argentine equity",
      shortName: "Local equity",
      localExamples: ["GGAL", "YPFD", "PAMP"],
      currencyAndExposure:
        "Usually traded in ARS; business exposure can be local, regulated, USD-linked, or mixed.",
      riskLevel: "High.",
      volatilityProfile: "High in ARS and often high in USD.",
      liquidityProfile: "High to low depending on name and size.",
      horizon: "Several years for planning, with no guaranteed recovery date.",
      primaryRisks: ["business", "valuation", "regulation", "liquidity", "minority shareholder"],
      returnDrivers: [
        "earnings and cash-flow growth",
        "valuation multiple",
        "dividends",
        "macro and regulatory changes",
      ],
      usefulFor: [
        "capital appreciation",
        "local sector exposure",
        "cyclical recovery themes",
      ],
      verificationChecklist: [
        "Review financial statements, material events, share class, liquidity, valuation, debt, and dilution risk.",
        "Check the client's broader economic exposure to Argentina and the sector.",
        "Do not present dividends as a fixed rate.",
      ],
      clientQuestions: [
        "How long can you hold without selling to cover expenses?",
        "What ARS and USD drawdown would force a plan change?",
        "Does your job, company, or property exposure already depend on the same country or sector?",
      ],
      interpretationBoundary:
        "A good company can still be a bad investment at the wrong price or for the wrong client objective.",
    },
    {
      id: "cedear",
      name: "CEDEAR or CEDEAR ETF",
      shortName: "CEDEAR",
      localExamples: ["AAPL", "SPY", "QQQ"],
      currencyAndExposure:
        "Local certificate with foreign underlying exposure and CCL-linked ARS pricing.",
      riskLevel: "Medium-high to high depending on the underlying asset.",
      volatilityProfile: "High in ARS; variable in USD depending on underlying and FX.",
      liquidityProfile: "Variable by program, ratio, and local market depth.",
      horizon: "Several years for traditional equity or broad ETF exposure.",
      primaryRisks: ["underlying market", "CCL", "program", "liquidity", "FX measurement"],
      returnDrivers: [
        "foreign underlying return",
        "CCL movement",
        "ratio and corporate events",
        "dividends net of withholdings and fees",
      ],
      usefulFor: [
        "international diversification",
        "foreign equity or ETF exposure",
        "reducing local economic concentration",
      ],
      verificationChecklist: [
        "Confirm ratio, depositary program, liquidity, simultaneous prices, fees, withholdings, and corporate events.",
        "Explain ARS return as underlying times CCL effect, not as pure dollar protection.",
        "Check overlap across global ETFs and direct names.",
      ],
      clientQuestions: [
        "Do you want global diversification or exposure to a specific company/theme?",
        "Will you measure results in ARS, CCL dollars, or another currency?",
        "Would a diversified ETF better match the need than a single famous stock?",
      ],
      interpretationBoundary:
        "A CEDEAR is not simply buying dollars; it combines underlying market risk and local FX mechanics.",
    },
    {
      id: "unknown",
      name: "Unclassified instrument",
      shortName: "Unclassified",
      localExamples: [],
      currencyAndExposure:
        "Manual classification required before applying Argentina-specific checks.",
      riskLevel: "Unknown until the contract or product wrapper is identified.",
      volatilityProfile: "Unknown.",
      liquidityProfile: "Unknown.",
      horizon: "Unknown.",
      primaryRisks: ["classification", "documentation", "suitability"],
      returnDrivers: ["unknown until reviewed"],
      usefulFor: ["manual review before interpretation"],
      verificationChecklist: [
        "Identify issuer, wrapper, currency, payment formula, settlement, and documentation before using the risk interpretation.",
      ],
      clientQuestions: [
        "What objective, currency, date, liquidity need, and loss capacity does this position serve?",
      ],
      interpretationBoundary:
        "No Argentina-specific interpretation should be used until the instrument family is confirmed.",
    },
  ];

export const ARGENTINE_INSTRUMENT_FAMILY_BY_ID = Object.fromEntries(
  ARGENTINE_INSTRUMENT_FAMILIES.map((family) => [family.id, family]),
) as Record<ArgentineInstrumentFamilyId, ArgentineInstrumentFamilyDefinition>;

export function inferArgentineInstrumentFamily(
  ticker: string,
): ArgentineInstrumentFamilyId {
  const normalizedTicker = ticker.trim().toUpperCase();

  if (ARGENTINA_EQUITY_TICKERS.has(normalizedTicker)) {
    return "argentina-equity";
  }

  if (HARD_DOLLAR_TICKER_PATTERN.test(normalizedTicker)) {
    return "sovereign-hard-dollar";
  }

  if (CER_TICKER_PATTERN.test(normalizedTicker)) {
    return "cer";
  }

  if (FIXED_RATE_ARS_TICKER_PATTERN.test(normalizedTicker)) {
    return "fixed-rate-ars";
  }

  if (/^[A-Z]{1,5}$/.test(normalizedTicker)) {
    return "cedear";
  }

  return "unknown";
}

export function buildDefaultArgentineInstrumentFamilyMap(
  tickers: string[],
): Record<string, ArgentineInstrumentFamilyId> {
  return Object.fromEntries(
    tickers.map((ticker) => [ticker, inferArgentineInstrumentFamily(ticker)]),
  );
}

export function buildArgentineInstrumentContextAnalysis({
  tickers,
  weights,
  familyByTicker,
}: ArgentineInstrumentContextInput): ArgentineInstrumentContextAnalysis {
  const warnings: string[] = [];
  const rows = tickers.map((ticker) => {
    const inferredFamilyId = inferArgentineInstrumentFamily(ticker);
    const familyId = familyByTicker[ticker] ?? inferredFamilyId;
    const definition =
      ARGENTINE_INSTRUMENT_FAMILY_BY_ID[familyId] ??
      ARGENTINE_INSTRUMENT_FAMILY_BY_ID.unknown;

    if (definition.id === "unknown") {
      warnings.push(
        `${ticker} is unclassified. Confirm the wrapper before using Argentina-specific interpretation.`,
      );
    }

    return {
      ticker,
      weight: weights[ticker] ?? 0,
      familyId: definition.id,
      familyName: definition.name,
      currencyAndExposure: definition.currencyAndExposure,
      horizon: definition.horizon,
      primaryRisks: definition.primaryRisks,
      returnDrivers: definition.returnDrivers,
      verificationChecklist: definition.verificationChecklist,
      inferred: familyId === inferredFamilyId,
    };
  });

  const exposureByFamily = new Map<ArgentineInstrumentFamilyId, number>();

  for (const row of rows) {
    exposureByFamily.set(
      row.familyId,
      (exposureByFamily.get(row.familyId) ?? 0) + row.weight,
    );
  }

  const familyExposures = [...exposureByFamily.entries()]
    .map(([familyId, weight]): ArgentineFamilyExposureRow => {
      const definition = ARGENTINE_INSTRUMENT_FAMILY_BY_ID[familyId];

      return {
        familyId,
        familyName: definition.name,
        weight,
        currencyAndExposure: definition.currencyAndExposure,
        primaryRisks: definition.primaryRisks,
      };
    })
    .sort((a, b) => b.weight - a.weight);

  return {
    rows,
    familyExposures,
    dominantFamily: familyExposures[0] ?? null,
    checklist: dedupe(rows.flatMap((row) => row.verificationChecklist)).slice(
      0,
      8,
    ),
    clientQuestions: dedupe(
      rows.flatMap(
        (row) =>
          ARGENTINE_INSTRUMENT_FAMILY_BY_ID[row.familyId].clientQuestions,
      ),
    ).slice(0, 8),
    methodology: {
      source:
        "Manual de supervivencia de instrumentos para Wealth Management en Argentina, edition 2026-09-06.",
      warnings,
    },
  };
}

function dedupe(values: string[]) {
  return [...new Set(values)];
}
