import { Card } from "@/components/card";
import { RiskDatasetStatusStrip } from "@/components/risk/risk-dataset-status-strip";
import type { RiskSetupSectionProps } from "@/components/risk/types";
import type { MarketDataPeriod } from "@/lib/market-data/types";

const PERIOD_OPTIONS: MarketDataPeriod[] = ["1M", "3M", "6M", "1Y"];

export function RiskSetupSection({
  data,
  inputHint,
  isLoading,
  period,
  requestError,
  statusItems,
  tickerInput,
  validationError,
  weightInputs,
  weightValidation,
  onApplyEqualWeights,
  onPeriodChange,
  onSubmit,
  onTickerInputChange,
  onWeightInputChange,
}: RiskSetupSectionProps) {
  return (
    <div
      id="setup-panel"
      role="tabpanel"
      aria-labelledby="setup-tab"
      className="space-y-4"
    >
      <RiskDatasetStatusStrip items={statusItems} />

      <Card
        eyebrow="Setup"
        title="Market data explorer"
        description="Load up to five equities onto a common daily history before moving into asset or portfolio analysis."
      >
        <form
          className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={onSubmit}
        >
          <div className="space-y-2">
            <label
              htmlFor="risk-tickers"
              className="text-sm font-medium text-slate-100"
            >
              Tickers
            </label>
            <input
              id="risk-tickers"
              type="text"
              value={tickerInput}
              onChange={(event) => onTickerInputChange(event.target.value)}
              placeholder="AAPL, MSFT, NVDA"
              className={`w-full rounded-2xl border bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition ${
                validationError
                  ? "border-rose-400/70 focus:border-rose-300"
                  : "border-white/10 focus:border-sky-400/60"
              }`}
            />
            <div className="space-y-1">
              <p className="text-xs leading-6 text-slate-400">
                Use 1 to 5 comma-separated tickers. Example: AAPL, MSFT, NVDA.
              </p>
              <p className="text-xs leading-6 text-slate-500">{inputHint}</p>
              {validationError ? (
                <p className="text-xs leading-6 text-rose-300">
                  {validationError}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2 xl:min-w-56">
            <span className="text-sm font-medium text-slate-100">Period</span>
            <div className="grid grid-cols-4 gap-2 xl:grid-cols-2">
              {PERIOD_OPTIONS.map((option) => {
                const isActive = period === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onPeriodChange(option)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "border-sky-400/70 bg-sky-400/15 text-sky-100"
                        : "border-white/10 bg-slate-950/60 text-slate-300 hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-wait disabled:bg-sky-400/70"
            >
              {isLoading ? "Loading data..." : "Fetch market data"}
            </button>
          </div>
        </form>
      </Card>

      {requestError ? (
        <Card
          eyebrow="Request Status"
          title="Market data could not be loaded"
          description={requestError}
        />
      ) : null}

      {isLoading && !data ? (
        <Card
          eyebrow="Loading"
          title="Fetching daily history"
          description="The module is requesting server-side daily price data and aligning the shared dataset for downstream risk views."
        />
      ) : null}

      <Card
        eyebrow="Setup"
        title="Portfolio sandbox"
        description="Use the loaded asset universe as a manual portfolio sandbox before moving into portfolio analytics."
      >
        {!data ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-5">
              <p className="text-sm font-semibold text-white">
                Workspace sequence
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                1. Fetch aligned market data.
              </p>
              <p className="text-sm leading-7 text-slate-300">
                2. Set manual asset weights.
              </p>
              <p className="text-sm leading-7 text-slate-300">
                3. Review asset analytics and portfolio analytics in their own sections.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-5">
              <p className="text-sm font-semibold text-white">
                Portfolio analytics status
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Load a shared dataset first to unlock weight validation, weighted
                NAV, portfolio drawdown, and comparison views.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
                  <div className="min-w-[560px]">
                    <div className="grid grid-cols-[1.1fr_0.9fr_1fr_1fr] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <span>Ticker</span>
                      <span>Latest price</span>
                      <span>Weight</span>
                      <span>Weight share</span>
                    </div>
                    {data.metrics.map((metric) => (
                      <div
                        key={metric.ticker}
                        className="grid grid-cols-[1.1fr_0.9fr_1fr_1fr] gap-3 px-4 py-3 text-sm text-slate-200 not-last:border-b not-last:border-white/10"
                      >
                        <div className="space-y-1">
                          <span className="font-semibold text-white">
                            {metric.ticker}
                          </span>
                          <p className="text-xs text-slate-500">
                            {metric.observations} obs
                          </p>
                        </div>
                        <span>{formatNumber(metric.endPrice)}</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={weightInputs[metric.ticker] ?? ""}
                          onChange={(event) =>
                            onWeightInputChange(metric.ticker, event.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400/60"
                        />
                        <span className="text-slate-400">
                          {weightInputs[metric.ticker]
                            ? `${Number(weightInputs[metric.ticker]).toFixed(2)}%`
                            : "Not set"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onApplyEqualWeights}
                    className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                  >
                    Apply equal weights
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Weight validation
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {weightValidation
                      ? `${weightValidation.totalPercent.toFixed(2)}%`
                      : "No weights"}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Total portfolio weight must sum to 100% before portfolio
                    analytics are enabled.
                  </p>
                  {weightValidation && !weightValidation.isValid ? (
                    <p className="mt-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3 text-sm text-amber-200">
                      {weightValidation.error}
                    </p>
                  ) : (
                    <p className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200">
                      Weights are valid and ready for portfolio analytics.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-sm font-semibold text-white">
                    Portfolio construction assumption
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    The sandbox combines aligned daily asset returns using the
                    entered weights as a fixed-weight daily return mix, then
                    compounds those returns into a normalized portfolio NAV.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
