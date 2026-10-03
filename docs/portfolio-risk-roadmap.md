# Portfolio Risk Analyzer - Audit, V1, Work 2, Work 3, Work 4, Work 5, and Work 6

Date: 2026-10-01

## Scope

This document covers Work 1, Work 2, Work 3, Work 4, Work 5, and Work 6 for the FV Finance Lab Risk module.

- Work 1: audit, architecture decision, and V1 implementation.
- Work 2: instrument-level risk attribution with Marginal VaR, Component VaR, Component VaR %, top contributors, concentration, and weight-vs-risk contribution visualization.
- Work 3: factor attribution review for a Wealth Management Argentina use case, with improved default proxies, clearer interpretation, and synthetic tests.
- Work 4: Scenario Analysis stress module with hypothetical factor shocks, estimated monetary impact, and top contributors.
- Work 5: Current Portfolio vs Proposed Portfolio risk comparison using the same tickers, window, confidence level, and factor proxy set.
- Work 6: Argentina instrument context layer based on a Wealth Management Argentina instrument manual.

Later roadmap phases remain out of scope for this work: instrument-specific fixed-income cash-flow pricing, funds look-through, and automatic investment recommendations.

## Architecture Decision

Chosen architecture: keep the risk engine inside `FelipeVidart/fv-finance-lab` in TypeScript and port or harmonize only missing methodology from `FelipeVidart/portfolio-risk-pipeline`.

Why:

- FV Finance Lab already contains a browser-native TypeScript risk engine under `src/lib/finance/risk` plus a working Next.js Risk UI.
- The V1 requirements are portfolio setup, performance, volatility, drawdown, VaR, Expected Shortfall, confidence-level selection, and money-at-risk display. These are already close to the existing TypeScript shape.
- The Python pipeline is methodologically useful, especially as a reference for EWMA, VaR/ETL, factor GradVaR, regimes, and attribution, but using it as a backend would add deployment, API, serialization, and dependency complexity before V1 needs it.
- Keeping TypeScript as the canonical runtime makes the calculations reproducible in unit tests and directly reusable by the UI.

Canonical source for V1: `fv-finance-lab/src/lib/finance/risk` and portfolio analytics in `fv-finance-lab/src/lib/finance/portfolio.ts`.

Reference source: `portfolio-risk-pipeline/src/portfolio_risk_pipeline/handlers`.

## Functionality Matrix

