import { Card } from "@/components/card";
import { RiskDatasetStatusStrip } from "@/components/risk/risk-dataset-status-strip";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
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
      <Card
        eyebrow="Setup"
        title="Prepare the market dataset and portfolio sandbox"
        description="The setup flow first creates a shared daily market history, then opens a controlled portfolio sandbox. Asset and portfolio analytics become meaningfully useful only after those two steps are complete."
        actions={
          <StepBadge
            label={
              datasetReady
                ? "Dataset aligned"
                : isLoading
                  ? "Loading dataset"
                  : "Step 1 of 3"
            }
            tone={datasetReady ? "ready" : "default"}
          />
        }
        tone="elevated"
      >
        <form
          onSubmit={onSubmit}
          className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(21rem,0.88fr)]"
        >
          <div className="space-y-4">
            <SurfaceCard padding="sm" className="border-white/[0.08]">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                      Dataset request
                    </p>
                    <p className="text-sm leading-6 text-foreground-soft">
                      Define the ticker universe that will anchor the entire
                      workspace.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/[0.08] bg-background-muted/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
                    Primary control
                  </span>
                </div>

                <div className="rounded-[1.55rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(9,15,23,0.9),rgba(8,13,20,0.72))] p-5">
                  <label
                    htmlFor="risk-tickers"
                    className="block text-sm font-semibold text-foreground"
                  >
                    Tickers
                  </label>
                  <input
                    id="risk-tickers"
                    type="text"
                    value={tickerInput}
                    onChange={(event) => onTickerInputChange(event.target.value)}
                    placeholder="AAPL, MSFT, NVDA"
                    className={cn(
                      "mt-3 w-full rounded-[1.25rem] border bg-slate-950/75 px-4 py-3 text-sm text-white outline-none transition",
                      validationError
                        ? "border-rose-400/70 focus:border-rose-300"
                        : "border-white/10 focus:border-accent/60",
                    )}
                  />
                  <div className="mt-4 grid gap-2 text-xs leading-6 sm:grid-cols-2">
                    <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-foreground-muted">
                      Use 1 to 5 comma-separated tickers.
                    </p>
                    <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-foreground-subtle">
                      {inputHint}
                    </p>
                  </div>
                  {validationError ? (
                    <p className="mt-3 rounded-2xl border border-rose-400/25 bg-rose-400/[0.08] px-3 py-2 text-xs leading-6 text-rose-200">
                      {validationError}
                    </p>
                  ) : null}
                </div>
              </div>
            </SurfaceCard>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.78fr)]">
              <SurfaceCard padding="sm" className="border-white/[0.08]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                  Period window
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground-soft">
                  Use a shared lookback window so every series remains directly
                  comparable.
                </p>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {PERIOD_OPTIONS.map((option) => {
                    const isActive = period === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => onPeriodChange(option)}
                        className={cn(
                          "rounded-[1.15rem] border px-4 py-3 text-sm font-semibold transition",
                          isActive
                            ? "border-accent/40 bg-accent/12 text-accent-foreground"
                            : "border-white/[0.08] bg-slate-950/55 text-slate-300 hover:border-border-strong/80 hover:bg-white/[0.04]",
                        )}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </SurfaceCard>

              <SurfaceCard padding="sm" className="border-white/[0.08]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                  Action
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground-soft">
                  Pull the aligned dataset into the workspace.
                </p>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 w-full rounded-[1.2rem] bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-wait disabled:bg-accent/60"
                >
                  {isLoading ? "Loading data..." : "Load market dataset"}
                </button>
              </SurfaceCard>
            </div>
          </div>

          <div className="space-y-4">
            <SurfaceCard
              padding="sm"
              className={cn(
                "border-white/[0.08]",
                datasetReady && "border-accent/18",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                    Workspace sequence
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground-soft">
                    The module unlocks in a deliberate operating order.
                  </p>
                </div>
                <span className="rounded-full border border-white/[0.08] bg-background-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
                  Workflow
                </span>
              </div>
              <div className="mt-4 space-y-3">
                <WorkflowRow
                  index="01"
                  title="Load aligned dataset"
                  description="Request and align the shared market series for the selected tickers."
                  state={datasetReady ? "ready" : isLoading ? "active" : "pending"}
                />
                <WorkflowRow
                  index="02"
                  title="Define sandbox weights"
                  description="Enter or normalize the weights after the aligned asset universe is ready."
                  state={sandboxReady ? "ready" : datasetReady ? "active" : "pending"}
                />
                <WorkflowRow
                  index="03"
                  title="Move into analytics"
                  description="Use the validated setup to inspect asset behavior and portfolio outputs."
                  state={sandboxReady ? "active" : "pending"}
                />
              </div>
            </SurfaceCard>

            <SurfaceCard padding="sm" className="border-white/[0.08]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                Setup posture
              </p>
              <div className="mt-4 space-y-3">
                <StatusLine
                  label="Dataset"
                  value={
                    data
                      ? `${data.tickers.length} tickers loaded`
                      : isLoading
                        ? "Loading"
                        : "Not loaded"
                  }
                />
                <StatusLine
                  label="Period"
                  value={data ? data.period : period}
                />
                <StatusLine
                  label="Sandbox"
                  value={sandboxReady ? "Validated" : "Awaiting weights"}
                />
              </div>
            </SurfaceCard>
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
          body="The workspace is aligning the daily close series so downstream asset and portfolio views stay comparable."
        />
      ) : null}

      <RiskDatasetStatusStrip items={statusItems} />

      <Card
        eyebrow="Setup"
        title="Portfolio sandbox controls"
        description="Use the aligned asset universe as a controlled weight sandbox before moving into portfolio analytics. The goal here is a clean allocation surface with clear validation feedback."
        actions={
          <StepBadge
            label={
              sandboxReady
                ? "Sandbox validated"
                : datasetReady
                  ? "Step 2 of 3"
                  : "Locked"
            }
            tone={sandboxReady ? "ready" : "default"}
          />
        }
      >
        {!data ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <SurfaceCard padding="md" className="border-white/[0.08]">
              <p className="text-sm font-semibold text-foreground">
                What unlocks next
              </p>
              <p className="mt-3 text-sm leading-7 text-foreground-soft">
                Once the shared dataset is loaded, the sandbox opens weight
                inputs, validation checks, and the portfolio analytics section.
              </p>
            </SurfaceCard>

            <SurfaceCard padding="md" className="border-white/[0.08]">
              <p className="text-sm font-semibold text-foreground">
                Setup order
              </p>
              <div className="mt-4 space-y-3">
                <WorkflowListRow label="Fetch aligned market data." />
                <WorkflowListRow label="Set manual or equalized asset weights." />
                <WorkflowListRow label="Open the asset and portfolio analytics layers." />
              </div>
            </SurfaceCard>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(20rem,0.84fr)]">
            <div className="rounded-[1.7rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
              <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                    Manual weight editor
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground-soft">
                    Enter the portfolio mix for the currently aligned asset
                    universe.
                  </p>
                </div>
                <span className="rounded-full border border-white/[0.08] bg-background-muted/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
                  {data.tickers.length} assets
                </span>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[620px]">
                  <div className="grid grid-cols-[1.05fr_0.95fr_1fr_1fr] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                    <span>Ticker</span>
                    <span>Latest price</span>
                    <span>Weight input</span>
                    <span>Entered weight</span>
                  </div>
                  {data.metrics.map((metric, index) => (
                    <div
                      key={metric.ticker}
                      className={cn(
                        "grid grid-cols-[1.05fr_0.95fr_1fr_1fr] gap-3 px-5 py-4 text-sm text-slate-200 not-last:border-b not-last:border-white/[0.08]",
                        index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                      )}
                    >
                      <div className="space-y-1">
                        <span className="font-semibold text-foreground">
                          {metric.ticker}
                        </span>
                        <p className="text-xs text-foreground-subtle">
                          {metric.observations} obs
                        </p>
                      </div>
                      <span className="text-foreground-soft">
                        {formatNumber(metric.endPrice)}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={weightInputs[metric.ticker] ?? ""}
                        onChange={(event) =>
                          onWeightInputChange(metric.ticker, event.target.value)
                        }
                        className="w-full rounded-[1rem] border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/60"
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
                className="border-white/[0.08]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                      Weight validation
                    </p>
                    <p className="mt-2 text-sm leading-6 text-foreground-soft">
                      Portfolio weights must sum to 100% before the weighted
                      analytics layer opens.
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                      weightValidation?.isValid
                        ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
                        : "border-white/[0.08] bg-background-muted/80 text-foreground-subtle",
                    )}
                  >
                    {weightValidation?.isValid ? "Validated" : "Pending"}
                  </span>
                </div>

                <p className="mt-5 text-[2.35rem] font-semibold tracking-[-0.04em] text-foreground">
                  {weightValidation
                    ? `${weightValidation.totalPercent.toFixed(2)}%`
                    : "No weights"}
                </p>

                {weightValidation && !weightValidation.isValid ? (
                  <div className="mt-4 rounded-[1.2rem] border border-amber-400/25 bg-amber-400/[0.08] px-4 py-3 text-sm leading-6 text-amber-200">
                    {weightValidation.error}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[1.2rem] border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-sm leading-6 text-emerald-200">
                    Weights are valid and the portfolio analytics section is ready.
                  </div>
                )}

                <button
                  type="button"
                  onClick={onApplyEqualWeights}
                  className="mt-4 w-full rounded-[1.2rem] border border-accent/25 bg-accent/10 px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:border-accent/40 hover:bg-accent/15"
                >
                  Apply equal weights
                </button>
              </SurfaceCard>

              <SurfaceCard padding="sm" className="border-white/[0.08]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                  Sandbox operating notes
                </p>
                <div className="mt-4 space-y-3">
                  <StatusLine
                    label="Return model"
                    value="Fixed-weight daily mix"
                  />
                  <StatusLine
                    label="Compounding"
                    value="Normalized portfolio NAV"
                  />
                  <StatusLine
                    label="Review rule"
                    value="Validate weights before portfolio analytics"
                  />
                </div>
              </SurfaceCard>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function StepBadge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "ready";
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]",
        tone === "ready"
          ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
          : "border-accent/20 bg-accent/10 text-accent-foreground",
      )}
    >
      {label}
    </span>
  );
}

