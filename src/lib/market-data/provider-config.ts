import type {
  MarketDataProviderId,
  RegisteredMarketDataProviderId,
} from "@/lib/market-data/types";

export type MarketDataProviderCategory =
  | "Free / no-key"
  | "Free / API key"
  | "API key required"
  | "Optional paid/API key"
  | "Enterprise";

export type ProviderStatusLabel =
  | "Available"
  | "Configured"
  | "Requires API key"
  | "Not implemented"
  | "Enterprise / Not implemented";

export type ProviderConfig = {
  id: RegisteredMarketDataProviderId;
  label: string;
  category: MarketDataProviderCategory;
  requiresApiKey: boolean;
  envVarNames: string[];
  implemented: boolean;
  usageNote: string;
};

export type SafeProviderConfig = ProviderConfig & {
  available: boolean;
  configured: boolean;
  selectable: boolean;
  statusLabel: ProviderStatusLabel;
};

export type ProviderSelectorOption = {
  value: "auto" | MarketDataProviderId;
  label: string;
  disabled: boolean;
  statusLabel?: ProviderStatusLabel;
};

const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    id: "yahoo",
    label: "Yahoo Finance",
    category: "Free / no-key",
    requiresApiKey: false,
    envVarNames: [],
    implemented: true,
    usageNote:
      "Experimental no-key provider for personal/research historical data.",
  },
  {
    id: "twelveData",
    label: "Twelve Data",
    category: "Free / API key",
    requiresApiKey: true,
    envVarNames: ["TWELVE_DATA_API_KEY"],
    implemented: true,
    usageNote:
      "API-key provider used as fallback and for structured market data.",
  },
  {
    id: "stooq",
    label: "Stooq",
    category: "API key required",
    requiresApiKey: true,
    envVarNames: ["STOOQ_API_KEY"],
    implemented: true,
    usageNote: "CSV historical downloads require an API key.",
  },
  {
    id: "fmp",
    label: "Financial Modeling Prep",
    category: "Optional paid/API key",
    requiresApiKey: true,
    envVarNames: ["FMP_API_KEY"],
    implemented: false,
    usageNote:
      "Candidate future provider for historical prices and fundamentals.",
  },
  {
    id: "tiingo",
    label: "Tiingo",
    category: "Optional paid/API key",
    requiresApiKey: true,
    envVarNames: ["TIINGO_API_KEY"],
    implemented: false,
    usageNote: "Candidate future provider for clean EOD historical market data.",
  },
  {
    id: "polygon",
    label: "Polygon",
    category: "Optional paid/API key",
    requiresApiKey: true,
    envVarNames: ["POLYGON_API_KEY"],
    implemented: false,
    usageNote: "Candidate future provider for institutional-grade market data.",
  },
  {
    id: "refinitiv",
    label: "Refinitiv / LSEG",
    category: "Enterprise",
    requiresApiKey: true,
    envVarNames: [
      "LSEG_APP_KEY",
      "LSEG_CLIENT_ID",
      "LSEG_CLIENT_SECRET",
      "REFINITIV_LOCAL_PROXY_URL",
    ],
    implemented: false,
    usageNote:
      "Requires licensed enterprise access. A future adapter should run server-side or through a local proxy. Credentials must never be exposed to the client.",
  },
];

const AUTO_PROVIDER_PRIORITY: MarketDataProviderId[] = [
  "yahoo",
  "twelveData",
  "stooq",
];

export function getProviderConfigs(): SafeProviderConfig[] {
  return PROVIDER_CONFIGS.map(enrichProviderConfig);
}

export function getAvailableProviders(): SafeProviderConfig[] {
  return getProviderConfigs().filter((provider) => provider.available);
}

export function getSelectableProviders(): SafeProviderConfig[] {
  return getProviderConfigs().filter(
    (provider) =>
      isFetchableProviderId(provider.id) &&
      provider.implemented,
  );
}

export function getProviderSelectorOptions(): ProviderSelectorOption[] {
  return [
    {
      value: "auto",
      label: "Auto",
      disabled: false,
      statusLabel: "Available",
    },
    ...getSelectableProviders().map((provider) => ({
      value: provider.id as MarketDataProviderId,
      label: provider.available
        ? provider.label
        : `${provider.label} - requires API key`,
      disabled: !provider.available,
      statusLabel: provider.statusLabel,
    })),
  ];
}

export function getAutoProviderPriority(): MarketDataProviderId[] {
  return AUTO_PROVIDER_PRIORITY.filter(
    (providerId) =>
      isProviderImplemented(providerId) && isProviderConfigured(providerId),
  );
}

export function isProviderConfigured(
  providerId: RegisteredMarketDataProviderId,
): boolean {
  const config = getRawProviderConfig(providerId);

  if (!config) {
    return false;
  }

  if (!config.requiresApiKey) {
    return true;
  }

  return config.envVarNames.some((envVarName) =>
    Boolean(process.env[envVarName]),
  );
}

export function isProviderImplemented(
  providerId: RegisteredMarketDataProviderId,
): boolean {
  return getRawProviderConfig(providerId)?.implemented ?? false;
}

export function getProviderAvailability(
  providerId: RegisteredMarketDataProviderId,
): SafeProviderConfig | null {
  const config = getRawProviderConfig(providerId);

  return config ? enrichProviderConfig(config) : null;
}

export function isFetchableProviderId(
  providerId: RegisteredMarketDataProviderId,
): providerId is MarketDataProviderId {
  return (
    providerId === "yahoo" ||
    providerId === "twelveData" ||
    providerId === "stooq"
  );
}

function enrichProviderConfig(config: ProviderConfig): SafeProviderConfig {
  const configured = isProviderConfigured(config.id);
  const available = config.implemented && configured;

  return {
    ...config,
    configured,
    available,
    selectable: config.implemented && isFetchableProviderId(config.id),
    statusLabel: getStatusLabel(config, configured, available),
  };
}

function getStatusLabel(
  config: ProviderConfig,
  configured: boolean,
  available: boolean,
): ProviderStatusLabel {
  if (!config.implemented) {
    return config.category === "Enterprise"
      ? "Enterprise / Not implemented"
      : "Not implemented";
  }

  if (available) {
    return config.requiresApiKey ? "Configured" : "Available";
  }

  if (config.requiresApiKey && !configured) {
    return "Requires API key";
  }

  return "Not implemented";
}

function getRawProviderConfig(
  providerId: RegisteredMarketDataProviderId,
): ProviderConfig | undefined {
  return PROVIDER_CONFIGS.find((provider) => provider.id === providerId);
}
