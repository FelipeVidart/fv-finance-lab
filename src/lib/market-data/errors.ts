import type {
  MarketDataProviderId,
  MarketDataWarning,
} from "@/lib/market-data/types";

export function createMarketDataWarning(input: {
  symbol?: string;
  provider?: MarketDataProviderId;
  code: string;
  message: string;
}): MarketDataWarning {
  return {
    symbol: input.symbol,
    provider: input.provider,
    code: input.code,
    message: input.message,
  };
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function buildMissingSymbolsMessage(input: {
  symbols: string[];
  warnings: MarketDataWarning[];
  noun?: string;
}): string {
  const noun = input.noun ?? "symbol";
  const details = input.symbols
    .map((symbol) => {
      const warnings = input.warnings.filter((entry) => entry.symbol === symbol);

      return warnings.length > 0
        ? `${symbol}: ${warnings.map(formatWarningDetail).join(" ")}`
        : `${symbol}: no data returned.`;
    })
    .join(" ");

  return `Unable to load daily history for ${input.symbols.length === 1 ? noun : `${noun}s`}: ${details}`;
}

function formatWarningDetail(warning: MarketDataWarning): string {
  const provider = warning.provider
    ? warning.provider === "twelveData"
      ? "Twelve Data"
      : warning.provider.charAt(0).toUpperCase() + warning.provider.slice(1)
    : "Provider";

  return `[${provider}] ${warning.message}`;
}
