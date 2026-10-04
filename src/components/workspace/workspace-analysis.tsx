"use client";
import { useMemo, useState } from "react";
import type { PortfolioAnalytics } from "@/lib/finance/portfolio";
import { buildPortfolioRiskAnalysis } from "@/lib/finance/risk/portfolio-risk-analysis";
import { chartSeries } from "@/lib/workspace/chart-series";
import type { applyHistoryPreview, HistoryPreview } from "@/lib/workspace/history-preview";
import type { PortfolioDraft } from "@/lib/workspace/portfolio-draft";
import { buildChartBundle, CHART_COLORS } from "@/lib/workspace/export/chart-bundle";
import { WorkspaceExport } from "./workspace-export";
import styles from "./workspace.module.css";

type Applied = ReturnType<typeof applyHistoryPreview> & { preview: HistoryPreview; portfolio: PortfolioAnalytics };
const percent = (n: number) => `${(n * 100).toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;
const dateLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const colors = CHART_COLORS;

function HistoryChart({ title, points, drawdown = false }: { title: string; points: { date: string; value: number }[]; drawdown?: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const series = useMemo(() => chartSeries(points, drawdown), [points, drawdown]);
  const index = selected ?? points.length - 1;
  const point = points[index], coordinate = series.coordinates[index];
  const format = (n: number) => drawdown ? percent(n) : n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
  const zeroY = 24 + series.max / (series.max - series.min) * 190;
  return <section className={`${styles.card} ${styles.analysisChart}`} aria-label={title}>
    <div className={styles.cardHeading}><h2>{title}</h2><span>{drawdown ? "Desde el máximo previo" : "Índice · base 100"}</span></div>
    <p className={styles.chartReadout}><strong>{format(point.value)}</strong><span>{dateLabel(point.date)}</span></p>
    <svg viewBox="0 0 600 250" role="img" aria-label={`${title}: ${format(points[0].value)} al inicio, ${format(points.at(-1)!.value)} al cierre`} onPointerMove={e => { const box = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - box.left) / box.width * 600; const nearest = series.coordinates.reduce((best, p, i) => Math.abs(p.x - x) < Math.abs(series.coordinates[best].x - x) ? i : best, 0); setSelected(nearest); }} onPointerLeave={() => setSelected(null)}>
      {[0, 1, 2, 3].map(i => { const y = 24 + i * 190 / 3; return <g key={i}><line x1="60" x2="580" y1={y} y2={y} stroke="var(--ws-border)"/><text x="51" y={y + 4} textAnchor="end">{format(series.max - i * (series.max - series.min) / 3)}</text></g>; })}
      {drawdown && <line x1="60" x2="580" y1={zeroY} y2={zeroY} stroke="var(--ws-muted)" strokeDasharray="4 4"/>}
      <path d={series.path} fill="none" stroke={drawdown ? "var(--ws-drawdown)" : "var(--ws-accent)"} strokeWidth="2.5"/>
      <line x1={coordinate.x} x2={coordinate.x} y1="24" y2="214" stroke="var(--ws-muted)" strokeDasharray="3 4"/><circle cx={coordinate.x} cy={coordinate.y} r="4" fill={drawdown ? "var(--ws-drawdown)" : "var(--ws-accent)"}/>
      <text x="60" y="239">{dateLabel(points[0].date)}</text><text x="580" y="239" textAnchor="end">{dateLabel(points.at(-1)!.date)}</text>
    </svg>
    <label className={styles.chartSlider}>Explorar fechas<input type="range" min="0" max={points.length - 1} value={index} aria-label={`Explorar ${title.toLowerCase()}`} aria-valuetext={`${dateLabel(point.date)}: ${format(point.value)}`} onChange={e => setSelected(Number(e.target.value))}/></label>
  </section>;
}

function BarChart({ title, rows, signed = false, available = true }: { title: string; rows: { ticker: string; value: number }[]; signed?: boolean; available?: boolean }) {
  const low = signed ? Math.min(0, ...rows.map(r => r.value)) : 0;
  const high = Math.max(0, ...rows.map(r => r.value));
  const span = high - low || 1;
  return <section className={`${styles.card} ${styles.analysisChart}`} aria-label={title}><div className={styles.cardHeading}><h2>{title}</h2><span>{signed ? "% de la volatilidad" : "% del valor analizado"}</span></div>
    {available ? <div className={styles.barList}>{rows.map((row, i) => <div key={row.ticker} className={styles.barRow}><strong>{row.ticker}</strong><div className={styles.barTrack}><span className={styles.barZero} style={{ left: `${-low / span * 100}%` }}/><span className={styles.barFill} style={{ left: `${(Math.min(0, row.value) - low) / span * 100}%`, width: `${Math.abs(row.value) / span * 100}%`, background: row.value < 0 ? "var(--ws-drawdown)" : colors[i % colors.length] }}/></div><span>{percent(row.value)}</span></div>)}</div> : <p className={styles.inputHint}>Sin variación observada: no se puede distribuir la volatilidad entre activos.</p>}
    {signed && available && <p className={styles.inputHint}>Un aporte negativo reduce la volatilidad de esta combinación.</p>}
  </section>;
}

export function WorkspaceAnalysis({ applied, draft, onEdit, onExport, exportOnly = false, onBack }: { applied: Applied; draft: PortfolioDraft; onEdit: () => void; onExport: () => void; exportOnly?: boolean; onBack: () => void }) {
  const { portfolio, preview } = applied;
  const risk = useMemo(() => buildPortfolioRiskAnalysis({ data: preview.data, tickers: portfolio.tickers, weights: applied.weights, portfolioDailyReturns: portfolio.dailyReturns, portfolioNavPoints: portfolio.points, portfolioValue: applied.portfolioValue }), [applied, portfolio, preview]);
  const excluded = [...new Set([...draft.positions.filter(p => p.excluded || p.kind === "money-market").map(p => p.ticker), ...applied.excluded])];
  const shortSample = portfolio.dailyReturns.length < 20;
  const bundle = useMemo(() => buildChartBundle(applied, draft, risk), [applied, draft, risk]);
  if (exportOnly) return <WorkspaceExport bundle={bundle} onBack={onBack} />;
  return <>
    <section className={styles.summary}><div><span className={styles.eyebrow}>{applied.excluded.length ? "MUESTRA PARCIAL" : "CARTERA ANALIZADA"}</span><h2>{draft.name || "Mi cartera"}</h2></div><div className={styles.summaryItems}><span>{portfolio.tickers.length} activos · {draft.currency}</span><span>Cobertura {percent(applied.coverage)}</span><span>{dateLabel(preview.data.meta.commonStartDate)} – {dateLabel(preview.data.meta.commonEndDate)}</span></div></section>
    {applied.excluded.length > 0 && <p className={styles.notice}>Muestra cubierta con pesos normalizados. Sin histórico: {applied.excluded.join(", ")}.</p>}
    {shortSample && <p className={styles.notice}>Muestra corta: {portfolio.dailyReturns.length} retornos diarios. Las estimaciones de riesgo son poco representativas.</p>}
    <div className={styles.metrics}>{[["Rendimiento del período", portfolio.metrics.totalReturn], ["Volatilidad anualizada", portfolio.metrics.annualizedVolatility], ["Máximo drawdown", portfolio.metrics.maxDrawdown]].map(([label, value]) => <section className={styles.metric} key={label as string}><span>{label as string}</span><strong>{percent(value as number)}</strong></section>)}</div>
    <div className={styles.analysisGrid}>
      <BarChart title="Composición de la cartera" rows={bundle.charts[0].rows!}/>
      <BarChart title="Aporte al riesgo" signed available={bundle.charts[1].available} rows={bundle.charts[1].rows!}/>
      <HistoryChart title="Evolución de la cartera" points={bundle.charts[2].points!}/>
      <HistoryChart title="Drawdown" points={bundle.charts[3].points!} drawdown/>
    </div>
    <details className={`${styles.advanced} ${styles.analysisDetails}`}><summary>Métricas avanzadas y metodología</summary>
      <dl className={styles.advancedMetrics}>{[["VaR histórico diario · 95%", shortSample ? "Muestra insuficiente" : percent(risk.tailRisk.historicalVaR)], ["Pérdida media en la cola · 95%", shortSample ? "Muestra insuficiente" : percent(risk.tailRisk.historicalExpectedShortfall)], ["Mejor día", percent(risk.descriptiveStats.bestDailyReturn)], ["Peor día", percent(risk.descriptiveStats.worstDailyReturn)], ["Días positivos", percent(risk.descriptiveStats.positiveDayRatio)], ["Drawdown actual", percent(risk.drawdownSummary.currentDrawdown)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <p>Fuente: {preview.data.meta.priceSource ?? preview.data.meta.provider} · {preview.data.meta.observations} precios comunes · {portfolio.dailyReturns.length} retornos diarios · Moneda: {draft.currency}.</p>
      <p>Simulación con pesos constantes y rebalanceo diario; evolución base 100. No representa el rendimiento de tu cuenta ni incorpora operaciones, comisiones o flujos. Se utiliza la serie disponible sin garantizar retorno total por dividendos ni ajustes. Volatilidad y aportes calculados con covarianza muestral, anualizada a 252 ruedas; VaR y pérdida media históricos diarios al 95%.</p>
      <p>Excluidos: {excluded.join(", ") || "ninguno"}. Sin conversión de moneda ni relleno de fechas faltantes.</p>
      {preview.data.meta.warnings?.map((warning, i) => <p key={i}>{warning.message}</p>)}
      <div className={styles.tableWrap}><table><caption>Pesos y riesgo por activo</caption><thead><tr><th>Activo</th><th>Peso</th><th>Volatilidad anual</th><th>Aporte al riesgo</th></tr></thead><tbody>{risk.riskContribution.map(row => <tr key={row.ticker}><td>{row.ticker}</td><td>{percent(row.weight)}</td><td>{percent(row.annualizedVolatility)}</td><td>{risk.riskContribution.some(r => r.contributionToVolatility !== 0) ? percent(row.percentContributionToVolatility) : "—"}</td></tr>)}</tbody></table></div>
    </details>
    <div className={styles.actions}><button type="button" className={styles.secondary} onClick={onEdit}>← Editar cartera</button><button type="button" className={styles.primary} onClick={onExport}>Exportar →</button></div>
  </>;
}
