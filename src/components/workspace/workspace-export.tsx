"use client";
import { useEffect, useRef, useState } from "react";
import type { ChartBundle, ExportChart } from "@/lib/workspace/export/chart-bundle";
import { formatPercent } from "@/lib/workspace/export/chart-bundle";
import styles from "./workspace.module.css";
export function WorkspaceExport({ bundle, onBack }: { bundle: ChartBundle; onBack: () => void }) {
  const [busy, setBusy] = useState<ExportChart["id"] | "all" | "pdf" | null>(null);
  const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const [title, setTitle] = useState(bundle.name);
  const [comment, setComment] = useState("");
  const [fileLink, setFileLink] = useState<{ url: string; name: string } | null>(null);
  const downloadUrl = useRef<string | null>(null);
  const generation = useRef(0), locked = useRef(false);
  useEffect(() => () => { ++generation.current; if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current); }, []);
  async function download(id: ExportChart["id"] | "all" | "pdf") {
    if (locked.current) return;
    locked.current = true; const request = ++generation.current;
    if (downloadUrl.current) { URL.revokeObjectURL(downloadUrl.current); downloadUrl.current = null; }
    setFileLink(null); setBusy(id); setError(""); setMessage("");
    try {
      const { prepareChartDownload, saveDownload } = await import("@/lib/workspace/export/download-charts");
      const file = id === "pdf" ? await (await import("@/lib/workspace/export/download-report")).prepareReportDownload(bundle, { title, comment }) : await prepareChartDownload(bundle, id);
      if (request !== generation.current) return;
      const url = saveDownload(file.blob, file.name); downloadUrl.current = url; setFileLink({ url, name: file.name }); setMessage("Archivo generado. Descarga iniciada.");
    } catch (e) { if (request === generation.current) setError(e instanceof Error ? e.message : "No se pudo generar el archivo. Volvé a intentar."); }
    finally { if (request === generation.current) { locked.current = false; setBusy(null); } }
  }
  return <>
    <section className={styles.summary}><div><p className={styles.eyebrow}>EXPORTAR</p><h2>{bundle.name}</h2></div><div className={styles.summaryItems}><span>{bundle.currency} · Cobertura {formatPercent(bundle.coverage)}</span><span>{bundle.start} – {bundle.end}</span></div></section>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {(message || busy) && <p className={styles.inputHint} role="status" aria-live="polite">{message || "Preparando archivos…"} {fileLink && <a href={fileLink.url} download={fileLink.name} className={styles.downloadRetry}>Descargar nuevamente</a>}</p>}
    {bundle.comparison && <p className={styles.notice}>PDF con comparación actual/propuesta. Los PNG y ZIP conservan la cartera actual.</p>}
    <section className={`${styles.card} ${styles.exportPanel}`} aria-label="Informe PDF">
      <div className={styles.cardHeading}><div><h2>Informe para clientes</h2><p className={styles.inputHint}>Peso y riesgo en tortas, factores, correlaciones, evolución y pérdidas de cola.</p></div><button type="button" disabled={!!busy || bundle.factors?.status==="loading"} className={styles.primary} onClick={() => void download("pdf")}>{busy === "pdf" ? "Generando PDF…" : bundle.factors?.status==="loading" ? "Esperando factores…" : "Descargar informe PDF"}</button></div>
      <div className={styles.reportFields}><label>Título o alias de cartera<input maxLength={100} value={title} disabled={!!busy} onChange={e => setTitle(e.target.value)} /></label><label>Comentario del asesor · opcional<textarea maxLength={1200} rows={3} value={comment} disabled={!!busy} onChange={e => setComment(e.target.value)} placeholder="Observaciones para la conversación con el cliente" /></label></div>
    </section>
    <section className={`${styles.card} ${styles.exportPanel}`} aria-label="Descarga de gráficos">
      <div className={styles.cardHeading}><div><h2>Listos para compartir</h2><p className={styles.inputHint}>PNG de alta resolución con fondo claro, fuentes y supuestos incluidos.</p></div><button type="button" disabled={!!busy} className={styles.primary} onClick={() => void download("all")}>{busy === "all" ? "Generando ZIP…" : "Descargar todos · ZIP"}</button></div>
      <div className={styles.exportDownloads}>{bundle.charts.map(chart => <div className={styles.exportDownload} key={chart.id}><div><strong>{chart.title}</strong><p>{chart.unit}</p></div><button type="button" className={styles.secondary} disabled={!!busy} onClick={() => void download(chart.id)} aria-label={`Descargar ${chart.title.toLowerCase()} en PNG`}>{busy === chart.id ? "Generando…" : "Descargar PNG"}</button></div>)}</div>
      {bundle.missing.length > 0 && <p className={styles.notice}>Muestra parcial: {bundle.missing.join(", ")} sin histórico. Los gráficos incluyen esta aclaración.</p>}
      <p className={styles.inputHint}>4 gráficos · El ZIP incluye una nota de datos y metodología.</p>
    </section>
    <div className={styles.actions}><button type="button" className={styles.secondary} onClick={onBack}>← Volver al análisis</button><span>Revisá el informe antes de compartirlo.</span></div>
  </>;
}
