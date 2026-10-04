import { chartSeries } from "@/lib/workspace/chart-series";
import { CHART_COLORS, exportNotes, formatPercent, type ChartBundle, type ExportChart } from "./chart-bundle";
export const escapeXml = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]!)).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
function wrap(value: string, width = 118): string[] {
  const lines: string[] = []; let line = "";
  for (const word of value.split(/\s+/)) {
    if (line && line.length + word.length + 1 > width) { lines.push(line); line = ""; }
    if (word.length > width) { if (line) { lines.push(line); line = ""; } for (let i = 0; i < word.length; i += width) lines.push(word.slice(i, i + width)); }
    else line += `${line ? " " : ""}${word}`;
  }
  if (line) lines.push(line);
  return lines;
}
export function renderChartSvg(bundle: ChartBundle, chart: ExportChart, generatedAt: string) {
  const text = (x: number, y: number, value: string, size = 24, color = "#637482", anchor = "start") => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${escapeXml(value)}</text>`;
  const nameLines = wrap(bundle.name, 75);
  const top = 216 + nameLines.length * 34;
  const plotHeight = chart.rows ? Math.max(280, chart.rows.length * 48 + 36) : 530;
  const footerTop = top + plotHeight + 58;
  const footerLines = exportNotes(bundle, generatedAt).flatMap(line => wrap(line));
  const height = footerTop + 65 + footerLines.length * 27;
  let plot = "";
  if (!chart.available) plot = text(70, top + 100, "Sin variación observada: aporte al riesgo no disponible.", 28);
  else if (chart.rows) {
    const low = chart.id === "riesgo" ? Math.min(0, ...chart.rows.map(r => r.value)) : 0;
    const high = Math.max(0, ...chart.rows.map(r => r.value)); const span = high - low || 1;
    chart.rows.forEach((row, i) => {
      const y = top + i * 48 + 30, zero = 230 - low / span * 1120;
      plot += text(70, y + 6, row.ticker, 25, "#182b3a");
      plot += `<rect x="230" y="${y - 21}" width="1120" height="30" rx="4" fill="#e5eaee"/><rect x="${230 + (Math.min(0, row.value) - low) / span * 1120}" y="${y - 17}" width="${Math.abs(row.value) / span * 1120}" height="22" rx="3" fill="${row.value < 0 ? "#b95247" : CHART_COLORS[i % CHART_COLORS.length]}"/><line x1="${zero}" x2="${zero}" y1="${y - 24}" y2="${y + 12}" stroke="#637482"/>`;
      plot += text(1530, y + 6, formatPercent(row.value), 25, "#182b3a", "end");
    });
  } else if (chart.points) {
    const isDrawdown = chart.id === "drawdown";
    const series = chartSeries(chart.points, isDrawdown);
    const format = (n: number) => isDrawdown ? formatPercent(n) : n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
    const px = (x: number) => 150 + (x - 60) / 520 * 1380;
    const py = (y: number) => top + 65 + (y - 24) / 190 * 375;
    plot += text(70, top + 18, `Último valor: ${format(chart.points.at(-1)!.value)}`, 28, "#182b3a");
    for (let i = 0; i < 4; i++) {
      const y = top + 65 + i * 125;
      plot += `<line x1="150" x2="1530" y1="${y}" y2="${y}" stroke="#e0e6ea"/>` + text(135, y + 8, format(series.max - i * (series.max - series.min) / 3), 23, "#637482", "end");
    }
    if (isDrawdown) { const y = top + 65 + series.max / (series.max - series.min) * 375; plot += `<line x1="150" x2="1530" y1="${y}" y2="${y}" stroke="#637482" stroke-dasharray="8 8"/>`; }
    const path = series.coordinates.map((p, i) => `${i ? "L" : "M"}${px(p.x).toFixed(2)},${py(p.y).toFixed(2)}`).join(" ");
    plot += `<path d="${path}" fill="none" stroke="${isDrawdown ? "#b95247" : "#176c62"}" stroke-width="4"/>`;
    plot += text(150, top + 490, chart.points[0].date, 24) + text(1530, top + 490, chart.points.at(-1)!.date, 24, "#637482", "end");
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="${height}" viewBox="0 0 1600 ${height}"><rect width="1600" height="${height}" fill="#ffffff"/><g font-family="Arial, sans-serif">${text(70, 62, "FV FINANCE LAB · ANÁLISIS DE CARTERA", 22, "#176c62")}${text(70, 125, chart.title, 44, "#182b3a")}${nameLines.map((line, i) => text(70, 177 + i * 34, line, 28, "#182b3a")).join("")}${text(70, top - 32, `${bundle.currency} · ${bundle.start} a ${bundle.end} · Cobertura ${formatPercent(bundle.coverage)} · ${chart.unit}`, 24)}${plot}<line x1="70" x2="1530" y1="${footerTop}" y2="${footerTop}" stroke="#e0e6ea"/>${footerLines.map((line, i) => text(70, footerTop + 42 + i * 27, line, 21)).join("")}</g></svg>`;
  return { svg, width: 1600, height };
}
