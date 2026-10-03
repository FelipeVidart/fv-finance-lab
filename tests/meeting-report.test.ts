import test from "node:test";
import assert from "node:assert/strict";
import { buildMeetingReport, renderMeetingReportHTML, renderMeetingReportMarkdown, type MeetingReportInput } from "@/lib/finance/risk/meeting-report";
import { buildPortfolioAnalytics } from "@/lib/finance/portfolio";
import { buildPortfolioRiskAnalysis } from "@/lib/finance/risk/portfolio-risk-analysis";
import type { MarketDataExplorerPayload } from "@/lib/market-data/types";

function fixture(): MeetingReportInput {
  const data: MarketDataExplorerPayload = { tickers: ["TEST"], period: "1M", metrics: [],
    meta: { provider: "Synthetic", interval: "1day", adjustMode: "all", observations: 30, commonStartDate: "2026-09-01", commonEndDate: "2026-09-30" },
    points: Array.from({ length: 30 }, (_, i) => ({ date: `2026-09-${String(i + 1).padStart(2, "0")}`, prices: { TEST: 100 + i + (i % 3 === 0 ? -3 : 2) }, normalized: {}, cumulativeReturns: {}, drawdowns: {} })) };
  const portfolio = buildPortfolioAnalytics({ data, weights: { TEST: 1 } });
  const risk = buildPortfolioRiskAnalysis({ data, tickers: data.tickers, weights: portfolio.weights, portfolioDailyReturns: portfolio.dailyReturns, portfolioNavPoints: portfolio.points, portfolioValue: 100000 });
  return { title: "Meeting", note: "", data, portfolio, risk, value: 100000, currency: "USD", comparison: null, scenarios: null, proposedWeights: null, context: null };
}
test("report preserves computed weights, risk values, money and unavailable states", () => {
  const input = fixture();
  const report = buildMeetingReport(input);
  assert.deepEqual(report.tables.find((table) => table.title === "Portfolio allocation")?.rows[0], ["TEST", "100.00%", "N/A", "Unclassified"]);
  const row = report.tables.find((table) => table.title === "Historical performance and risk")!.rows.find((row) => row[0] === "Historical VaR (daily)")!;
  assert.equal(row[1], `${(input.risk.tailRisk.historicalVaR * 100).toFixed(2)}%`);
  assert.equal(row[2], new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(input.risk.tailRisk.historicalVaR * 100000));
  assert.ok(report.notes.some((note) => note.startsWith("Scenarios unavailable")));
  const withoutValue = buildMeetingReport({ ...input, value: null });
  assert.equal(withoutValue.tables[2].rows[3][2], "N/A");
});
test("comparison uses percentage-point deltas and scenario assumptions are exported", () => {
  const input = fixture();
  const summary = { id: "current" as const, label: "Current", annualizedVolatility: 0.2, historicalVaR: 0.03, historicalExpectedShortfall: 0.04, maxDrawdown: -0.1, maxRiskContributor: "TEST", topThreeContributionShare: 1 };
  input.comparison = { current: summary, proposed: { ...summary, id: "proposed", label: "Proposed" }, metricRows: [{ key: "annualizedVolatility", label: "Volatility", current: 0.2, proposed: 0.15, delta: -0.05, lowerIsBetter: true }], factorRows: [], summary: { volatilityDelta: -0.05, varDelta: 0, expectedShortfallDelta: 0, topThreeConcentrationDelta: 0, maxRiskContributorChanged: false }, methodology: { warnings: ["Comparison warning"] } };
  input.proposedWeights = { TEST: 1 };
  input.scenarios = { scenarios: [{ scenarioId: "s", scenarioName: "Shock", description: "", hypotheticalLabel: "Hypothetical", estimatedImpact: -0.1, monetaryImpact: -10000, factorShocks: [{ factorId: "f", factorName: "Equity", proxyTicker: "SPY", shock: -0.2 }], instrumentContributions: [], topContributors: [] }], methodology: { scenarioCount: 1, topContributorCount: 0, portfolioValue: 100000, warnings: [] } };
  const report = buildMeetingReport(input);
  assert.equal(report.tables.find((table) => table.title === "Current vs proposed")!.rows[0][3], "-5.00 pp");
  assert.equal(report.tables.find((table) => table.title === "Hypothetical scenarios")!.rows[0][3], "Equity: -20.00%");
  assert.ok(report.notes.includes("Comparison warning"));
});
test("exported HTML and Markdown escape user input and retain assumptions", () => {
  const report = buildMeetingReport({ ...fixture(), title: '<script>alert("test")</script>', note: "[Link](https://example.com) | note" });
  const html = renderMeetingReportHTML(report, "2026-10-03T20:00:00Z");
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("Assumptions and limitations"));
  const md = renderMeetingReportMarkdown(report, "2026-10-03T20:00:00Z");
  assert.ok(md.includes("\\[Link\\]"));
  assert.ok(md.includes("\\| note"));
});
