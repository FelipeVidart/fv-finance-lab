import { ButtonLink } from "@/components/ui/button-link";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  getAutoProviderPriority,
  getProviderConfigs,
  type SafeProviderConfig,
} from "@/lib/market-data/provider-config";
import type {
  MarketDataProviderId,
  RegisteredMarketDataProviderId,
} from "@/lib/market-data/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const providerGroups: Array<{
  title: string;
  description: string;
  ids: RegisteredMarketDataProviderId[];
}> = [
  {
    title: "Active Providers",
    description:
      "Implemented adapters that can be used by the current risk and portfolio workflows.",
    ids: ["yahoo", "twelveData"],
  },
  {
    title: "Optional Providers",
    description:
      "Additional market-data integrations that require keys or future adapters before use.",
    ids: ["stooq", "fmp", "tiingo", "polygon"],
  },
  {
    title: "Enterprise Providers",
    description:
      "Licensed institutional data sources intended for future server-side or local-proxy integrations.",
    ids: ["refinitiv"],
  },
];

const envVarExamples = [
  "TWELVE_DATA_API_KEY=",
  "STOOQ_API_KEY=",
  "FMP_API_KEY=",
  "TIINGO_API_KEY=",
  "POLYGON_API_KEY=",
  "LSEG_APP_KEY=",
  "LSEG_CLIENT_ID=",
  "LSEG_CLIENT_SECRET=",
  "REFINITIV_LOCAL_PROXY_URL=",
] as const;

export default function DataProvidersPage() {
  const providers = getProviderConfigs();
  const autoPriority = getAutoProviderPriority();
  const providersById = new Map(
    providers.map((provider) => [provider.id, provider]),
  );

  return (
    <section className="space-y-8">
      <SurfaceCard tone="elevated" padding="lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-accent-strong/90">
              Market data configuration
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-[2.55rem]">
              Market Data Providers
            </h1>
            <p className="text-sm leading-7 text-foreground-soft">
              Manage provider availability, API-key requirements, and future
              data integrations for FV Finance Lab.
            </p>
          </div>

          <div className="rounded-[1.45rem] border border-white/[0.08] bg-background-muted/75 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              Auto priority
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {autoPriority.length > 0 ? (
                autoPriority.map((providerId, index) => {
                  const provider = providersById.get(providerId);

                  return (
                    <span
                      key={providerId}
                      className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-foreground"
                    >
                      {index + 1}. {provider?.label ?? providerId}
                    </span>
                  );
                })
              ) : (
                <span className="text-sm text-foreground-muted">
                  No providers are currently available.
                </span>
              )}
            </div>
          </div>
        </div>
      </SurfaceCard>

      {providerGroups.map((group) => (
        <ProviderGroup
          key={group.title}
          title={group.title}
          description={group.description}
          providers={group.ids
            .map((providerId) => providersById.get(providerId))
            .filter((provider): provider is SafeProviderConfig =>
              Boolean(provider),
            )}
          autoPriority={autoPriority}
        />
      ))}

      <SurfaceCard padding="lg" className="border-accent/15">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-strong/85">
              Setup Instructions
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.035em] text-foreground">
              Configure keys server-side only.
            </h2>
            <div className="space-y-2 text-sm leading-7 text-foreground-soft">
              <p>For local development, add API keys to `.env.local`.</p>
              <p>
                For production, configure API keys in Vercel Environment
                Variables.
              </p>
              <p>
                Keys are read server-side only and are never exposed to the
                browser.
              </p>
            </div>
            <div className="pt-2">
              <ButtonLink href="/tools" variant="ghost" size="sm">
                Back to tools
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-[1.45rem] border border-white/[0.08] bg-slate-950/55 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              Example environment variables
            </p>
            <pre className="mt-4 overflow-x-auto rounded-[1.15rem] border border-white/[0.08] bg-slate-950/80 p-4 text-xs leading-6 text-foreground-soft">
              {envVarExamples.join("\n")}
            </pre>
          </div>
        </div>
      </SurfaceCard>
    </section>
  );
}

function ProviderGroup({
  title,
  description,
  providers,
  autoPriority,
}: {
  title: string;
  description: string;
  providers: SafeProviderConfig[];
  autoPriority: MarketDataProviderId[];
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-accent-strong/90">
            {title}
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground-soft">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            includedInAuto={autoPriority.includes(
              provider.id as MarketDataProviderId,
            )}
          />
        ))}
      </div>
    </section>
  );
}

function ProviderCard({
  provider,
  includedInAuto,
}: {
  provider: SafeProviderConfig;
  includedInAuto: boolean;
}) {
  const envVarLabel =
    provider.envVarNames.length > 0
      ? provider.envVarNames.join(", ")
      : "No API key required";
  const usageNote =
    provider.id === "refinitiv"
      ? "Requires licensed enterprise access. A future adapter should run server-side or through a local proxy. Credentials must never be exposed to the client."
      : provider.usageNote;

  return (
    <SurfaceCard padding="md" className="border-white/[0.08]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
            {provider.label}
          </h3>
          <p className="mt-2 text-sm leading-6 text-foreground-soft">
            {provider.category}
          </p>
        </div>
        <StatusBadge provider={provider} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <ProviderFact label="Environment variable" value={envVarLabel} />
        <ProviderFact
          label="Included in Auto"
          value={includedInAuto ? "Yes" : "No"}
        />
      </div>

      <p className="mt-5 text-sm leading-7 text-foreground-soft">
        {usageNote}
      </p>
    </SurfaceCard>
  );
}

function ProviderFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/[0.08] bg-background-muted/70 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ provider }: { provider: SafeProviderConfig }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
        provider.available
          ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
          : provider.implemented
            ? "border-amber-400/25 bg-amber-400/[0.08] text-amber-200"
            : provider.category === "Enterprise"
              ? "border-accent/20 bg-accent/10 text-accent-foreground"
              : "border-white/[0.08] bg-background-muted/80 text-foreground-subtle",
      )}
    >
      {provider.statusLabel}
    </span>
  );
}
