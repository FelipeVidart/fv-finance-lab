import type { PortfolioAnalytics } from "@/lib/finance/portfolio";
import type { MarketDataExplorerPayload } from "@/lib/market-data/types";
import type { ArgentineInstrumentContextAnalysis, CurrentVsProposedRiskComparison, PortfolioRiskAnalysis, PortfolioScenarioAnalysis } from "@/lib/finance/risk/types";

export type ReportTable = { title: string; headers: string[]; rows: string[][] };
export type MeetingReport = { title: string; note: string; tables: ReportTable[]; notes: string[] };
export type MeetingReportInput = {
  title: string;
  note: string;
  data: MarketDataExplorerPayload;
  portfolio: PortfolioAnalytics;
  risk: PortfolioRiskAnalysis;
  value: number | null;
  currency: "ARS" | "USD";
  scenarios: PortfolioScenarioAnalysis | null;
  comparison: CurrentVsProposedRiskComparison | null;
  proposedWeights: Record<string, number> | null;
  context: ArgentineInstrumentContextAnalysis | null;
};

const percent = (value: number) => Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : "N/A";
const pp = (value: number) => Number.isFinite(value) ? `${(value * 100).toFixed(2)} pp` : "N/A";
export function buildMeetingReport(input: MeetingReportInput): MeetingReport {
  const { data, portfolio, risk, value, currency, scenarios, comparison, proposedWeights, context } = input;
  const money = (amount: number | null) => amount !== null && Number.isFinite(amount) ? new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount) : "N/A";
  const riskMoney = (fraction: number) => money(value === null ? null : value * fraction);
  const tables: ReportTable[] = [
    { title: "Analysis basis", headers: ["Field", "Value"], rows: [
      ["Data provider", data.meta.provider], ["Historical window", `${data.meta.commonStartDate} to ${data.meta.commonEndDate}`],
      ["Risk return observations", String(risk.methodology.observations)], ["Confidence level", percent(risk.tailRisk.confidenceLevel)],
      ["EWMA lambda (parametric volatility)", String(risk.methodology.ewmaLambda)],
      ["VaR / ES horizon", "One trading day"], ["Portfolio value (manual input)", money(value)], ["Presentation currency", currency],
    ] },
    { title: "Portfolio allocation", headers: ["Instrument", "Current weight", "Proposed weight", "Argentina family"], rows: portfolio.tickers.map((ticker) => [ticker, percent(portfolio.weights[ticker]), comparison && proposedWeights ? percent(proposedWeights[ticker]) : "N/A", context?.rows.find((row) => row.ticker === ticker)?.familyName ?? "Unclassified"]) },
    { title: "Historical performance and risk", headers: ["Metric", "Percent", "Amount"], rows: [
      ["Historical total return", percent(portfolio.metrics.totalReturn), "N/A"],
      ["Annualized volatility (252 trading days)", percent(portfolio.metrics.annualizedVolatility), "N/A"],
      ["Maximum historical drawdown", percent(risk.drawdownSummary.maxDrawdown), "N/A"],
      ["Historical VaR (daily)", percent(risk.tailRisk.historicalVaR), riskMoney(risk.tailRisk.historicalVaR)],
      ["Historical Expected Shortfall (daily)", percent(risk.tailRisk.historicalExpectedShortfall), riskMoney(risk.tailRisk.historicalExpectedShortfall)],
      ["Parametric VaR (daily)", percent(risk.tailRisk.parametricVaR), riskMoney(risk.tailRisk.parametricVaR)],
    ] },
    { title: "Instrument risk attribution (covariance VaR)", headers: ["Instrument", "Weight", "Component VaR", "Share of VaR"], rows: risk.instrumentVaRContribution.rows.map((row) => [row.ticker, percent(row.weight), percent(row.componentVaR), percent(row.contributionShare)]) },
  ];
  if (scenarios) {
    tables.push({ title: "Hypothetical scenarios", headers: ["Scenario", "Estimated impact", "Amount", "Factor shocks"], rows: scenarios.scenarios.map((scenario) => [scenario.scenarioName, percent(scenario.estimatedImpact), money(scenario.monetaryImpact), scenario.factorShocks.map((shock) => `${shock.factorName}: ${percent(shock.shock)}`).join("; ")]) });
  }
  if (comparison) {
    tables.push({ title: "Current vs proposed", headers: ["Metric", "Current", "Proposed", "Delta (proposed minus current)"], rows: comparison.metricRows.map((row) => [row.label, percent(row.current), percent(row.proposed), pp(row.delta)]) });
    tables.push({ title: "Largest covariance VaR contributor", headers: ["Current", "Proposed"], rows: [[comparison.current.maxRiskContributor ?? "N/A", comparison.proposed.maxRiskContributor ?? "N/A"]] });
  }
  const notes = [
    "Historical estimates describe the selected sample, not guaranteed future performance. VaR is not a maximum possible loss; losses can exceed it.",
    "Monetary VaR/ES apply the estimated loss fraction to the manually entered portfolio value. Presentation currency does not convert historical price series or establish FX-adjusted returns.",
    "Instrument attribution uses covariance/parametric VaR and can differ from historical VaR. Negative components can represent diversification.",
    "The portfolio uses fixed weights on aligned daily return series. Fees, taxes, trading costs and product suitability are not evaluated.",
    scenarios ? "Scenario estimates are hypothetical factor shocks using fitted exposures, not forecasts or guaranteed outcomes." : "Scenarios unavailable: factor analysis is absent or not ready.",
    comparison ? "Current and proposed portfolios use the same historical dataset. Deltas are percentage points; a lower metric alone is not a recommendation." : "Current vs proposed comparison unavailable: validate proposed weights and wait for the comparison calculation.",
    "Argentina classifications are manual context; they do not alter historical risk calculations. Fund look-through and manual bond cash-flow analyses are separate and are not consolidated into this report.",
    ...(data.meta.warnings ?? []).map((warning) => warning.message), ...risk.methodology.warnings,
    ...(scenarios?.methodology.warnings ?? []), ...(comparison?.methodology.warnings ?? []), ...(context?.methodology.warnings ?? []),
  ];
  return { title: input.title.trim() || "Portfolio meeting summary", note: input.note.trim(), tables, notes: [...new Set(notes)] };
}

