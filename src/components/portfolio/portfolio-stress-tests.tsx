"use client";

import { useMemo, useState } from "react";
import { SurfaceCard } from "@/components/ui/surface-card";
import type {
  StressCoverageStatus,
  StressTestResult,
} from "@/lib/finance/portfolio/types";
import { cn } from "@/lib/utils";

type PortfolioStressTestsProps = {
  stressTests: StressTestResult[];
};

const statusTone: Record<StressCoverageStatus, string> = {
  "Full coverage": "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200",
  "Partial coverage": "border-amber-400/25 bg-amber-400/[0.08] text-amber-200",
  "Outside available history":
    "border-white/[0.08] bg-background-muted/80 text-foreground-subtle",
  "Insufficient observations":
    "border-amber-400/25 bg-amber-400/[0.08] text-amber-200",
  "Missing required assets":
    "border-rose-400/30 bg-rose-400/[0.08] text-rose-200",
};

export function PortfolioStressTests({
  stressTests,
}: PortfolioStressTestsProps) {
  const [selectedId, setSelectedId] = useState(stressTests[0]?.stressPeriod.id);
  const selectedStressTest = useMemo(
    () =>
      stressTests.find((result) => result.stressPeriod.id === selectedId) ??
      stressTests[0],
    [selectedId, stressTests],
  );

  return (
    <SurfaceCard padding="md" className="border-white/[0.08]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
            Historical Stress Tests
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">
            Evaluate how the current portfolio would have behaved during selected market stress periods, when sufficient historical data is available.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground-soft">
            Stress tests request historical data for each crisis window
            independently from the main backtest lookback. Older periods may
            still be unavailable for newer ETFs or provider limitations.
          </p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-background-muted/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
          {stressTests.length} periods
        </span>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[1.55rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
        <div className="min-w-[1120px]">
          <div className="grid grid-cols-[1.1fr_0.95fr_1fr_0.9fr_0.9fr_0.9fr_0.95fr_1fr_1fr] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
            <span>Stress Period</span>
            <span>Category</span>
            <span>Coverage</span>
            <span>Portfolio Return</span>
            <span>Benchmark Return</span>
            <span>Active Return</span>
            <span>Portfolio Max DD</span>
            <span>Worst Asset</span>
            <span>Best Asset</span>
          </div>

          {stressTests.length > 0 ? (
            stressTests.map((result, index) => {
              const isSelected =
                selectedStressTest?.stressPeriod.id === result.stressPeriod.id;

              return (
                <button
                  key={result.stressPeriod.id}
                  type="button"
                  onClick={() => setSelectedId(result.stressPeriod.id)}
                  className={cn(
                    "grid w-full grid-cols-[1.1fr_0.95fr_1fr_0.9fr_0.9fr_0.9fr_0.95fr_1fr_1fr] gap-3 px-5 py-4 text-left text-sm not-last:border-b not-last:border-white/[0.08] transition",
                    index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                    isSelected && "bg-accent/10",
                    "hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                  )}
                >
                  <span className="font-semibold text-foreground">
                    {result.stressPeriod.label}
                  </span>
                  <span className="text-foreground-soft">
                    {result.stressPeriod.category}
                  </span>
                  <span>
                    <StatusPill status={result.coverageStatus} />
                  </span>
                  <SignedCell value={formatPercent(result.portfolioReturn)} />
                  <SignedCell value={formatPercent(result.benchmarkReturn)} />
                  <SignedCell value={formatPercent(result.activeReturn)} />
                  <SignedCell value={formatPercent(result.portfolioMaxDrawdown)} />
                  <AssetCell
                    ticker={result.worstAssetTicker}
                    value={result.worstAssetReturn}
                  />
                  <AssetCell
                    ticker={result.bestAssetTicker}
                    value={result.bestAssetReturn}
                  />
                </button>
              );
            })
          ) : (
            <div className="px-5 py-5 text-sm leading-7 text-foreground-soft">
              No stress periods are configured.
            </div>
          )}
        </div>
      </div>

      {selectedStressTest ? (
        <StressDetailCard result={selectedStressTest} />
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <NoteLine>
          Partial coverage means the available data does not span the full
          historical stress period.
        </NoteLine>
        <NoteLine>
          Results are historical and do not represent forecasts.
        </NoteLine>
        <NoteLine>
          Missing required assets means the full allocation cannot be
          represented, so portfolio-level results are not computed.
        </NoteLine>
      </div>
    </SurfaceCard>
  );
}

function StressDetailCard({ result }: { result: StressTestResult }) {
  return (
    <div className="mt-5 rounded-[1.45rem] border border-white/[0.08] bg-background-muted/75 px-5 py-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
              {result.stressPeriod.label}
            </h3>
            <StatusPill status={result.coverageStatus} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground-soft">
            {result.stressPeriod.description}
          </p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-slate-950/55 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
          {result.stressPeriod.category}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DetailMetric
          label="Historical range"
          value={`${formatDate(result.stressPeriod.startDate)} - ${formatDate(
            result.stressPeriod.endDate,
          )}`}
        />
        <DetailMetric
          label="Actual period used"
          value={
            result.periodStartUsed && result.periodEndUsed
              ? `${formatDate(result.periodStartUsed)} - ${formatDate(
                  result.periodEndUsed,
                )}`
              : "N/A"
          }
        />
        <DetailMetric
          label="Observations"
          value={result.observations.toString()}
        />
        <DetailMetric
          label="Portfolio max drawdown"
          value={formatPercent(result.portfolioMaxDrawdown)}
          signed
        />
        <DetailMetric
          label="Portfolio return"
          value={formatPercent(result.portfolioReturn)}
          signed
        />
        <DetailMetric
          label="Benchmark return"
          value={formatPercent(result.benchmarkReturn)}
          signed
        />
        <DetailMetric
          label="Active return"
          value={formatPercent(result.activeReturn)}
          signed
        />
        <DetailMetric
          label="Benchmark max drawdown"
          value={formatPercent(result.benchmarkMaxDrawdown)}
          signed
        />
        <DetailMetric
          label="Best asset"
          value={formatAsset(result.bestAssetTicker, result.bestAssetReturn)}
          signed={result.bestAssetReturn !== null}
        />
        <DetailMetric
          label="Worst asset"
          value={formatAsset(result.worstAssetTicker, result.worstAssetReturn)}
          signed={result.worstAssetReturn !== null}
        />
        <DetailMetric
          label="Available assets"
          value={
            result.availableAssets.length > 0
              ? result.availableAssets.join(", ")
              : "N/A"
          }
        />
        <DetailMetric
          label="Missing assets"
          value={
            result.missingAssets.length > 0
              ? result.missingAssets.join(", ")
              : "None"
          }
        />
      </div>

      <p className="mt-4 rounded-[1.15rem] border border-white/[0.08] bg-slate-950/45 px-4 py-3 text-sm leading-7 text-foreground-soft">
        {result.coverageNote}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: StressCoverageStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
        statusTone[status],
      )}
    >
      {status}
    </span>
  );
}

function DetailMetric({
  label,
  value,
  signed = false,
}: {
  label: string;
  value: string;
  signed?: boolean;
}) {
  return (
    <div className="rounded-[1.2rem] border border-white/[0.08] bg-slate-950/45 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-sm font-semibold text-foreground",
          signed && value.startsWith("+") && "text-emerald-200",
          signed && value.startsWith("-") && "text-rose-200",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SignedCell({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "font-semibold text-foreground",
        value.startsWith("+") && "text-emerald-200",
        value.startsWith("-") && "text-rose-200",
      )}
    >
      {value}
    </span>
  );
}

function AssetCell({
  ticker,
  value,
}: {
  ticker: string | null;
  value: number | null;
}) {
  return (
    <span className="text-foreground-soft">
      {ticker ? `${ticker} ${formatPercent(value)}` : "N/A"}
    </span>
  );
}

function NoteLine({ children }: { children: string }) {
  return (
    <p className="rounded-[1.15rem] border border-white/[0.08] bg-background-muted/75 px-4 py-3 text-sm leading-7 text-foreground-soft">
      {children}
    </p>
  );
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "N/A";
  }

  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

function formatAsset(ticker: string | null, value: number | null): string {
  if (!ticker || value === null || !Number.isFinite(value)) {
    return "N/A";
  }

  return `${ticker} ${formatPercent(value)}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