| Function | Python | Finance Lab | Gap | Implementation chosen |
|---|---|---|---|---|
| Portfolio construction and returns | Exists in `handlers/data.py` via normalized prices, weights, and `pct_change` returns. | Exists in `src/lib/finance/portfolio.ts` via weighted daily returns and normalized NAV. | Finance Lab needed explicit portfolio value/currency controls for WM presentation. | Keep TypeScript. Add V1 controls and money-at-risk formatting in Finance Lab. |
| Volatility | Exists through portfolio returns and EWMA. | Exists via `calculateAnnualizedVolatility`, descriptive stats, rolling annualized volatility. | No major V1 gap. | Keep existing TypeScript volatility logic. |
| EWMA | Exists in `VolatilityEWMAHandler` with lambda 0.94. | Exists in `src/lib/finance/risk/ewma.ts` with lambda 0.94. | No major V1 gap. | Keep existing TypeScript EWMA. |
| Historical VaR | Exists in `VaRHistHandler` using empirical alpha quantile. | Exists in `src/lib/finance/risk/tail-risk.ts` as positive loss. | UI labels were fixed at 95%; V1 needs 95/99 configurable. | Keep TypeScript; wire confidence level through UI. |
| Parametric VaR | Exists in `VaRParamHandler` using mean + z * latest EWMA volatility. | Exists in `src/lib/finance/risk/tail-risk.ts`. | UI labels were fixed at 95%; V1 needs configurable labels and money amounts. | Keep TypeScript; wire confidence level and portfolio value. |
| Expected Shortfall / ETL | Exists in `ETLHandler` as tail mean below alpha quantile. | Exists as `historicalExpectedShortfall` in `tail-risk.ts`. | Needs clearer display as ES/ETL with money-at-risk. | Keep TypeScript and display percent plus currency amount. |
| Simulation / regimes | Exists in `handlers/regimes.py` and docs methodology. | Not part of Finance Lab V1 risk module. | Out of scope for Work 1. | Document as future stress/scenario/regime work. |
| Factor model | Exists in `handlers/factors.py` via factor covariance and betas. | Exists in `src/lib/finance/risk/factor-gradvar.ts`. | Original proxies were too US-centric for Argentina WM use. | Keep TypeScript and update default proxy set in Work 3. |
| Factor GradVaR | Exists in `GradVaRHandler`. | Exists in `buildFactorGradVarAnalysis`. | Needed clearer interpretation and proxy review. | Reuse TypeScript GradVaR; add WM-oriented defaults and summary UI. |
| Risk attribution by factor | Exists in `FactorAttributionHandler`. | Exists in factor GradVaR output/table. | Needed interpretation layer, dominant factor, and model quality summary. | Preserve engine and improve UI/readability in Work 3. |
| Risk attribution by instrument | Exists in `InstrumentAttributionHandler`. | Exists through volatility contribution and factor instrument attribution. | Work 2 needed a canonical Marginal VaR/Component VaR view by instrument. | Keep TypeScript; add covariance-based instrument VaR attribution in `risk-contribution.ts`. |
| Scenario Analysis | Python references simulation/regime methodology; scenario stress is not the V1 core. | Portfolio module had a separate simplified asset-class stress helper. Risk module did not have dedicated Scenario Analysis. | Work 4 needed hypothetical stress tests inside the Risk Analyzer with factor-linked contributors. | Add `src/lib/finance/risk/scenario-analysis.ts` and a dedicated Scenario Analysis UI section. |
| Current vs Proposed | Portfolio module had a broader multi-portfolio lab. | Risk module had only one validated weight set. | Work 5 needed a narrow WM comparison for current vs proposed allocations inside Risk Analyzer. | Add proposed weights, side-by-side risk metrics, factor composition deltas, and comparison tests. |
| Argentina instrument context | Python pipeline did not model Argentina instrument-family interpretation. | Risk module could compute generic market risk but did not explain local wrappers such as CER, dollar linked, ONs, cauciones, FCI, money market, local equities, or CEDEARs. | Work 6 needed an Argentina WM layer without pretending to price every local instrument. | Add `src/lib/finance/risk/argentina-instruments.ts`, editable family classification, exposure summaries, checklists, and tests. |
| Market-data layer | Python downloads Yahoo Finance via yfinance in `handlers/data.py`. | Finance Lab has provider routes and clients for Yahoo/Twelve Data/Stooq under `src/lib/market-data` and `src/app/api/market-data`. | No V1 backend switch needed. | Keep Finance Lab market-data layer. |
| Tests | Python repo has methodology docs but no visible test suite. | Finance Lab had no visible test suite before Work 1. | Need financial tests for V1. | Add Node test runner and synthetic financial tests in Finance Lab. |
| Risk UI | Python has no Next.js UI. | Finance Lab has `RiskModuleShell` and Risk components. | Needs portfolio value, currency, confidence-level controls, and money display. | Extend existing Risk UI without a rewrite. |

## V1 Financial Conventions

- Returns are daily simple returns from aligned historical close prices.
- Portfolio return is a fixed-weight daily mix of asset returns.
- Portfolio NAV is normalized to 100 for performance charts.
- Annualized volatility uses daily sample volatility multiplied by `sqrt(252)`.
- Max drawdown is reported as a negative percentage in the existing performance layer.
- Historical VaR is reported as a positive daily loss: `max(0, -quantile(returns, 1 - confidenceLevel))`.
- Expected Shortfall is reported as a positive daily loss: `max(0, -mean(returns <= VaR threshold return))`.
- Parametric VaR is reported as a positive daily loss using sample mean plus lower-tail normal z-score times volatility.
- Money-at-risk equals loss percentage times the user-entered portfolio value in the selected presentation currency.
- Missing or non-finite return observations are filtered in the risk functions. The analysis records warnings when observations are limited or alignment is imperfect.

## Work 2 Instrument Risk Attribution

Implemented in `src/lib/finance/risk/risk-contribution.ts` and surfaced in the Portfolio Analytics section.

### Methodology

