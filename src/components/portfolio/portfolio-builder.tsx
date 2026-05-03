"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Card } from "@/components/card";
import { PortfolioAssetsTable } from "@/components/portfolio/portfolio-assets-table";
import { PortfolioDrawdownChart } from "@/components/portfolio/portfolio-drawdown-chart";
import { PortfolioGrowthChart } from "@/components/portfolio/portfolio-growth-chart";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { SurfaceCard } from "@/components/ui/surface-card";
import { buildPortfolioDrawdownPoints } from "@/lib/finance/portfolio/drawdowns";
import { calculatePortfolioMetrics } from "@/lib/finance/portfolio/metrics";
import {
  MODERATE_GROWTH_ATHLETE_PORTFOLIO,
  PORTFOLIO_ASSET_CLASS_BY_TICKER,
} from "@/lib/finance/portfolio/presets";
import {
  buildPortfolioAssetAnalytics,
  buildPortfolioPerformancePoints,
  calculatePortfolioDailyReturns,
  validatePortfolioInputs,
} from "@/lib/finance/portfolio/returns";
import type {
  PortfolioAnalysis,
  PortfolioAssetInput,
} from "@/lib/finance/portfolio/types";
import type {
  MarketDataPeriod,
  MarketDataRouteResponse,
} from "@/lib/market-data/types";
import { cn } from "@/lib/utils";

type EditableAssetRow = {
  id: string;
  ticker: string;
  assetClass: string;
  weight: string;
};

const PERIOD_OPTIONS: MarketDataPeriod[] = ["1M", "3M", "6M", "1Y"];
const MAX_PORTFOLIO_TICKERS = 10;

