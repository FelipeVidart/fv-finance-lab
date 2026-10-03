# Work 14 — Real portfolio loading

## User flow

`/workspace` now opens a real draft instead of a fixed example. Edit up to 30 positions as amounts or percentages; choose ARS/USD and a Yahoo lookback. CSV positions use `ticker,value,kind` with `investment` or `money-market`. Download a template, review imported positions, and explicitly apply them. Decimal commas/points are accepted in the table; no thousands separators. Consolidate duplicate symbols, including ARS aliases with/without .BA.

Money-market rows are excluded from investment weights. The known BCMMA cash identifier defaults to that type; other funds need explicit classification. Manual exclusions stay visible. Percentages of included positions must total 100%; amounts normalize by included value. Changing mode does not convert values silently.

Inspect Yahoo history (ARS local .BA symbols or verified USD) or import `date,ticker,close,currency,source`. CSV symbols must match table labels; rejects mixed currencies, unknown symbols, duplicate dates, invalid prices and dates. Requires three common dates. Uses actual CSV dates, without filling gaps. Uploaded sources/adjustments are user-declared; Yahoo uses adjusted close when available.

The coverage preview lists original and resulting weights, missing symbols/reasons, shared dates and source. Partial coverage needs a checked acknowledgement before applying exclusions and renormalization. Applying retains the table's relative allocation, never equal weights. Analysis currently shows real portfolio return, volatility, drawdown and applied weights through the existing engine; graphs arrive in Work 15. Export stays disabled until Work 16–17. Historical composition is explicitly a daily-rebalanced simulation, not account performance.

## Data and persistence

Portfolio amounts and name stay in the browser. The history endpoint gets included tickers with unit placeholder values; only symbols and period reach Yahoo. CSV positions and histories are processed locally. A versioned localStorage draft remembers inputs and exclusions (including incomplete edits), but not histories or results. After reload, review/load histories again. Corrupt or inaccessible storage is reported and not overwritten silently.

Input edits invalidate pending/applied results and advance a sequence token. Stale Yahoo/file-read completions are ignored. Theme preference remains compatible with Work 13.

The original visual proposal is available at `/workspace/design`.

## Dependency and validation

Stacked on Work 13 PR #52, which depends on Work 12 #51. No production merge.

56 tests pass, including cash exclusion, original allocation preservation, partial-confirmation enforcement, USD/ARS validation, no date filling, duplicate symbols/dates and corrupt persisted drafts. Typecheck, lint and production build pass. Browser flow validation follows on the deployed preview.
