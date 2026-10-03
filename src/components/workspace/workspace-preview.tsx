"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./workspace.module.css";

const steps = ["Cargar cartera", "Analizar", "Exportar"] as const;
const assets = [
  { ticker: "SPY", name: "Acciones de Estados Unidos", weight: 50, color: "#176c62" },
  { ticker: "EFA", name: "Desarrollados fuera de EE. UU.", weight: 25, color: "#7bafa7" },
  { ticker: "GDX", name: "Mineras de oro", weight: 15, color: "#b69250" },
  { ticker: "NVDA", name: "Tecnología", weight: 10, color: "#a8b8ca" },
];

function Allocation() {
  return <section className={styles.card} aria-labelledby="allocation-title">
    <div className={styles.cardHeading}><h2 id="allocation-title">Composición</h2><span>4 activos</span></div>
    <div className={styles.allocation}>
      <div className={styles.donut} role="img" aria-label="Pesos ilustrativos: SPY 50%, EFA 25%, GDX 15%, NVDA 10%"><div><strong>100%</strong><span>invertido</span></div></div>
      <ul className={styles.legend}>{assets.map(asset => <li key={asset.ticker}><span className={styles.dot} style={{ background: asset.color }} /><span>{asset.ticker}</span><strong>{asset.weight}%</strong></li>)}</ul>
    </div>
  </section>;
}

function ExampleChart({ drawdown = false }: { drawdown?: boolean }) {
  const title = drawdown ? "Drawdown" : "Evolución de la cartera";
  const path = drawdown ? "M40 40 L80 40 L120 75 L160 50 L200 90 L240 115 L280 75 L320 40 L360 65 L400 40 L440 85 L480 50 L520 40" : "M40 148 L80 132 L120 140 L160 114 L200 126 L240 110 L280 98 L320 84 L360 100 L400 78 L440 65 L480 70 L520 49";
  return <section className={styles.card} aria-label={title}>
    <div className={styles.cardHeading}><h2>{title}</h2><span>{drawdown ? "Desde el máximo" : "Base 100"}</span></div>
    <svg className={styles.chart} viewBox="0 0 560 210" role="img" aria-label={`${title}: trazado ilustrativo, sin cotizaciones reales`}>
      {[40, 90, 140].map(y => <line key={y} x1="40" x2="520" y1={y} y2={y} stroke="#e8edf0" />)}
      <text x="2" y="44">{drawdown ? "0%" : "110"}</text><text x="2" y="94">{drawdown ? "−3%" : "105"}</text><text x="2" y="144">{drawdown ? "−6%" : "100"}</text>
      <path d={`${path} L520 ${drawdown ? 40 : 160} L40 ${drawdown ? 40 : 160} Z`} fill={drawdown ? "#b6925018" : "#176c6212"} />
      <path d={path} fill="none" stroke={drawdown ? "#b69250" : "#176c62"} strokeWidth="3" strokeLinejoin="round" />
      <text x="40" y="193">Inicio</text><text x="265" y="193">Mitad del período</text><text x="500" y="193">Fin</text>
    </svg>
  </section>;
}

