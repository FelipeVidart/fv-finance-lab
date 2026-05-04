import type { StressPeriodDefinition } from "@/lib/finance/portfolio/types";

export const DEFAULT_STRESS_PERIODS: StressPeriodDefinition[] = [
  {
    id: "covid-crash",
    label: "COVID Crash",
    startDate: "2020-02-19",
    endDate: "2020-03-23",
    description: "Rapid equity market selloff during the initial COVID-19 shock.",
    category: "Equity shock",
  },
  {
    id: "2022-rate-shock",
    label: "2022 Rate Shock",
    startDate: "2022-01-03",
    endDate: "2022-10-14",
    description: "Rising-rate environment that pressured both equities and bonds.",
    category: "Rate shock",
  },
  {
    id: "global-financial-crisis",
    label: "Global Financial Crisis",
    startDate: "2007-10-09",
    endDate: "2009-03-09",
    description:
      "Major credit and equity market crisis during the 2007-2009 financial crisis.",
    category: "Credit / equity crisis",
  },
  {
    id: "dotcom-crash",
    label: "Dotcom Crash",
    startDate: "2000-03-24",
    endDate: "2002-10-09",
    description: "Long equity bear market following the dotcom bubble.",
    category: "Equity bear market",
  },
  {
    id: "2018-q4-selloff",
    label: "2018 Q4 Selloff",
    startDate: "2018-09-20",
    endDate: "2018-12-24",
    description: "Sharp risk-asset selloff during Q4 2018.",
    category: "Equity shock",
  },
];