- The Work 2 instrument attribution uses the same aligned asset return base as the volatility contribution table.
- Covariance is daily, not annualized, because VaR is reported as a daily loss measure.
- Portfolio daily volatility is `sqrt(w' Sigma w)`.
- Portfolio covariance VaR is `z(confidenceLevel) * portfolioDailyVolatility`.
- Marginal VaR for instrument `i` is `z * (Sigma w)_i / portfolioDailyVolatility`.
- Component VaR is `weight_i * marginalVaR_i`.
- Component VaR % is `componentVaR_i / portfolioVaR`.
- Component VaR amount is `componentVaR_i * portfolioValue` when a portfolio value is available.
- Component VaR can be negative when an instrument diversifies or hedges the portfolio. Ranking and concentration use absolute Component VaR so diversifiers are still visible.

### Outputs

- Instrument Marginal VaR.
- Instrument Component VaR.
- Instrument Component VaR amount.
- Component VaR share.
- Top 3 contributors by absolute Component VaR.
- Top contributor share.
- Top-3 concentration.
- Herfindahl-style risk concentration index.
- Weight vs Component VaR contribution bars.

### Interpretation Boundary

This is a covariance-based parametric attribution view. It explains how the current weights and historical covariance matrix decompose model-implied daily VaR. It is not a scenario forecast, recommendation engine, or stress test. Client-facing use still requires methodology/disclaimer review.

## Work 3 Factor Attribution Review

Implemented in `src/lib/finance/risk/factor-gradvar.ts` and the Factor GradVaR UI.

### Default Proxy Set

The default factor proxy set was changed from a mostly US-only set to a broader Wealth Management Argentina set:

| Factor | Proxy | Purpose |
|---|---|---|
| Global Equity | `ACWI` | broad developed/emerging equity beta |
| Argentina | `ARGT` | Argentina equity and country-risk proxy |
| Growth / Technology | `QQQ` | US large-cap growth/technology exposure |
| Long Duration / Rates | `TLT` | US long-duration Treasury sensitivity |
| Credit / Risk Appetite | `HYG` | high-yield credit and global risk appetite |
| USD / FX | `UUP` | broad US dollar / FX pressure proxy |
| Gold / Real Asset | `GLD` | gold and real-asset defensive exposure |

### UI / Interpretation

The factor section now adds:

- dominant factor summary;
- dominant instrument/factor pair;
- model fit label based on portfolio factor R2;
- clearer wording that ETF proxies are approximations;
- responsive proxy grid for a larger proxy set.

### Methodology Boundary

Factor GradVaR remains a linear regression + covariance model using ETF proxies. It is useful for explaining broad exposure patterns, but it is not a pure macro factor model and does not replace a dedicated Argentine fixed-income, FX, or fund look-through model.

### Tests

Synthetic tests now verify that:

- factor Component VaR sums to factor-model VaR;
- instrument factor attribution also sums to model VaR;
- synthetic instruments identify the expected dominant factor;
- portfolio regression R2 behaves correctly in a controlled factor-driven sample.

## Work 4 Scenario Analysis

Implemented in `src/lib/finance/risk/scenario-analysis.ts` and surfaced in the Portfolio Analytics risk diagnostics.

### Initial Scenario Set

| Scenario | Intent | Shock style |
|---|---|---|
| Global risk-off | broad equity and credit repricing with defensive USD, duration, and gold assumptions | factor shocks across global equity, Argentina, growth/technology, credit, rates, USD/FX, and gold |
| Argentina stress | local country-risk stress with Argentina beta leading lower and USD pressure | heavier `ARGT` and USD/FX assumptions |
| Rates shock | higher-rate shock where duration and growth assets weaken together | negative duration and growth/technology assumptions |

### Methodology

- Scenario Analysis depends on the Work 3 factor model.
- Each scenario defines deterministic shocks by factor id.
- Each instrument's estimated impact is `sum(beta_factor * factor_shock)`.
- Weighted scenario impact is `portfolio_weight * estimated_instrument_impact`.
- Portfolio impact is the sum of weighted instrument impacts.
- Monetary impact is `portfolio_impact * portfolioValue` when a value is available.
- Top contributors are ranked by absolute weighted impact so both losses and offsets remain visible.

### UI / Interpretation

The Portfolio Analytics section now shows:

- estimated impact in percent and money for each scenario;
- top contributors per scenario;
- factor-linked methodology notes;
- explicit "hypothetical scenario, not a forecast" labeling.

### Methodology Boundary

Scenario Analysis is deterministic and hypothetical. It does not estimate probability, forecast timing, or recommend trades. Because it uses ETF-proxy factor betas, it inherits the same proxy and lookback-window limitations as Factor GradVaR.

### Tests

Synthetic tests verify that:

- scenario impact equals the sum of weighted instrument impacts;
- monetary impact scales from portfolio value;
- top contributors are ranked by absolute weighted impact;
- scenarios carry the explicit hypothetical/non-forecast label.

## Work 5 Current Portfolio vs Proposed Portfolio

Implemented through a proposed-weight sandbox in the Risk setup flow plus `src/lib/finance/risk/current-vs-proposed.ts`.

### Scope

Work 5 compares two allocations over the same loaded ticker universe:

- Current weights: the existing portfolio sandbox.
- Proposed weights: a second optional sandbox using the same tickers.

This keeps the comparison deliberately narrow. It does not fetch a separate proposed universe, ingest client holdings, or recommend an allocation.

### Metrics

The comparison currently reports:

- annualized volatility;
- Historical VaR at the selected confidence level;
- Expected Shortfall at the selected confidence level;
- max drawdown;
- max risk contributor;
- top-3 risk concentration;
- factor contribution deltas when Factor GradVaR is available for both allocations.

### Methodology

- Both allocations use the same aligned market dataset.
- Both allocations use the same confidence level and portfolio value settings.
- Proposed analytics reuse the same TypeScript portfolio/risk engines as the current allocation.
- Factor composition comparison uses the same fixed ETF proxy set introduced in Work 3.
- Deltas are reported as proposed minus current.

### UI / Interpretation

The setup flow now has:

- current weight editor;
- proposed weight editor;
- copy-current-to-proposed action;
- equal-proposed action.

The Portfolio Analytics diagnostics now show:

- summary cards for volatility, VaR, top-3 concentration, and max contributor change;
- side-by-side metric table;
- factor composition delta table when available;
- explicit language that this is risk explanation, not suitability or advice.

### Tests

Synthetic tests verify that:

- metric deltas are computed as proposed minus current;
- max risk contributor changes are detected;
- factor contribution deltas are computed and sorted.

## Work 6 Argentina Instrument Context Layer

Implemented through editable instrument-family classification in Setup plus `src/lib/finance/risk/argentina-instruments.ts`.

### Source

Work 6 uses the attached internal study reference:

- `Manual_supervivencia_instrumentos_WM_Argentina.pdf`
- Edition date: 2026-09-06
- Main concepts used: instrument families, currency/exposure distinctions, risk categories, liquidity/horizon interpretation, client questions, advisor checklist, and interpretation boundaries.

### Scope

The Work 6 layer covers:

- sovereign hard-dollar bonds;
- CER-linked bonds;
- dollar-linked instruments;
- fixed-rate ARS instruments;
- Obligaciones Negociables;
- cauciones;
- Fondos Comunes de Inversion;
- money market funds;
- Argentine equities;
- CEDEARs and CEDEAR ETFs;
- unknown/manual-review instruments.

### Methodology

- Each loaded ticker receives an editable Argentina instrument family.
- The module pre-fills a best-effort family using simple ticker-pattern inference.
- The classification does not change historical returns, VaR, ES, factor GradVaR, scenarios, or current-vs-proposed analytics.
- The classification adds context: currency/exposure, horizon, primary risks, return drivers, operational checks, client questions, and interpretation boundaries.
- Portfolio family exposure is computed from the validated current weights.

### UI / Interpretation

Setup now includes:

- an Argentina Context classification table;
- a family selector per loaded ticker;
- notes that this is context/checklist only, not a change to the risk engine.

Portfolio Analytics now includes:

- dominant local instrument family;
- number of distinct families;
- ticker-level family interpretation table;
- family exposure table;
- advisor checklist and client questions.

### Boundary

Work 6 does not price individual bonds, compute TIR/duration from contractual cash flows, parse fund holdings, or determine product suitability. It is an interpretation layer that helps a WM advisor read existing risk metrics through the correct local-instrument lens.

