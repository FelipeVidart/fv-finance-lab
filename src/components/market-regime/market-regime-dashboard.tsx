"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { RegimeBlockGrid } from "@/components/market-regime/regime-block-card";
import { RegimeInputsTable } from "@/components/market-regime/regime-inputs-table";
import { RegimeMethodologyCard } from "@/components/market-regime/regime-methodology-card";
import { RegimeSummaryCard } from "@/components/market-regime/regime-summary-card";
import { SurfaceCard } from "@/components/ui/surface-card";
import type {
  MarketRegimeResult,
  MarketRegimeRouteResponse,
} from "@/lib/finance/market-regime/types";
import type {
  ProviderSelectorOption,
  SafeProviderConfig,
} from "@/lib/market-data/provider-config";
import type { MarketDataProviderMode } from "@/lib/market-data/types";
import { cn } from "@/lib/utils";

const DEFAULT_PROVIDER: MarketDataProviderMode = "auto";

export function MarketRegimeDashboard({
  providerConfigs,
  providerSelectorOptions,
}: {
  providerConfigs: SafeProviderConfig[];
  providerSelectorOptions: ProviderSelectorOption[];
}) {
  const [provider, setProvider] =
    useState<MarketDataProviderMode>(DEFAULT_PROVIDER);
  const [result, setResult] = useState<MarketRegimeResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);

  const loadRegime = useCallback(async (nextProvider: MarketDataProviderMode) => {
    setIsLoading(true);
    setRequestError(null);

    try {
      const url = new URL("/api/market-regime", window.location.origin);

      url.searchParams.set("provider", nextProvider);

      const response = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as MarketRegimeRouteResponse;

      if (!payload.ok) {
        throw new Error(payload.error);
      }

      setResult(payload.data);
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Unable to load the market regime dashboard.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRegime(DEFAULT_PROVIDER);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadRegime]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadRegime(provider);
  }

  return (
    <section className="space-y-6 lg:space-y-8">
      <SurfaceCard
        tone="elevated"
        padding="md"
        className="border-border-strong/95"
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.42fr)] xl:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-accent-foreground">
                Market Regime
              </span>
              <span className="rounded-full border border-white/[0.08] bg-background-muted/75 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-foreground-subtle">
                Rule-based
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-[2.55rem]">
                Market Regime Dashboard
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-foreground-soft sm:text-[0.96rem]">
                Classify the current market environment using observable trend,
                momentum, volatility, credit, and rates inputs. The output is a
                state classification, not a forecast or trade recommendation.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
                  Provider
                </span>
                <select
                  value={provider}
                  onChange={(event) =>
                    setProvider(event.target.value as MarketDataProviderMode)
                  }
                  className="mt-3 w-full rounded-[1.15rem] border border-white/10 bg-slate-950/75 px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60"
                >
                  {providerSelectorOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="self-end rounded-[1.15rem] bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-wait disabled:bg-accent/60"
              >
                {isLoading ? "Loading..." : "Reload"}
              </button>
            </div>

            <div className="rounded-[1.15rem] border border-white/[0.08] bg-background-muted/75 px-4 py-3">
              <p className="text-xs leading-6 text-foreground-subtle">
                {formatCompactProviderStatus(providerConfigs)}
              </p>
              <Link
                href="/tools/data-providers"
                className="mt-2 inline-flex text-xs font-semibold text-accent-foreground transition hover:text-accent-strong"
              >
                Provider settings
              </Link>
            </div>
          </form>
        </div>
      </SurfaceCard>

      {requestError ? (
        <InlineStateCard
          tone="error"
          title="Market regime data could not be loaded"
          body={requestError}
        />
      ) : null}

      {isLoading && !result ? (
        <InlineStateCard
          tone="loading"
          title="Building market regime dataset"
          body="The dashboard is fetching and aligning the market universe before applying the rule-based model."
        />
      ) : null}

      {result ? (
        <>
          {result.source === "mock" ? (
            <InlineStateCard
              tone="warning"
              title="Fallback data is active"
              body={
                result.warnings[0] ??
                "Typed mock data is being shown because live market data was unavailable."
              }
            />
          ) : null}

          <DatasetStatus result={result} />

          <RegimeSummaryCard result={result} />

          <RegimeBlockGrid blocks={result.blocks} />

          <RegimeInputsTable indicators={result.indicators} />

          <RegimeMethodologyCard />
        </>
      ) : null}
    </section>
  );
}

function DatasetStatus({ result }: { result: MarketRegimeResult }) {
  const warningCount =
    result.warnings.length + (result.providerWarnings?.length ?? 0);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <StatusPill
        label="Data source"
        value={result.source === "mock" ? "Typed fallback" : "Market data"}
        tone={result.source === "mock" ? "warning" : "ready"}
      />
      <StatusPill label="Provider" value={formatProviderLabel(result.provider)} />
      <StatusPill
        label="Observations"
        value={result.observationCount.toString()}
      />
      <StatusPill
        label="Warnings"
        value={warningCount.toString()}
        tone={warningCount > 0 ? "warning" : "default"}
      />
    </div>
  );
}

function StatusPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ready" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.35rem] border bg-background-muted/75 px-4 py-3",
        tone === "ready" && "border-emerald-400/18",
        tone === "warning" && "border-amber-400/25",
        tone === "default" && "border-white/[0.08]",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
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
  tone: "loading" | "error" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.55rem] border px-5 py-4",
        tone === "loading" &&
          "border-accent/25 bg-accent/10 text-accent-foreground",
        tone === "error" &&
          "border-rose-400/30 bg-rose-400/[0.08] text-rose-200",
        tone === "warning" &&
          "border-amber-400/25 bg-amber-400/[0.08] text-amber-100",
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-7">{body}</p>
    </div>
  );
}

function formatCompactProviderStatus(providers: SafeProviderConfig[]): string {
  const providerIds = ["yahoo", "twelveData", "stooq"] as const;

  return providerIds
    .map((providerId) => providers.find((provider) => provider.id === providerId))
    .filter((provider): provider is SafeProviderConfig => Boolean(provider))
    .map((provider) => `${provider.label} ${formatProviderState(provider)}`)
    .join(" | ");
}

function formatProviderState(provider: SafeProviderConfig): string {
  if (provider.available && provider.requiresApiKey) {
    return "configured";
  }

  if (provider.available) {
    return "available";
  }

  if (provider.requiresApiKey && !provider.configured) {
    return "requires API key";
  }

  return provider.statusLabel.toLowerCase();
}

function formatProviderLabel(value: string): string {
  return value
    .split(" + ")
    .map((provider) =>
      provider === "twelveData"
        ? "Twelve Data"
        : provider === "yahoo"
          ? "Yahoo"
          : provider === "stooq"
            ? "Stooq"
            : provider,
    )
    .join(" + ");
}
