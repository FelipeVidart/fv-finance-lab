"use client";
import { useMemo, useRef, useState } from "react";
import { buildPortfolioAnalytics, type PortfolioAnalytics } from "@/lib/finance/portfolio";
import { applyHistoryPreview, previewCSVHistory, type HistoryPreview } from "@/lib/workspace/history-preview";
import { importPositionsCSV, POSITIONS_TEMPLATE, validateDraft, type PortfolioDraft, type Position } from "@/lib/workspace/portfolio-draft";
import type { WorkspaceTheme } from "./use-workspace-theme";
import { WorkspaceAnalysis } from "./workspace-analysis";
import { WorkspaceFrame } from "./workspace-frame";
import { usePortfolioDraft } from "./use-portfolio-draft";
import styles from "./workspace.module.css";

type Applied = ReturnType<typeof applyHistoryPreview> & { preview: HistoryPreview; portfolio: PortfolioAnalytics };
const percent = (value: number) => `${(value * 100).toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;
function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([POSITIONS_TEMPLATE], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = "cartera-plantilla.csv"; link.click(); URL.revokeObjectURL(url);
}

export function WorkspaceLoader({ initialTheme }: { initialTheme: WorkspaceTheme }) {
  const { draft, setDraft, ready, storageWarning } = usePortfolioDraft();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<HistoryPreview | null>(null);
  const [imported, setImported] = useState<Position[] | null>(null);
  const [acceptMissing, setAcceptMissing] = useState(false);
  const [applied, setApplied] = useState<Applied | null>(null);
  const [step, setStep] = useState(0);
  const sequence = useRef(0);

  const validation = useMemo(() => {
    try { return { value: validateDraft(draft), error: "" }; }
    catch (e) { return { value: null, error: e instanceof Error ? e.message : "Revisá la cartera." }; }
  }, [draft]);
  const previewAllocation = pending && validation.value ? applyHistoryPreview(draft, pending, true) : null;

  function change(next: PortfolioDraft) {
    ++sequence.current; setDraft(next); setPending(null); setApplied(null); setImported(null); setAcceptMissing(false); setError(""); setBusy(false); setStep(0);
  }
  function updatePosition(id: number, patch: Partial<Position>) {
    change({ ...draft, positions: draft.positions.map(p => p.id === id ? { ...p, ...patch } : p) });
  }
  async function loadYahoo() {
    if (!validation.value) { setError(validation.error); return; }
    const requestId = ++sequence.current;
    setBusy(true); setPending(null); setApplied(null); setError(""); setAcceptMissing(false);
    try {
      // Allocation amounts and portfolio name stay in this browser.
      const requestDraft = { ...draft, name: "", mode: "amount", positions: validation.value.included.map(p => ({ id: p.id, ticker: p.ticker, value: "1", kind: "investment", excluded: false })) };
      const response = await fetch("/api/workspace-history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestDraft) });
      const result = await response.json() as { ok: boolean; error?: string; preview?: HistoryPreview };
      if (requestId !== sequence.current) return;
      if (!result.ok || !result.preview) throw new Error(result.error ?? "No se pudo cargar el histórico.");
      setPending(result.preview);
    } catch (e) { if (requestId === sequence.current) setError(`${e instanceof Error ? e.message : "Error de carga."} Podés importar un histórico CSV.`); }
    finally { if (requestId === sequence.current) setBusy(false); }
  }
  async function upload(file: File, kind: "positions" | "history") {
    const requestId = ++sequence.current; setBusy(true); setError(""); setPending(null); setApplied(null); setImported(null); setAcceptMissing(false);
    try {
      if (file.size > 5_000_000) throw new Error("El archivo puede tener hasta 5 MB.");
      const raw = await file.text();
      if (requestId !== sequence.current) return;
      if (kind === "positions") setImported(importPositionsCSV(raw));
      else setPending(previewCSVHistory(raw, draft));
    } catch (e) { if (requestId === sequence.current) setError(e instanceof Error ? e.message : "Archivo inválido."); }
    finally { if (requestId === sequence.current) setBusy(false); }
  }
  function apply() {
    if (!pending) return;
    try {
      const allocation = applyHistoryPreview(draft, pending, acceptMissing);
      const portfolio = buildPortfolioAnalytics({ data: pending.data, weights: allocation.weights });
      setApplied({ ...allocation, preview: pending, portfolio }); setStep(1); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Revisá el histórico."); }
  }

  return <WorkspaceFrame initialTheme={initialTheme}>
    <div className={styles.intro}><div><p className={styles.eyebrow}>CARTERAS · WEALTH MANAGEMENT</p><h1>Tu cartera, en perspectiva.</h1><p>Cargá tus posiciones y revisá los datos antes de analizar.</p></div><span className={styles.saveStatus}>{!ready ? "Recuperando cartera…" : storageWarning ? "Guardado no disponible" : "Guardado en este navegador"}</span></div>
    <nav className={styles.steps} aria-label="Pasos de análisis">{["Cargar cartera", "Analizar", "Exportar"].map((label, index) => <button key={label} type="button" disabled={index === 2 || (index === 1 && !applied)} onClick={() => setStep(index)} aria-current={step === index ? "step" : undefined} className={step === index ? styles.activeStep : ""}><span>{index + 1}</span>{label}</button>)}</nav>
    {storageWarning && <p className={styles.notice} role="status">{storageWarning}</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    {step === 0 ? <>
      <section className={styles.card}>
        <div className={styles.formGrid}>
          <label>Nombre de cartera<input value={draft.name} maxLength={100} onChange={e => change({ ...draft, name: e.target.value })} /></label>
          <label>Moneda de los precios<select value={draft.currency} onChange={e => change({ ...draft, currency: e.target.value as PortfolioDraft["currency"] })}><option value="ARS">ARS · pesos</option><option value="USD">USD · dólares</option></select></label>
          <label>Ingresar como<select value={draft.mode} onChange={e => change({ ...draft, mode: e.target.value as PortfolioDraft["mode"] })}><option value="amount">Importes</option><option value="weight">Pesos (%)</option></select></label>
          <label>Período para Yahoo<select value={draft.period} onChange={e => change({ ...draft, period: e.target.value as PortfolioDraft["period"] })}><option value="1M">1 mes</option><option value="3M">3 meses</option><option value="6M">6 meses</option><option value="1Y">1 año</option></select></label>
        </div>
        <div className={styles.cardHeading}><h2>Activos y {draft.mode === "amount" ? "importes" : "pesos"}</h2><div className={styles.inlineActions}><button type="button" className={styles.secondary} onClick={downloadTemplate}>Plantilla CSV</button><label className={styles.fileButton}>Importar posiciones<input type="file" accept=".csv,text/csv" disabled={!ready || busy} onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void upload(file, "positions"); }} /></label></div></div>
        <div className={styles.tableWrap}><table><thead><tr><th>Incluir</th><th>Ticker</th><th>{draft.mode === "amount" ? `Importe (${draft.currency})` : "Peso (%)"}</th><th>Tipo</th><th></th></tr></thead><tbody>{draft.positions.map(p => <tr key={p.id} className={p.excluded || p.kind === "money-market" ? styles.excludedRow : ""}>
          <td><input type="checkbox" aria-label={`Incluir ${p.ticker || "activo"}`} checked={!p.excluded && p.kind !== "money-market"} disabled={p.kind === "money-market"} onChange={e => updatePosition(p.id, { excluded: !e.target.checked })} /></td>
          <td><input aria-label={`Ticker fila ${p.id + 1}`} placeholder="SPY" maxLength={10} value={p.ticker} onChange={e => { const ticker = e.target.value.toUpperCase(); updatePosition(p.id, { ticker, ...(ticker.replace(/\.BA$/, "") === "BCMMA" ? { kind: "money-market" } : {}) }); }} /></td>
          <td><input aria-label={`Valor de ${p.ticker || `fila ${p.id + 1}`}`} inputMode="decimal" placeholder="0" maxLength={50} value={p.value} onChange={e => updatePosition(p.id, { value: e.target.value })} /></td>
          <td><select aria-label={`Tipo de ${p.ticker || `fila ${p.id + 1}`}`} value={p.kind} onChange={e => updatePosition(p.id, { kind: e.target.value as Position["kind"] })}><option value="investment">Inversión</option><option value="money-market">Money market · excluido</option></select></td>
          <td><button type="button" className={styles.removeButton} aria-label={`Eliminar ${p.ticker || `fila ${p.id + 1}`}`} onClick={() => change({ ...draft, positions: draft.positions.filter(row => row.id !== p.id) })}>×</button></td>
        </tr>)}</tbody></table></div>
        <div className={styles.actions}><button type="button" className={styles.secondary} disabled={!ready || draft.positions.length >= 30} onClick={() => change({ ...draft, positions: [...draft.positions, { id: Math.max(-1, ...draft.positions.map(p => p.id)) + 1, ticker: "", value: "", kind: "investment", excluded: false }] })}>+ Agregar activo</button><span>{draft.positions.length}/30 posiciones · Money market fuera del análisis</span></div>
        {validation.value ? <div className={styles.weightSummary}><strong>{validation.value.included.length} activos incluidos · {draft.mode === "amount" ? new Intl.NumberFormat("es-AR", { style: "currency", currency: draft.currency }).format(validation.value.total) : "100%"}</strong><p>{validation.value.included.map(p => `${p.ticker}: ${percent(validation.value!.weights[p.ticker])}`).join(" · ")}</p><p>Excluidos: {validation.value.positions.filter(p => p.kind === "money-market" || p.excluded).map(p => p.ticker).join(", ") || "ninguno"}</p></div> : <p className={styles.inputHint}>{validation.error}</p>}
      </section>
      {imported && <section className={`${styles.card} ${styles.historyCard}`}><h2>Revisar importación</h2><p>{imported.length} posiciones · se reemplazará la tabla al aplicar.</p><p>{imported.map(p => `${p.ticker}: ${p.value}${p.kind === "money-market" ? " (money market excluido)" : ""}`).join(" · ")}</p><button type="button" className={styles.primary} onClick={() => { try { validateDraft({ ...draft, positions: imported }); change({ ...draft, positions: imported }); } catch (e) { setError(e instanceof Error ? e.message : "Revisá el modo de ingreso."); } }}>Aplicar posiciones</button></section>}
      <section className={`${styles.card} ${styles.historyCard}`}><div className={styles.cardHeading}><h2>Histórico de precios</h2><span>Importes y precios deben usar la misma moneda</span></div><div className={styles.inlineActions}><button type="button" className={styles.primary} disabled={!ready || busy || !validation.value} onClick={() => void loadYahoo()}>{busy ? "Revisando…" : "Revisar histórico en Yahoo"}</button><label className={styles.fileButton}>Importar histórico CSV<input type="file" accept=".csv,text/csv" disabled={!ready || busy || !validation.value} onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void upload(file, "history"); }} /></label></div><p>{draft.currency === "ARS" ? "Yahoo consulta símbolos locales .BA y verifica ARS; conserva los tickers de tu tabla." : "Yahoo verifica USD en cada serie. No se convierte moneda."}</p><details className={styles.advanced}><summary>Formato de históricos y fuentes</summary><p>CSV: date,ticker,close,currency,source. Fechas YYYY-MM-DD, precios con punto decimal y tickers idénticos a la tabla. Se usan las fechas comunes del archivo, sin rellenar huecos. Fuente, moneda y ajustes son declarados por quien importa. Una captura de posiciones no es un histórico.</p></details></section>
      {pending && previewAllocation && validation.value && <section className={`${styles.card} ${styles.historyCard}`} aria-label="Revisión de cobertura"><div className={styles.cardHeading}><h2>Revisá antes de aplicar</h2><span>{pending.data.meta.priceCurrency} · {pending.data.meta.observations} fechas comunes</span></div><p>{pending.data.meta.commonStartDate} a {pending.data.meta.commonEndDate} · Fuente: {pending.data.meta.priceSource ?? pending.data.meta.provider}</p><p><strong>Cobertura: {percent(previewAllocation.coverage)} del valor/peso incluido · {pending.data.tickers.length}/{validation.value.included.length} activos.</strong></p><div className={styles.tableWrap}><table><thead><tr><th>Activo</th><th>Peso original</th><th>Peso en muestra</th><th>Histórico</th></tr></thead><tbody>{validation.value.included.map(p => <tr key={p.ticker}><td>{p.ticker}</td><td>{percent(validation.value!.weights[p.ticker])}</td><td>{previewAllocation.weights[p.ticker] === undefined ? "—" : percent(previewAllocation.weights[p.ticker])}</td><td>{pending.missing.find(m => m.ticker === p.ticker)?.reason ?? "Disponible"}</td></tr>)}</tbody></table></div>{previewAllocation.excluded.length > 0 && <label className={styles.confirmation}><input type="checkbox" checked={acceptMissing} onChange={e => setAcceptMissing(e.target.checked)} />Acepto analizar solo la muestra cubierta, excluir {previewAllocation.excluded.join(", ")} y normalizar sus pesos a 100%.</label>}<p>Los pesos se calculan a partir de tu tabla; no se reemplazan por pesos iguales.</p>{pending.data.meta.observations < 21 && <p className={styles.notice}>Muestra corta: la volatilidad puede ser poco representativa.</p>}<button type="button" className={styles.primary} disabled={previewAllocation.excluded.length > 0 && !acceptMissing} onClick={apply}>Aplicar histórico y analizar →</button></section>}
    </> : applied && <WorkspaceAnalysis applied={applied} draft={draft} onEdit={() => setStep(0)} />}
  </WorkspaceFrame>;
}