function WorkflowRow({
  index,
  title,
  description,
  state,
}: {
  index: string;
  title: string;
  description: string;
  state: "pending" | "active" | "ready";
}) {
  const stateLabel =
    state === "ready" ? "Ready" : state === "active" ? "Current" : "Pending";

  return (
    <div className="flex items-start gap-3 rounded-[1.35rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.76),rgba(10,17,26,0.54))] px-4 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/[0.08] bg-background-muted/85 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
        {index}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
              state === "ready" &&
                "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200",
              state === "active" &&
                "border-accent/20 bg-accent/10 text-accent-foreground",
              state === "pending" &&
                "border-white/[0.08] bg-background-muted/80 text-foreground-subtle",
            )}
          >
            {stateLabel}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-foreground-soft">
          {description}
        </p>
      </div>
    </div>
  );
}

function WorkflowListRow({ label }: { label: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.76),rgba(10,17,26,0.54))] px-4 py-3 text-sm text-foreground-soft">
      {label}
    </div>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.76),rgba(10,17,26,0.54))] px-4 py-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
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
      className={cn(
        "rounded-[1.55rem] border px-5 py-4",
        tone === "loading"
          ? "border-accent/25 bg-accent/10 text-accent-foreground"
          : "border-rose-400/30 bg-rose-400/[0.08] text-rose-200",
      )}
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
