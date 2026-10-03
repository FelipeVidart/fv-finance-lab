# Work 12: complete portfolios and ARS history

Risk setup and /api/market-data accept up to 30 unique tickers. Explicit lower maxTickers requests remain supported.

ARS local loading requires Yahoo and explicit .BA symbols; the provider must report ARS for every instrument. A missing series fails the complete request. No switch to the US underlying, dollar official conversion, or flat fund return is permitted.

For funds or unavailable local symbols, import a complete CSV history locally in Risk > Setup:

```csv
date,ticker,close,currency,source
```

Use ISO dates, decimal points, positive closes or unit prices, ARS, and a dated source reference. Input ticker names must exactly cover the requested universe (BCMMA is a usable label, not an automatic fund lookup). For an FCI use the correct share class and unit convention. Reject USD rows, duplicates, extra/missing instruments, invalid dates and fewer than two common dates. Source and currency in uploads are user declarations, not independently verified. No gaps are filled. Corporate actions and dividend adjustments must be prepared by the source. Imports use their actual sample dates, not an inferred selected lookback. Preview before applying. Applying resets portfolio weights to equal weights; enter actual allocation afterward.

ARS samples disable factor attribution/scenarios that depend on USD factor proxies. Base portfolio historical and covariance risk use local returns. Report exports include historical currency and source. Uploaded price history is in memory and is not included in Funds saved analysis snapshots.

The portfolio screenshot supplies valuations at one date, not a history. Live coverage of all 13 CEDEARs and BCMMA's exact share-class history remains unverified; no real series have been fabricated. CAFCI publishes daily fund unit-price information; broker/fund exports can be normalized into this CSV contract.

Validation: 43 tests (including mixed-currency and complete-universe rejection), typecheck, lint, production build.
