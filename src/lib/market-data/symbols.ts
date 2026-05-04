const STOOQ_SYMBOL_MAP: Record<string, string> = {
  ACWI: "acwi.us",
  AGG: "agg.us",
  AAPL: "aapl.us",
  BIL: "bil.us",
  DIA: "dia.us",
  EEM: "eem.us",
  EFA: "efa.us",
  GLD: "gld.us",
  GOVT: "govt.us",
  IAU: "iau.us",
  IEF: "ief.us",
  IJR: "ijr.us",
  IVV: "ivv.us",
  IWM: "iwm.us",
  MSFT: "msft.us",
  NVDA: "nvda.us",
  QQQ: "qqq.us",
  SHY: "shy.us",
  SPY: "spy.us",
  VOO: "voo.us",
  VXUS: "vxus.us",
};

export function normalizeRequestSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function dedupeSymbols(symbols: string[]): string[] {
  return [...new Set(symbols.map(normalizeRequestSymbol).filter(Boolean))];
}

export function resolveStooqSymbol(symbol: string): string {
  const normalized = normalizeRequestSymbol(symbol);

  return STOOQ_SYMBOL_MAP[normalized] ?? `${normalized.toLowerCase()}.us`;
}