export function WorkspacePreview() {
  const [step, setStep] = useState(0);
  const [format, setFormat] = useState<"pdf" | "png">("pdf");
  return <div className={styles.workspace}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}><span className={styles.monogram}>FV</span><span><strong>Finance Lab</strong><small>Espacio de trabajo</small></span></Link>
      <Link href="/tools" className={styles.labLink}>Ir al laboratorio ↗</Link>
    </header>
    <div className={styles.content}>
      <div className={styles.intro}><div><p className={styles.eyebrow}>CARTERAS · WEALTH MANAGEMENT</p><h1>Tu cartera, en perspectiva.</h1><p>Cargá, analizá y prepará material para tus clientes.</p></div><span className={styles.previewBadge}>Propuesta visual · datos de ejemplo</span></div>
      <nav className={styles.steps} aria-label="Pasos de análisis">{steps.map((label, index) => <button type="button" key={label} onClick={() => setStep(index)} aria-current={step === index ? "step" : undefined} className={step === index ? styles.activeStep : ""}><span>{index + 1}</span>{label}</button>)}</nav>
      <section className={styles.summary} aria-label="Cartera de ejemplo"><div><span className={styles.eyebrow}>CARTERA DE EJEMPLO</span><h2>Global diversificada</h2></div><div className={styles.summaryItems}><span>4 activos</span><span>ARS</span><span>6 meses</span><span>Sin money market</span></div></section>
      <div className={styles.stage} key={step}>
        {step === 0 && <>
          <div className={styles.sectionIntro}><h2>Empezá por la cartera</h2><p>Una tabla simple, con lo que necesitás revisar.</p></div>
          <div className={styles.loadGrid}><section className={styles.card}>
            <div className={styles.cardHeading}><h2>Activos y pesos</h2><span>Ejemplo · solo lectura</span></div>
            <div className={styles.tableWrap}><table><thead><tr><th>Activo</th><th>Exposición</th><th>Peso</th></tr></thead><tbody>{assets.map(asset => <tr key={asset.ticker}><td><span className={styles.ticker}><i style={{ background: asset.color }} />{asset.ticker}</span></td><td>{asset.name}</td><td>{asset.weight}%</td></tr>)}</tbody><tfoot><tr><td colSpan={2}>Total</td><td>100%</td></tr></tfoot></table></div>
            <div className={styles.tableFooter}><span>La carga real se conecta en Work 14.</span><Link href="/tools/risk">Usar el análisis actual ↗</Link></div>
          </section><Allocation /></div>
          <details className={styles.advanced}><summary>Opciones avanzadas</summary><p>Moneda histórica, período, fuente y tratamiento de precios estarán aquí. Los controles estarán disponibles al conectar la carga real.</p></details>
          <div className={styles.actions}><span>Recorré la propuesta con esta cartera de ejemplo.</span><button type="button" className={styles.primary} onClick={() => setStep(1)}>Ver análisis de ejemplo →</button></div>
        </>}
        {step === 1 && <>
          <div className={styles.sectionIntro}><h2>Lo esencial, a primera vista</h2><p>Vista ilustrativa: métricas y gráficos todavía sin conectar al motor.</p></div>
          <div className={styles.metrics}>{[["Rendimiento del período", "—", "Composición actual, con supuestos explícitos"], ["Volatilidad anualizada", "—", "Variabilidad de los retornos"], ["Máximo drawdown", "—", "Mayor caída desde un máximo"]].map(([label, value, note]) => <section className={styles.metric} key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></section>)}</div>
          <div className={styles.chartGrid}><ExampleChart /><Allocation /><ExampleChart drawdown /><section className={styles.card}><div className={styles.cardHeading}><h2>Aporte al riesgo</h2><span>Diseño ilustrativo</span></div><div className={styles.riskPlaceholder}><span className={styles.riskIcon}>%</span><p>Qué parte del riesgo aporta cada activo.</p><small>Se calculará con los históricos y pesos de tu cartera.</small></div></section></div>
          <details className={styles.advanced}><summary>Ver más métricas y supuestos</summary><p>Correlaciones, VaR y parámetros de cálculo quedarán en esta sección. La moneda, las fechas efectivas y la cobertura se mostrarán junto al resultado.</p></details>
          <div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => setStep(0)}>← Volver a la cartera</button><button type="button" className={styles.primary} onClick={() => setStep(2)}>Preparar informe →</button></div>
        </>}
        {step === 2 && <>
          <div className={styles.sectionIntro}><h2>Listo para conversar</h2><p>Un informe breve o gráficos para compartir.</p></div>
          <div className={styles.exportGrid}><section className={styles.card}><h2>Elegí el formato</h2><div className={styles.formats} role="group" aria-label="Formato de exportación">
            <button type="button" aria-pressed={format === "pdf"} onClick={() => setFormat("pdf")} className={format === "pdf" ? styles.selectedFormat : ""}><span className={styles.fileIcon}>PDF</span><strong>Informe para clientes</strong><small>Resumen y gráficos en un solo documento.</small></button>
            <button type="button" aria-pressed={format === "png"} onClick={() => setFormat("png")} className={format === "png" ? styles.selectedFormat : ""}><span className={styles.fileIcon}>PNG</span><strong>Gráficos individuales</strong><small>Para WhatsApp, mails y presentaciones.</small></button>
          </div><p className={styles.exportNote}>La descarga se habilita en Work 16–17.</p><button type="button" className={styles.primary} disabled>Descargar {format === "pdf" ? "informe PDF" : "gráficos"}</button></section>
          <section className={`${styles.card} ${styles.report}`} aria-label="Contenido del informe propuesto"><span className={styles.eyebrow}>FV FINANCE LAB</span><h2>{format === "pdf" ? "Informe de cartera" : "Gráficos de cartera"}</h2><p>Global diversificada · ejemplo</p><div className={styles.reportLine} /><ul>{["Composición y pesos", "Evolución y drawdown", "Aporte al riesgo", "Moneda, período y fuentes"].map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ul><small>Propuesta de contenido · sin resultados reales</small></section></div>
          <div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => setStep(1)}>← Volver al análisis</button></div>
        </>}
      </div>
      <footer className={styles.footer}><span>FV Finance Lab · Herramientas para tu trabajo</span><span>Work 13 · Propuesta navegable</span></footer>
    </div>
  </div>;
}