### Tests

Synthetic tests verify that:

- common tickers infer expected instrument families;
- family exposures aggregate from portfolio weights;
- checklist output is produced without warnings when all tickers are classified.

## Work 7 - Manual Argentina Fixed Income

Implemented in `/tools/bonds`, Argentina tab, with a separate cash-flow engine
in `src/lib/finance/argentina-fixed-income.ts`.

- Editable settlement price, accrued interest, technical value and future coupon/principal flows.
- Supports amortization and irregular year fractions entered manually from settlement.
- Solves annual effective YTM from dirty price using monotonic bisection.
- Reports dirty-price parity, Macaulay/modified duration, next-12-month coupon yield and undiscounted payments.
- Fully reprices unchanged flows for +/-100 and +/-200 bp immediate yield shocks, alongside duration approximation.
- Indexed instruments require constant-index amounts; no inflation/FX projection is implied.
- Synthetic defaults are not issuer schedules. No automatic ticker cash flows, day-count conversion, recommendations or live quotes.
- Unit tests cover analytical yields, accrued interest, irregular amortization, negative yields and invalid inputs.

Methodology reference: [FINRA yield and return](https://www.finra.org/investors/insights/bond-yield-return).
Contractual payment verification remains the user's responsibility; YTM is not a guaranteed realized return.

## Work 8 - Fund Holdings and Look-through

Risk now includes a standalone Funds / Look-through tab, independent of the
historical-market dataset. Manual snapshots include position/share-class name,
portfolio allocation, snapshot date, source reference and underlying holdings.
Direct positions are included as a single 100% underlying holding.

- Underlying exposure = portfolio allocation times holding weight.
- Portfolio allocations must total 100%; fund holdings may be partially disclosed.
- Undisclosed holdings remain unknown, never renormalized away.
- Aggregates instrument, legal issuer, economic currency exposure and family.
- Detects instrument and issuer overlap across distinct portfolio positions.
- Matching normalizes case and whitespace only; aliases require manual harmonization.
- Reports snapshot ages over 90 days using the explicitly selected analysis date.
- Synthetic examples are clearly labeled; no factsheet extraction or live data.
- One-level holdings only; nested funds require manually expanded composition.
- This independent composition sandbox does not alter existing VaR calculations.
- Unit tests cover exposure conservation, unknown weights, overlap, stale snapshots,
  direct-position rules and invalid inputs.

## Work 9 - Saved Manual Analyses

Bond Argentina and Fund Look-through now offer named Save new analysis, Load
and Delete saved controls. Snapshots live in versioned, separate browser-local
storage keys and contain inputs only; calculations run again after loading.

- Saved entries survive page reloads in the same browser and origin.
- Explicit save/load preserves incomplete drafts, including blank numeric fields.
- Each save creates a separate snapshot; deletion retains current working inputs.
- State is server-render safe; storage subscriptions update lists across browser tabs.
- Nested draft schemas, row IDs, version and a 30-analysis limit are validated.
- Storage errors are displayed; incompatible data is not silently overwritten.
- No cloud sync or automatic recovery of unsaved edits.
- Tests cover round-trips, draft preservation, independent snapshots and invalid storage.

## Work 10 - Analysis Files and Holdings CSV

Saved analysis controls now include portable JSON export/import for bond and
fund drafts. Files use a versioned module-specific envelope, schema validation
and a 5 MB limit. Importing previews the inputs and requires Apply import before
replacing current work; browser-saved snapshots are unaffected.

Fund look-through also accepts comma-separated CSV using a downloadable synthetic
template. One row represents one holding; repeated position IDs share one
portfolio allocation and must have consistent metadata. CSV imports validate
allocation totals, holding weights, classifications, dates and direct positions.
Partially disclosed funds keep their unknown exposure. Decimal points are
required; CSV quoting, escaped quotes, CRLF, BOM and multiline cells are supported.

JSON retains incomplete drafts; CSV requires financially valid composition.
Imported work is not automatically saved locally. Tests cover file round-trips,
cross-module rejection, malformed CSV, grouping and exposure conservation.

## Future Phases

- Later: automatic contractual schedules, factsheet ingestion, recursive fund holdings,
  saved analyses and reviewed client-facing methodology.
