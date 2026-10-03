"use client";
import { useState } from "react";
import { ARS_HISTORY_TEMPLATE, importArsHistory } from "@/lib/market-data/ars-history";
import { MAX_RISK_TICKERS, parseTickerInput } from "@/lib/market-data/request";
import type { MarketDataExplorerPayload, MarketDataPeriod } from "@/lib/market-data/types";

export function ArsHistoryControls({ tickers, period, disabled, onApply, onLoadLocal }: { tickers: string; period: MarketDataPeriod; disabled: boolean; onApply: (data: MarketDataExplorerPayload) => void; onLoadLocal: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<MarketDataExplorerPayload | null>(null);
  return <section className="rounded-xl border border-border p-4 space-y-3" aria-label="ARS price history">
    <h3 className="font-semibold">Series de precios en ARS</h3>
    <p className="text-sm text-foreground-muted">Hasta 30 instrumentos. Para cotizaciones locales ingresá símbolos explícitos .BA. Para incluir un FCI importá el histórico completo con su valor de cuotaparte y clase; usá un identificador sin espacios (por ejemplo BCMMA). Una captura de tenencias no es un histórico. Cargar un nuevo histórico reinicia los pesos a partes iguales: volvé a ingresar los pesos reales antes de analizar.</p>
    <button type="button" disabled={disabled} onClick={onLoadLocal} className="rounded border border-border px-3 py-2">Cargar cotizaciones locales ARS (Yahoo)</button>
    <p className="text-xs text-foreground-muted">CSV: date,ticker,close,currency,source. Fechas YYYY-MM-DD, precios con punto decimal, moneda ARS. Incluí todos los tickers solicitados; solo se usan fechas compartidas, sin rellenar huecos. Ajustá eventos corporativos antes de importar. La fuente y moneda del CSV son declaradas por quien importa.</p>
    <label className="block text-sm">Importar histórico ARS CSV<input type="file" accept=".csv,text/csv" disabled={disabled} className="block mt-2" onChange={async (event) => {
      const file = event.target.files?.[0]; setPending(null); setError(null);
      if (!file) return;
      try { if (file.size > 5_000_000) throw new Error("Máximo 5 MB."); const parsed = parseTickerInput(tickers, { maxTickers: MAX_RISK_TICKERS }); if (!parsed.tickers) throw new Error(parsed.error); setPending(importArsHistory(await file.text(), parsed.tickers, period)); } catch (e) { setError(e instanceof Error ? e.message : "CSV inválido."); }
      event.target.value = "";
    }}/></label>
    <button type="button" className="rounded border border-border px-3 py-2" onClick={() => { const url = URL.createObjectURL(new Blob([ARS_HISTORY_TEMPLATE], { type: "text/csv" })); const a = document.createElement("a"); a.href = url; a.download = "historico-ars-template.csv"; a.click(); URL.revokeObjectURL(url); }}>Descargar plantilla de históricos ARS</button>
    {error ? <p role="alert">{error}</p> : null}
    {pending ? <div><p>{pending.tickers.length} instrumentos · {pending.meta.observations} fechas comunes · {pending.meta.commonStartDate} a {pending.meta.commonEndDate} · ARS</p><button type="button" className="rounded border border-border px-3 py-2" onClick={() => { onApply(pending); setPending(null); }}>Aplicar histórico ARS</button></div> : null}
  </section>;
}
