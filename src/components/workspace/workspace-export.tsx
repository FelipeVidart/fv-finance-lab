"use client";
import { useEffect, useRef, useState } from "react";
import type { ChartBundle, ExportChart } from "@/lib/workspace/export/chart-bundle";
import { formatPercent } from "@/lib/workspace/export/chart-bundle";
import styles from "./workspace.module.css";
export function WorkspaceExport({ bundle, onBack }: { bundle: ChartBundle; onBack: () => void }) {
  const [busy, setBusy] = useState<ExportChart["id"] | "all" | null>(null);
  const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const generation = useRef(0), locked = useRef(false);
  useEffect(() => () => { ++generation.current; }, []);
  async function download(id: ExportChart["id"] | "all") {
    if (locked.current) return;
    locked.current = true; const request = ++generation.current;
    setBusy(id); setError(""); setMessage("");
    try {
      const { prepareChartDownload, saveDownload } = await import("@/lib/workspace/export/download-charts");
      const file = await prepareChartDownload(bundle, id);
      if (request !== generation.current) return;
      saveDownload(file.blob, file.name); setMessage("Archivo generado. Descarga iniciada.");
    } catch (e) { if (request === generation.current) setError(e instanceof Error ? e.message : "No se pudo generar el archivo. Volvé a intentar."); }
    finally { if (request === generation.current) { locked.current = false; setBusy(null); } }
  }
  return <>
    <section className={styles.summary}><div><p className={styles.eyebrow}>EXPORTAR GRÁFICOS</p><h2>{bundle.name}</h2></div><div className={styles.summaryItems}><span>{bundle.currency} · Cobertura {formatPercent(bundle.coverage)}</span><span>{bundle.start} – {bundle.end}</span></div></section>
    <section className={`${styles.card} ${styles.exportPanel}`} aria-label="Descarga de gráficos">
      <div className={styles.cardHeading}><div><h2>Listos para compartir</h2><p className={styles.inputHint}>PNG de alta resolución con fondo claro, fuentes y supuestos incluidos.</p></div><button type="button" disabled={!!busy} className={styles.primary} onClick={() => void download("all")}>{busy === "all" ? "Generando ZIP…" : "Descargar todos · ZIP"}</button></div>
      <div className={styles.exportDownloads}>{bundle.charts.map(chart => <div className={styles.exportDownload} key={chart.id}><div><strong>{chart.title}</strong><p>{chart.unit}</p></div><button type="button" className={styles.secondary} disabled={!!busy} onClick={() => void download(chart.id)} aria-label={`Descargar ${chart.title.toLowerCase()} en PNG`}>{busy === chart.id ? "Generando…" : "Descargar PNG"}</button></div>)}</div>
      {bundle.missing.length > 0 && <p className={styles.notice}>Muestra parcial: {bundle.missing.join(", ")} sin histórico. Los gráficos incluyen esta aclaración.</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <p className={styles.inputHint} role="status" aria-live="polite">{message || (busy ? "Preparando archivos…" : "4 gráficos · El ZIP incluye una nota de datos y metodología.")}</p>
    </section>
    <div className={styles.actions}><button type="button" className={styles.secondary} onClick={onBack}>← Volver al análisis</button><span>Informe PDF: próxima etapa</span></div>
  </>;
}