export function PortfolioBuilder() {
  const [portfolioName, setPortfolioName] = useState(
    MODERATE_GROWTH_ATHLETE_PORTFOLIO.name,
  );
  const [initialCapital, setInitialCapital] = useState(
    MODERATE_GROWTH_ATHLETE_PORTFOLIO.initialCapital.toString(),
  );
  const [period, setPeriod] = useState<MarketDataPeriod>(
    MODERATE_GROWTH_ATHLETE_PORTFOLIO.period,
  );
  const [assetRows, setAssetRows] = useState<EditableAssetRow[]>(
    createRowsFromAssets(MODERATE_GROWTH_ATHLETE_PORTFOLIO.assets),
  );
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const portfolioAssets = useMemo(
    () =>
      assetRows.map<PortfolioAssetInput>((row) => ({
        ticker: row.ticker,
        assetClass: row.assetClass,
        weight: Number(row.weight),
      })),
    [assetRows],
  );

  const validation = useMemo(
    () =>
      validatePortfolioInputs({
        initialCapital: Number(initialCapital),
        assets: portfolioAssets,
      }),
    [initialCapital, portfolioAssets],
  );

  function applyPreset() {
    setPortfolioName(MODERATE_GROWTH_ATHLETE_PORTFOLIO.name);
    setInitialCapital(
      MODERATE_GROWTH_ATHLETE_PORTFOLIO.initialCapital.toString(),
    );
    setPeriod(MODERATE_GROWTH_ATHLETE_PORTFOLIO.period);
    setAssetRows(createRowsFromAssets(MODERATE_GROWTH_ATHLETE_PORTFOLIO.assets));
    setValidationMessage(null);
    setRequestMessage(null);
  }

  function updateAssetRow(
    id: string,
    field: keyof Omit<EditableAssetRow, "id">,
    value: string,
  ) {
    setAssetRows((current) =>
      current.map((row) => {
        if (row.id !== id) {
          return row;
        }

        const nextRow = { ...row, [field]: value };

        if (field === "ticker") {
          const assetClass =
            PORTFOLIO_ASSET_CLASS_BY_TICKER[value.trim().toUpperCase()];

          if (assetClass) {
            nextRow.assetClass = assetClass;
          }
        }

        return nextRow;
      }),
    );
    setValidationMessage(null);
  }

  function addAssetRow() {
    if (assetRows.length >= MAX_PORTFOLIO_TICKERS) {
      setValidationMessage(
        `This MVP supports up to ${MAX_PORTFOLIO_TICKERS} ETFs in one portfolio.`,
      );
      return;
    }

    setAssetRows((current) => [
      ...current,
      {
        id: createRowId(),
        ticker: "",
        assetClass: "",
        weight: "",
      },
    ]);
  }

  function removeAssetRow(id: string) {
    setAssetRows((current) => current.filter((row) => row.id !== id));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestMessage(null);

    if (!validation.isValid) {
      setValidationMessage(validation.error);
      setAnalysis(null);
      return;
    }

    setValidationMessage(null);
    setIsLoading(true);

    try {
      const url = new URL("/api/market-data", window.location.origin);
      const tickers = validation.assets.map((asset) => asset.ticker);

      url.searchParams.set("tickers", tickers.join(","));
      url.searchParams.set("period", period);
      url.searchParams.set("maxTickers", MAX_PORTFOLIO_TICKERS.toString());

      const response = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as MarketDataRouteResponse;

      if (!payload.ok) {
        throw new Error(payload.error);
      }

      if (payload.data.points.length < 3) {
        throw new Error(
          "Not enough overlapping data was found across the selected ETFs. Try fewer tickers or a longer lookback window.",
        );
      }

      const dailyReturns = calculatePortfolioDailyReturns({
        data: payload.data,
        assets: validation.assets,
      });
      const dates = payload.data.points.map((point) => point.date);
      const performancePoints = buildPortfolioPerformancePoints({
        dates,
        dailyReturns,
        initialCapital: Number(initialCapital),
      });
      const drawdownPoints = buildPortfolioDrawdownPoints(performancePoints);
      const metrics = calculatePortfolioMetrics({
        performancePoints,
        dailyReturns,
        maxDrawdown: Math.min(...drawdownPoints.map((point) => point.drawdown)),
        riskFreeRate: 0,
      });
      const assetAnalytics = buildPortfolioAssetAnalytics({
        data: payload.data,
        assets: validation.assets,
      });

      setAnalysis({
        name: portfolioName.trim() || "ETF Portfolio",
        period,
        provider: payload.data.meta.provider,
        commonStartDate: payload.data.meta.commonStartDate,
        commonEndDate: payload.data.meta.commonEndDate,
        observations: payload.data.meta.observations,
        assets: assetAnalytics,
        performancePoints,
        drawdownPoints,
        dailyReturns,
        metrics,
      });
    } catch (error) {
      setAnalysis(null);
      setRequestMessage(
        error instanceof Error
          ? error.message
          : "Unable to calculate portfolio performance right now.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card
        eyebrow="Portfolio setup"
        title="Build a weighted ETF portfolio"
        description="Define one ETF portfolio, validate the weights, then fetch aligned market history through the same market-data route used by the risk workspace."
        tone="elevated"
        actions={
          <span
            className={cn(
              "rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
              validation.isValid
                ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
                : "border-amber-400/25 bg-amber-400/[0.08] text-amber-200",
            )}
          >
            {validation.isValid ? "Validated" : "Needs review"}
          </span>
        }
      >
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(21rem,0.75fr)]"
        >
          <div className="space-y-4">
            <SurfaceCard padding="sm" className="border-white/[0.08]">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_13rem]">
                <label className="block">
                  <span className="text-sm font-semibold text-foreground">
                    Portfolio name
                  </span>
                  <input
                    type="text"
                    value={portfolioName}
                    onChange={(event) => setPortfolioName(event.target.value)}
                    className="mt-3 w-full rounded-[1.15rem] border border-white/10 bg-slate-950/75 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-foreground">
                    Initial capital
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="100"
                    value={initialCapital}
                    onChange={(event) => {
                      setInitialCapital(event.target.value);
                      setValidationMessage(null);
                    }}
                    className="mt-3 w-full rounded-[1.15rem] border border-white/10 bg-slate-950/75 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60"
                  />
                </label>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                    Lookback window
                  </p>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {PERIOD_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setPeriod(option)}
                        className={cn(
                          "rounded-[1.05rem] border px-3 py-2.5 text-sm font-semibold transition",
                          period === option
                            ? "border-accent/40 bg-accent/12 text-accent-foreground"
                            : "border-white/[0.08] bg-slate-950/55 text-slate-300 hover:border-border-strong/80 hover:bg-white/[0.04]",
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={applyPreset}
                  className="rounded-[1.15rem] border border-accent/25 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent-foreground transition hover:border-accent/40 hover:bg-accent/15"
                >
                  Moderate Growth Athlete Portfolio
                </button>
              </div>
            </SurfaceCard>

            <div className="overflow-x-auto rounded-[1.6rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(10,17,26,0.82),rgba(8,13,20,0.72))]">
              <div className="min-w-[780px]">
                <div className="grid grid-cols-[0.75fr_1.5fr_0.65fr_0.45fr] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                  <span>Ticker</span>
                  <span>Asset class</span>
                  <span>Weight</span>
                  <span></span>
                </div>
                {assetRows.map((row, index) => (
                  <div
                    key={row.id}
                    className={cn(
                      "grid grid-cols-[0.75fr_1.5fr_0.65fr_0.45fr] gap-3 px-5 py-4 not-last:border-b not-last:border-white/[0.08]",
                      index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                    )}
                  >
                    <input
                      type="text"
                      value={row.ticker}
                      onChange={(event) =>
                        updateAssetRow(row.id, "ticker", event.target.value)
                      }
                      placeholder="ETF"
                      className="w-full rounded-[1rem] border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/60"
                    />
                    <input
                      type="text"
                      value={row.assetClass}
                      onChange={(event) =>
                        updateAssetRow(row.id, "assetClass", event.target.value)
                      }
                      placeholder="Asset class"
                      className="w-full rounded-[1rem] border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/60"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={row.weight}
                      onChange={(event) =>
                        updateAssetRow(row.id, "weight", event.target.value)
                      }
                      placeholder="0.00"
                      className="w-full rounded-[1rem] border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/60"
                    />
                    <button
                      type="button"
                      onClick={() => removeAssetRow(row.id)}
                      className="rounded-[1rem] border border-white/[0.08] bg-slate-950/55 px-3 py-2 text-xs font-semibold text-foreground-muted transition hover:border-rose-400/30 hover:text-rose-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SurfaceCard
              tone={validation.isValid ? "accent" : "elevated"}
              padding="sm"
              className="border-white/[0.08]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                Validation
              </p>
              <p className="mt-4 text-[2.25rem] font-semibold tracking-[-0.04em] text-foreground">
                {validation.totalWeight.toFixed(2)}%
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground-soft">
                Weights must be positive and sum to 100%.
              </p>
              {validationMessage ? (
                <p className="mt-4 rounded-[1.15rem] border border-amber-400/25 bg-amber-400/[0.08] px-4 py-3 text-sm leading-6 text-amber-200">
                  {validationMessage}
                </p>
              ) : null}
              {requestMessage ? (
                <p className="mt-4 rounded-[1.15rem] border border-rose-400/30 bg-rose-400/[0.08] px-4 py-3 text-sm leading-6 text-rose-200">
                  {requestMessage}
                </p>
              ) : null}
              <div className="mt-5 grid gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-[1.15rem] bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-wait disabled:bg-accent/60"
                >
                  {isLoading ? "Running backtest..." : "Run portfolio backtest"}
                </button>
                <button
                  type="button"
                  onClick={addAssetRow}
                  className="rounded-[1.15rem] border border-white/[0.08] bg-background-muted/80 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent/25 hover:bg-accent/10"
                >
                  Add ETF row
                </button>
              </div>
            </SurfaceCard>

            <SurfaceCard padding="sm" className="border-white/[0.08]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                MVP assumption
              </p>
              <p className="mt-3 text-sm leading-7 text-foreground-soft">
                Portfolio returns are calculated using fixed target weights over
                the available historical period. Full rebalancing simulation
                will be added later.
              </p>
            </SurfaceCard>
          </div>
        </form>
      </Card>

      <PortfolioSummary analysis={analysis} />

      {analysis ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <PortfolioGrowthChart analysis={analysis} />
          <PortfolioDrawdownChart analysis={analysis} />
        </div>
      ) : null}

      <PortfolioAssetsTable analysis={analysis} />
    </div>
  );
}

function createRowsFromAssets(assets: PortfolioAssetInput[]): EditableAssetRow[] {
  return assets.map((asset, index) => ({
    id: `${asset.ticker}-${index}`,
    ticker: asset.ticker,
    assetClass: asset.assetClass,
    weight: asset.weight.toString(),
  }));
}

function createRowId(): string {
  return `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
