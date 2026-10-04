import { chartSeries } from "@/lib/workspace/chart-series";
import { CHART_COLORS, exportNotes, formatPercent, type ChartBundle, type ExportChart } from "./chart-bundle";
import { escapeXml } from "./chart-svg";
export type ReportOptions = { title: string; comment: string };
export type ReportPage = { svg: string; width: number; height: number; section: string };
const WIDTH = 595, HEIGHT = 842;
const text = (x: number, y: number, value: string, size = 10, color = "#637482", anchor = "start") => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${escapeXml(value)}</text>`;
function textWidth(value: string): number {
  return [...value].reduce((width, char) => width + (/[ilI.,:;'!| ]/.test(char) ? .3 : /[MW@%]/.test(char) ? .95 : /[A-Z0-9]/.test(char) ? .68 : char.codePointAt(0)! > 255 ? 1 : .58), 0);
}
export function wrapReportText(value: string, limit = 88): string[] {
  const lines: string[] = [], maxWidth = limit * .55;
  for (const paragraph of value.replace(/\r/g, "").split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (line && textWidth(`${line} ${word}`) > maxWidth) { lines.push(line); line = ""; }
      if (textWidth(word) > maxWidth) {
        if (line) { lines.push(line); line = ""; }
        let chunk = "";
        for (const char of word) { if (chunk && textWidth(chunk + char) > maxWidth) { lines.push(chunk); chunk = ""; } chunk += char; }
        line = chunk;
      } else line += `${line ? " " : ""}${word}`;
    }
    lines.push(line);
  }
  return lines;
}
function metricCards(items: [string, string][], y: number) {
  return items.map(([label, value], i) => `<rect x="${32 + i * 180}" y="${y}" width="169" height="62" rx="6" fill="#f1f5f4"/>${text(43 + i * 180, y + 21, label, 8.5)}${text(43 + i * 180, y + 46, value, 20, "#182b3a")}`).join("");
}
function bars(chart: ExportChart, top: number) {
  if (!chart.available) return text(32, top + 40, "Sin variación observada: aporte al riesgo no disponible.");
  const rows = chart.rows!; const low = chart.id === "riesgo" ? Math.min(0, ...rows.map(r => r.value)) : 0;
  const high = Math.max(0, ...rows.map(r => r.value)), span = high - low || 1;
  const spacing = rows.length > 20 ? 16 : rows.length > 12 ? 22 : 30;
  return rows.map((row, i) => { const y = top + i * spacing, zero = 108 - low / span * 369;
    return text(32, y + 8, row.ticker, 10, "#182b3a") + `<rect x="108" y="${y - 1}" width="369" height="12" rx="2" fill="#e5eaee"/><rect x="${108 + (Math.min(0, row.value) - low) / span * 369}" y="${y + 1}" width="${Math.abs(row.value) / span * 369}" height="8" rx="1" fill="${row.value < 0 ? "#b95247" : CHART_COLORS[i % CHART_COLORS.length]}"/><line x1="${zero}" x2="${zero}" y1="${y - 3}" y2="${y + 13}" stroke="#637482" stroke-width=".5"/>` + text(562, y + 8, formatPercent(row.value), 10, "#182b3a", "end");
  }).join("");
}
function history(chart: ExportChart, top: number) {
  const points = chart.points!, drawdown = chart.id === "drawdown";
  const series = chartSeries(points, drawdown);
  const format = (n: number) => drawdown ? formatPercent(n) : n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
  let result = text(32, top, chart.title, 17, "#182b3a") + text(32, top + 22, `${chart.unit} · Último valor: ${format(points.at(-1)!.value)}`, 10);
  const chartTop = top + 45, chartHeight = 177;
  for (let i = 0; i < 4; i++) { const y = chartTop + i * chartHeight / 3; result += `<line x1="70" x2="562" y1="${y}" y2="${y}" stroke="#e0e6ea"/>` + text(62, y + 3, format(series.max - i * (series.max - series.min) / 3), 8, "#637482", "end"); }
  const path = series.coordinates.map((p, i) => `${i ? "L" : "M"}${(70 + (p.x - 60) / 520 * 492).toFixed(2)},${(chartTop + (p.y - 24) / 190 * chartHeight).toFixed(2)}`).join(" ");
  if (drawdown) { const y = chartTop + series.max / (series.max - series.min) * chartHeight; result += `<line x1="70" x2="562" y1="${y}" y2="${y}" stroke="#637482" stroke-dasharray="3 3"/>`; }
  result += `<path d="${path}" fill="none" stroke="${drawdown ? "#b95247" : "#176c62"}" stroke-width="1.7"/>`;
  return result + text(70, chartTop + chartHeight + 19, points[0].date, 8) + text(562, chartTop + chartHeight + 19, points.at(-1)!.date, 8, "#637482", "end");
}
export function renderReportPages(bundle: ChartBundle, options: ReportOptions, generatedAt: string): ReportPage[] {
  if (options.title.length > 100 || options.comment.length > 1200) throw new Error("El título admite 100 caracteres y el comentario 1200.");
  const title = options.title.trim() || bundle.name;
  const titleLines = wrapReportText(title, 74);
  const header = text(32, 34, "FV FINANCE LAB · INFORME DE CARTERA", 9, "#176c62") + titleLines.map((s, i) => text(32, 62 + i * 15, s, 13, "#182b3a")).join("") + text(32, 110, `${bundle.currency} · ${bundle.start} a ${bundle.end} · Cobertura ${formatPercent(bundle.coverage)}`, 10) + text(32, 129, `Generado: ${generatedAt}`, 8);
  const status = bundle.missing.length ? "MUESTRA PARCIAL · pesos normalizados sobre los activos cubiertos" : "SIMULACIÓN HISTÓRICA · pesos constantes y rebalanceo diario";
  const sections: { name: string; body: string }[] = [];
  const m = bundle.metrics;
  sections.push({ name: "Resumen y composición", body: text(32, 155, status, 8, "#176c62") + metricCards([["Rendimiento del período", formatPercent(m.totalReturn)], ["Volatilidad anualizada", formatPercent(m.annualizedVolatility)], ["Máximo drawdown", formatPercent(m.maxDrawdown)]], 172) + text(32, 265, "Composición de la cartera", 17, "#182b3a") + text(32, 284, "% del valor analizado · Money market excluido", 9) + bars(bundle.charts[0], 309) + text(32, 795, "La simulación no representa el rendimiento real de una cuenta con compras, ventas o flujos.", 8) });
  sections.push({ name: "Evolución y drawdown", body: history(bundle.charts[2], 168) + history(bundle.charts[3], 457) + text(32, 760, "Mismas fechas, moneda y pesos que en la pantalla de análisis; sin conversión ni relleno de datos.", 8) });
  const sampleLimited = bundle.observations < 20;
  sections.push({ name: "Riesgo de la cartera", body: text(32, 155, sampleLimited ? "MUESTRA CORTA · estimaciones poco representativas" : `${bundle.observations} retornos diarios comunes · Riesgo histórico`, 8, "#176c62") + metricCards([["VaR histórico diario · 95%", sampleLimited ? "No disponible" : formatPercent(m.historicalVaR)], ["Pérdida media en cola · 95%", sampleLimited ? "No disponible" : formatPercent(m.expectedShortfall)], ["Drawdown actual", formatPercent(m.currentDrawdown)]], 172) + text(32, 265, "Aporte al riesgo por activo", 17, "#182b3a") + text(32, 284, "% de la volatilidad · Un aporte negativo reduce la volatilidad de esta combinación.", 9) + bars(bundle.charts[1], 309) + text(32, 795, "Covarianza muestral anualizada a 252 ruedas. VaR y pérdida media: horizonte diario, confianza 95%.", 8) });
  const notes = [...(options.comment.trim() ? ["Comentario del asesor", options.comment.trim(), ""] : []), "Datos y metodología", ...exportNotes(bundle, generatedAt).slice(1)];
  const noteLines = notes.flatMap(note => [...wrapReportText(note), ""]);
  const capacity = 43;
  for (let i = 0; i < noteLines.length; i += capacity) {
    sections.push({ name: i ? "Notas - continuación" : "Notas del informe", body: noteLines.slice(i, i + capacity).map((s, line) => text(32, 161 + line * 14, s, 10, "#182b3a")).join("") });
  }
  return sections.map((section, i) => ({ section: section.name, width: 1600, height: Math.round(1600 * HEIGHT / WIDTH), svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="${Math.round(1600 * HEIGHT / WIDTH)}" viewBox="0 0 ${WIDTH} ${HEIGHT}"><rect width="595" height="842" fill="#ffffff"/><g font-family="Arial, sans-serif">${header}${section.body}<line x1="32" x2="562" y1="812" y2="812" stroke="#e0e6ea"/>${text(32, 828, section.name, 8)}${text(562, 828, `${i + 1} / ${sections.length}`, 8, "#637482", "end")}</g></svg>` }));
}
