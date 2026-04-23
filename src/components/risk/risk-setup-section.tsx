import { Card } from "@/components/card";
import { RiskDatasetStatusStrip } from "@/components/risk/risk-dataset-status-strip";
import { SurfaceCard } from "@/components/ui/surface-card";
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
  const datasetReady = Boolean(data);
  const sandboxReady = Boolean(weightValidation?.isValid);

  return (
    <div
      id="setup-panel"
      role="tabpanel"
      aria-labelledby="setup-tab"
      className="space-y-6"
    >
      <RiskDatasetStatusStrip items={statusItems} />

      <Card
        eyebrow="Setup"
        title="Load and align the market dataset"
        description="Start by loading a shared daily history for the selected tickers. Once the dataset is aligned, the workspace can support asset review and portfolio analytics."
        actions={<StepBadge label="Step 1 of 3" />}
        tone="elevated"
      >
        <form
          onSubmit={onSubmit}
          className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.88fr)]"
        >
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-border/80 bg-slate-950/55 p-5">
              <label
                htmlFor="risk-tickers"
                className="block text-sm font-medium text-foreground"
              >
                Tickers
              </label>
              <input
                id="risk-tickers"
                type="text"
                value={tickerInput}
                onChange={(event) => onTickerInputChange(event.target.value)}
                placeholder="AAPL, MSFT, NVDA"
                className={`mt-3 w-full rounded-2xl border bg-slate-950/75 px-4 py-3 text-sm text-white outline-none transition ${
                  validationError
                    ? "border-rose-400/70 focus:border-rose-300"
                    : "border-white/10 focus:border-accent/60"
                }`}
              />
              <div className="mt-3 space-y-1">
                <p className="text-xs leading-6 text-foreground-muted">
                  Use 1 to 5 comma-separated tickers. Example: AAPL, MSFT,
                  NVDA.
                </p>
                <p className="text-xs leading-6 text-foreground-subtle">
                  {inputHint}
                </p>
                {validationError ? (
                  <p className="text-xs leading-6 text-rose-300">
                    {validationError}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-border/80 bg-slate-950/55 p-5">
              <p className="text-sm font-medium text-foreground">Period</p>
              <div className="mt-3 grid grid-cols-4 gap-2 xl:grid-cols-2">
                {PERIOD_OPTIONS.map((option) => {
                  const isActive = period === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onPeriodChange(option)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? "border-accent/60 bg-accent/12 text-accent-foreground"
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
                className="mt-4 w-full rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-wait disabled:bg-accent/60"
              >
                {isLoading ? "Loading data..." : "Fetch market data"}
              </button>
            </div>

            <div className="rounded-[1.5rem] border border-border/80 bg-slate-950/55 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                Workspace sequence
              </p>
              <div className="mt-4 space-y-3">
                <WorkflowRow
                  title="Load aligned dataset"
                  description="Request and align the shared market series for the selected tickers."
                  state={datasetReady ? "ready" : isLoading ? "active" : "pending"}
                />
                <WorkflowRow
                  title="Define sandbox weights"
                  description="Enter or normalize portfolio weights after the dataset is ready."
                  state={sandboxReady ? "ready" : datasetReady ? "active" : "pending"}
                />
                <WorkflowRow
                  title="Review analytics"
                  description="Move into asset and portfolio sections after setup is complete."
                  state={sandboxReady ? "active" : "pending"}
                />
              </div>
            </div>
          </div>
        </form>
      </Card>

      {requestError ? (
        <InlineStateCard
          tone="error"
          title="Market data could not be loaded"
          body={requestError}
        />
      ) : null}

      {isLoading && !data ? (
        <InlineStateCard
          tone="loading"
          title="Fetching shared market history"
          body="The workspace is aligning the daily close series so downstream asset and portfolio views stay consistent."
        />
      ) : null}

      <Card
        eyebrow="Setup"
        title="Portfolio sandbox"
        description="Use the loaded asset universe as a manual sandbox before moving into portfolio analytics."
        actions={<StepBadge label="Step 2 of 3" />}
      >
        {!data ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <SurfaceCard padding="md">
              <p className="text-sm font-semibold text-foreground">
                What unlocks next
              </p>
              <p className="mt-3 text-sm leading-7 text-foreground-soft">
                Once the shared dataset is loaded, the sandbox opens weight
                inputs, validation checks, and the portfolio analytics section.
              </p>
            </SurfaceCard>

            <SurfaceCard padding="md">
              <p className="text-sm font-semibold text-foreground">
                Setup order
              </p>
              <ol className="mt-3 space-y-2 text-sm leading-7 text-foreground-soft">
                <li>1. Fetch aligned market data.</li>
                <li>2. Set manual asset weights.</li>
                <li>3. Move into asset and portfolio analytics.</li>
              </ol>
            </SurfaceCard>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(20rem,0.88fr)]">
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-[1.5rem] border border-border/80 bg-slate-950/60">
                <div className="min-w-[560px]">
                  <div className="grid grid-cols-[1.05fr_0.9fr_1fr_1fr] gap-3 border-b border-white/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                    <span>Ticker</span>
                    <span>Latest price</span>
                    <span>Weight input</span>
                    <span>Entered weight</span>
                  </div>
                  {data.metrics.map((metric) => (
                    <div
                      key={metric.ticker}
                      className="grid grid-cols-[1.05fr_0.9fr_1fr_1fr] gap-3 px-4 py-3 text-sm text-slate-200 not-last:border-b not-last:border-white/10"
                    >
                      <div className="space-y-1">
                        <span className="font-semibold text-foreground">
                          {metric.ticker}
                        </span>
                        <p className="text-xs text-foreground-subtle">
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
                        className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/60"
                      />
                      <span className="text-foreground-muted">
                        {weightInputs[metric.ticker]
                          ? `${Number(weightInputs[metric.ticker]).toFixed(2)}%`
                          : "Not set"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SurfaceCard
                tone={weightValidation?.isValid ? "accent" : "elevated"}
                padding="sm"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                  Weight validation
                </p>
                <p className="mt-4 text-[2rem] font-semibold tracking-[-0.03em] text-foreground">
                  {weightValidation
                    ? `${weightValidation.totalPercent.toFixed(2)}%`
                    : "No weights"}
                </p>
                <p className="mt-2 text-sm leading-7 text-foreground-soft">
                  Total portfolio weight must sum to 100% before portfolio
                  analytics are enabled.
                </p>
                {weightValidation && !weightValidation.isValid ? (
                  <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3 text-sm text-amber-200">
                    {weightValidation.error}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-200">
                    Weights are valid and the portfolio analytics section is ready.
                  </div>
                )}
                <button
                  type="button"
                  onClick={onApplyEqualWeights}
                  className="mt-4 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
                >
                  Apply equal weights
                </button>
              </SurfaceCard>

              <SurfaceCard padding="sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                  Sandbox assumption
                </p>
                <p className="mt-3 text-sm leading-7 text-foreground-soft">
                  The portfolio sandbox combines aligned daily asset returns
                  using the entered weights as a fixed-weight daily return mix,
                  then compounds those returns into a normalized portfolio NAV.
                </p>
              </SurfaceCard>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function StepBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
      {label}
    </span>
  );
}

function WorkflowRow({
  title,
  description,
  state,
}: {
  title: string;
  description: string;
  state: "pending" | "active" | "ready";
}) {
  const stateLabel =
    state === "ready" ? "Ready" : state === "active" ? "Current" : "Pending";

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3">
      <span
        className={`mt-1 h-2.5 w-2.5 rounded-full ${
          state === "ready"
            ? "bg-emerald-300"
            : state === "active"
              ? "bg-accent"
              : "bg-slate-600"
        }`}
      />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
            {stateLabel}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-foreground-soft">
          {description}
        </p>
      </div>
    </div>
  );
}

function InlineStateCard({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: "loading" | "error";
}) {
  return (
    <div
      className={`rounded-[1.5rem] border px-5 py-4 ${
        tone === "loading"
          ? "border-accent/25 bg-accent/10 text-accent-foreground"
          : "border-rose-400/30 bg-rose-400/[0.08] text-rose-200"
      }`}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-7">{body}</p>
    </div>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
