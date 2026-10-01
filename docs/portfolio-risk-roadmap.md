# Portfolio Risk Analyzer - Audit, Architecture, V1, and Work 2

Date: 2026-10-01

## Scope

This document covers Work 1 and Work 2 for the FV Finance Lab Risk module.

- Work 1: audit, architecture decision, and V1 implementation.
- Work 2: instrument-level risk attribution with Marginal VaR, Component VaR, Component VaR %, top contributors, concentration, and weight-vs-risk contribution visualization.

Later roadmap phases remain out of scope for this work: stress testing, scenario analysis, current-vs-proposed comparison, Argentine fixed income, funds look-through, and automatic investment recommendations.

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
| Factor model | Exists in `handlers/factors.py` via factor covariance and betas. | Exists in `src/lib/finance/risk/factor-gradvar.ts`. | Factor proxies need later methodological review for Argentina WM use. | Keep existing TypeScript, no expansion in V1. |
| Factor GradVaR | Exists in `GradVaRHandler`. | Exists in `buildFactorGradVarAnalysis`. | Already present, but future roadmap asks for review/visualization. | Do not expand in Work 1. |
| Risk attribution by factor | Exists in `FactorAttributionHandler`. | Exists in factor GradVaR output/table. | Phase 3 refinement remains. | Preserve existing TypeScript. |
| Risk attribution by instrument | Exists in `InstrumentAttributionHandler`. | Exists through volatility contribution and factor instrument attribution. | Work 2 needed a canonical Marginal VaR/Component VaR view by instrument. | Keep TypeScript; add covariance-based instrument VaR attribution in `risk-contribution.ts`. |
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

## Future Phases Kept Out of Work 2

- Work 3: factor attribution review and improvements for Wealth Management in Argentina.
- Later: scenario analysis, stress testing, current-vs-proposed comparison, Argentine fixed income, funds look-through, and compliance-reviewed client-facing methodology/disclaimers.
