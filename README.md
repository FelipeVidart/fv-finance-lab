
# FV Finance Lab

Personal finance analytics lab built with Next.js.  
This project brings together practical tools for derivatives, portfolio analysis, market data exploration, and fixed-income analytics in a single web interface.

## Overview

FV Finance Lab is a personal financial analytics platform designed to turn quantitative finance concepts into usable tools.

The current version includes:

- **Options analytics**
  - Black-Scholes-Merton pricing for European calls and puts
  - Greeks
  - expiry payoff and profit chart
  - European binomial pricing comparison and convergence table

- **Risk and portfolio exploration**
  - multi-ticker market data explorer
  - normalized price, cumulative return, and drawdown charts
  - summary return and volatility metrics
  - portfolio sandbox with manual weights

- **Fixed income tools**
  - fixed-rate bond calculator
  - bond price, current yield, Macaulay duration, and modified duration
  - bond market explorer with local reference metadata

The project is meant to evolve into a broader finance toolkit covering portfolio construction, risk attribution, asset allocation, and more advanced fixed-income and derivatives analytics.

## Why this project exists

This repository was built to turn academic finance work and quantitative modeling concepts into a cleaner, more professional product surface.

Instead of leaving projects as isolated notebooks or scripts, FV Finance Lab provides a structured interface where tools can be tested, compared, and expanded over time.

## Current tools

### 1. Options
Located in `/tools/options`

Main features:
- European option pricing with Black-Scholes-Merton
- dividend yield support
- Greeks:
  - Delta
  - Gamma
  - Vega
  - Theta
  - Rho
- payoff and profit-at-expiry visualization
- European CRR binomial pricing comparison
- convergence table across step counts

### 2. Risk
Located in `/tools/risk`

Main features:
- multi-ticker market data explorer
- server-side market data fetching
- normalized price chart
- cumulative return chart
- drawdown chart
- summary metrics by ticker
- portfolio sandbox with manual weights

### 3. Bonds
Located in `/tools/bonds`

Main features:
- plain vanilla fixed-rate bond calculator
- bond price
- annual coupon
- current yield
- Macaulay duration
- modified duration
- bond market explorer
- local bond metadata registry

## Tech stack

- **Next.js**
- **TypeScript**
- **Tailwind CSS**
- frontend-first architecture with server-side route handlers where needed
- modular finance logic separated from UI components

## Project structure

    src/
      app/
        tools/
          options/
          risk/
          bonds/
        api/
          market-data/
      components/
      lib/
        finance/
        market-data/
        bonds/

## Local setup

Clone the repository and install dependencies:

    npm install

Run the development server:

    npm run dev

Then open:

    http://localhost:3000

## Environment variables

Create a `.env.local` file in the project root if you want to use live market data:

    TWELVE_DATA_API_KEY=your_api_key_here

Notes:
- `.env.local` should **not** be committed
- market data features depend on provider rate limits
- some tools can still be explored without live data

## Build

To check the production build:

    npm run build

## Roadmap

Planned future directions include:

- improved portfolio analytics
- benchmark and asset-class comparison
- risk attribution
- historical VaR and related risk metrics
- broader fixed-income analytics
- implied volatility and expanded options workflows

## Notes

This is a personal/internal finance analytics project.  
It is designed as a practical tool-building environment rather than a public market data product.

## License

No license has been added yet.
