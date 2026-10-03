# Work 13 — Dedicated workspace proposal

## Scope

`/workspace` is a Spanish, light-theme, navigable design proposal: load, analyze, export. The original Lab retains its existing chrome and tools. A route-aware SiteFrame gives the workspace its own header and page spacing; CSS Modules keep its light palette scoped. No new dependencies, network requests, local storage or financial engine changes.

All four example holdings and chart paths are illustrative. Metrics intentionally remain unavailable instead of presenting invented computed values. Inputs are read-only; real loading is Work 14. Export format selection works; download is visibly disabled until Work 16–17. The current risk tool remains reachable.

## Reuse inventory

- Loading: `src/lib/analysis-transfer.ts`, `src/lib/market-data/client.ts`, `src/lib/market-data/ars-history.ts` and provider currency checks.
- Allocation validation: `src/lib/finance/risk/portfolio-risk-analyzer.ts`.
- Analysis: `src/lib/finance/risk/portfolio-risk-analysis.ts`, `risk-contribution.ts`, `tail-risk.ts` and portfolio analytics.
- Reports: `src/lib/finance/risk/meeting-report.ts` already supplies report data and HTML/Markdown. PNG/ZIP/PDF generation remains to implement.
- Persistence: existing saved-analysis contracts can be reused after deciding the workspace draft schema.

Do not embed the complete RiskModuleShell in the new workspace: extract data orchestration and map the existing engine outputs to the smaller view. Reuse the same result snapshot for screen and later exports. Preserve currency, coverage, missing-data handling and explicit exclusions. Historical analysis of current weights must not be labelled actual account performance.

## Branch dependency

Work 12 PR #51 is still open. This branch is based on its latest remote commit `ed65d9d7e5c98b52bb63d62a71c176652c0802e7`; open Work 13 against that branch to review only the design changes. Integrate Work 12 before retargeting Work 13 to main. No production merge is part of this visual proposal.

## Acceptance

Navigate all three steps in both directions; select both export formats; disabled download remains disabled. Confirm scoped light theme and original Lab navigation across client transitions. Check desktop and narrow-screen overflow, labels and focus states. Run existing tests, typecheck, lint and production build.