const escapeHTML = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
export function renderMeetingReportHTML(report: MeetingReport, generatedAt: string) {
  const html = escapeHTML;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${html(report.title)}</title><style>body{font:14px system-ui,sans-serif;color:#111;margin:32px auto;padding:0 20px;max-width:1000px}h1{font-size:26px}h2{font-size:18px;margin-top:28px}table{border-collapse:collapse;width:100%;margin:12px 0;table-layout:fixed}th,td{border:1px solid #ccc;text-align:left;padding:8px;overflow-wrap:anywhere}th{background:#eee}p,li{line-height:1.5;white-space:pre-wrap}li{margin-bottom:8px}.meta{color:#555}@media print{body{margin:0;max-width:none;font-size:10pt}thead{display:table-header-group}tr{break-inside:avoid}h2{break-after:avoid}@page{size:A4;margin:15mm}}</style></head><body><h1>${html(report.title)}</h1><p class="meta">FV Finance Lab | Generated ${html(generatedAt)} | Analytical meeting draft</p>${report.note ? `<p>${html(report.note)}</p>` : ""}${report.tables.map((table) => `<h2>${html(table.title)}</h2><table><thead><tr>${table.headers.map((header) => `<th>${html(header)}</th>`).join("")}</tr></thead><tbody>${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${html(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`).join("")}<h2>Assumptions and limitations</h2><ul>${report.notes.map((note) => `<li>${html(note)}</li>`).join("")}</ul></body></html>`;
}
const escapeMarkdown = (value: string) => value.replace(/[\\`*_{}[\]()#+.!<>|~-]/g, "\\$&").replace(/\r?\n/g, " ");
export function renderMeetingReportMarkdown(report: MeetingReport, generatedAt: string) {
  const md = escapeMarkdown;
  return [`# ${md(report.title)}`, `FV Finance Lab | Generated ${md(generatedAt)} | Analytical meeting draft`, report.note ? md(report.note) : "", ...report.tables.map((table) => `## ${md(table.title)}\n\n| ${table.headers.map(md).join(" | ")} |\n| ${table.headers.map(() => "---").join(" | ")} |\n${table.rows.map((row) => `| ${row.map(md).join(" | ")} |`).join("\n")}`), `## Assumptions and limitations\n\n${report.notes.map((note) => `- ${md(note)}`).join("\n")}`].filter(Boolean).join("\n\n");
}
