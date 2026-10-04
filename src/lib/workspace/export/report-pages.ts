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
  return items.map(([label, value], i) => `<rect x="${32 + i * 180}" y="${y}" width="169" height="62" rx="3" fill="#f3f6f5"/><line x1="${32 + i * 180}" x2="${201 + i * 180}" y1="${y}" y2="${y}" stroke="#176c62" stroke-width="1.5"/>${text(43 + i * 180, y + 21, label, 8.5)}${text(43 + i * 180, y + 46, value, 20, "#182b3a")}`).join("");
}
function history(chart: ExportChart, top: number) {
  const points = chart.points!, drawdown = chart.id === "drawdown", zeroLine = drawdown && chart.title !== "Volatilidad dinámica EWMA";
  const series = chartSeries(points, drawdown);
  if (!zeroLine && drawdown) {
    series.min = 0;
    series.coordinates = series.coordinates.map((p, i) => ({ ...p, y: 24 + (series.max - points[i].value) / series.max * 190 }));
  }
  const format = (n: number) => drawdown ? formatPercent(n) : n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
  let result = text(32, top, chart.title, 17, "#182b3a") + text(32, top + 22, `${chart.unit} · Último valor: ${format(points.at(-1)!.value)}`, 10);
  const chartTop = top + 45, chartHeight = 177;
  for (let i = 0; i < 4; i++) { const y = chartTop + i * chartHeight / 3; result += `<line x1="70" x2="562" y1="${y}" y2="${y}" stroke="#e0e6ea"/>` + text(62, y + 3, format(series.max - i * (series.max - series.min) / 3), 8, "#637482", "end"); }
  const path = series.coordinates.map((p, i) => `${i ? "L" : "M"}${(70 + (p.x - 60) / 520 * 492).toFixed(2)},${(chartTop + (p.y - 24) / 190 * chartHeight).toFixed(2)}`).join(" ");
  if (zeroLine) { const y = chartTop + series.max / (series.max - series.min) * chartHeight; result += `<line x1="70" x2="562" y1="${y}" y2="${y}" stroke="#637482" stroke-dasharray="3 3"/>`; }
  result += `<path d="${path}" fill="none" stroke="${drawdown ? "#b95247" : "#176c62"}" stroke-width="1.7"/>`;
  return result + text(70, chartTop + chartHeight + 19, points[0].date, 8) + text(562, chartTop + chartHeight + 19, points.at(-1)!.date, 8, "#637482", "end");
}
function paragraph(value: string, y: number, color = "#637482") {
  return wrapReportText(value).map((s, i) => text(32, y + i * 14, s, 10, color)).join("");
}
function donut(rows: { ticker: string; value: number }[]) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const shown = sorted.slice(0, 5);
  if (sorted.length > 5) shown.push({ ticker: "Otros", value: sorted.slice(5).reduce((s, r) => s + r.value, 0) });
  let angle = -Math.PI / 2, svg = "";
  shown.forEach((r, i) => {
    const end = angle + r.value * Math.PI * 2;
    const x = (a: number) => 164 + Math.cos(a) * 92, y = (a: number) => 390 + Math.sin(a) * 92;
    if (r.value >= .999999) svg += `<circle cx="164" cy="390" r="92" fill="${CHART_COLORS[i]}"/>`;
    else svg += `<path d="M164,390 L${x(angle)},${y(angle)} A92,92 0 ${r.value > .5 ? 1 : 0},1 ${x(end)},${y(end)} Z" fill="${CHART_COLORS[i]}"/>`;
    angle = end;
    svg += `<rect x="304" y="${320 + i * 29}" width="9" height="9" rx="2" fill="${CHART_COLORS[i]}"/>` + text(324, 329 + i * 29, r.ticker, 11, "#182b3a") + text(562, 329 + i * 29, formatPercent(r.value), 11, "#182b3a", "end");
  });
  return svg + `<circle cx="164" cy="390" r="59" fill="white"/>` + text(164, 386, `${rows.length}`, 30, "#182b3a", "middle") + text(164, 407, "activos", 10, "#637482", "middle");
}
function weightRisk(bundle: ChartBundle, rows: { ticker: string; value: number }[]) {
  const risk = new Map(bundle.charts[1].rows?.map(r => [r.ticker, r.value]));
  const low = Math.min(0, ...rows.map(r => risk.get(r.ticker) ?? 0)), high = Math.max(...rows.map(r => Math.max(r.value, risk.get(r.ticker) ?? 0)), .01), span = high - low;
  const zero = 112 - low / span * 330;
  let svg = text(32, 184, "Peso (verde) / aporte a volatilidad (azul); negativo en rojo", 9);
  rows.forEach((r, i) => {
    const y = 206 + i * 22, v = risk.get(r.ticker) ?? 0;
    svg += text(32, y + 8, r.ticker, 9, "#182b3a");
    [r.value, v].forEach((n, k) => { svg += `<rect x="${112 + (Math.min(0, n) - low) / span * 330}" y="${y + k * 7}" width="${Math.abs(n) / span * 330}" height="5" fill="${k ? n < 0 ? "#b95247" : "#5688b5" : "#248c7c"}"/>`; });
    svg += `<line x1="${zero}" x2="${zero}" y1="${y - 2}" y2="${y + 13}" stroke="#637482" stroke-width=".5"/>` + text(562, y + 8, `${formatPercent(r.value)} / ${bundle.charts[1].available ? formatPercent(v) : "N/D"}`, 9, "#182b3a", "end");
  });
  return svg;
}
function correlationGrid(bundle: ChartBundle, rows: { ticker: string; value: number }[]) {
  const d = bundle.diagnostics;
  if (!d) return paragraph("Correlaciones no disponibles para este análisis.", 520);
  const size = Math.min(48, 200 / rows.length), left = 170, top = 521;
  let svg = text(32, 466, "Diversificación · correlaciones", 17, "#182b3a") + text(32, 485, "-1 opuestos / 0 sin relación lineal / +1 movimientos similares", 9);
  rows.forEach((r, i) => {
    svg += text(left - 10, top + i * size + size * .65, r.ticker, 8, "#182b3a", "end");
    svg += `<g transform="translate(${left + i * size + size / 2},${top - 7}) rotate(-45)">${text(0, 0, r.ticker, 7)}</g>`;
    rows.forEach((c, j) => {
      const v = d.correlation[d.tickers.indexOf(r.ticker)]?.[d.tickers.indexOf(c.ticker)] ?? null;
      const fill = v === null ? "#e5eaee" : v >= 0 ? `rgb(${Math.round(242 - v * 210)},${Math.round(248 - v * 110)},${Math.round(247 - v * 123)})` : `rgb(${Math.round(242 + v * 156)},${Math.round(248 + v * 112)},${Math.round(247 + v * 66)})`;
      svg += `<rect x="${left + j * size}" y="${top + i * size}" width="${size - 1}" height="${size - 1}" fill="${fill}"/>` + text(left + j * size + size / 2, top + i * size + size * .65, v === null ? "N/D" : v.toFixed(2), 7, v !== null && Math.abs(v) > .65 ? "white" : "#182b3a", "middle");
    });
  });
  return svg;
}
function histogram(bundle: ChartBundle) {
  const bins = bundle.diagnostics?.histogram;
  if (!bins?.length) return paragraph("Distribución de retornos no disponible.", 550);
  const left = 70, top = 551, width = 492, height = 130, maxCount = Math.max(...bins.map(b => b.count), 1);
  const low = bins[0].low, high = bins.at(-1)!.high;
  let svg = text(32, 508, "Distribución de retornos diarios", 17, "#182b3a") + text(32, 528, "Altura: cantidad de ruedas · Líneas: umbrales de pérdida histórica", 9);
  bins.forEach((b, i) => { const h = b.count / maxCount * height; svg += `<rect x="${left + i * width / bins.length}" y="${top + height - h}" width="${width / bins.length - 2}" height="${h}" fill="${b.high <= 0 ? "#b96961" : "#248c7c"}"/>`; });
  svg += text(left, 700, formatPercent(low), 8) + text(562, 700, formatPercent(high), 8, "#637482", "end");
  if (bundle.observations >= 20) {
    [[bundle.metrics.historicalVaR, "#b95247"], [bundle.metrics.expectedShortfall, "#5688b5"]].forEach(([v, color]) => {
      const x = left + (-Number(v) - low) / (high - low) * width;
      if (x >= left && x <= left + width) svg += `<line x1="${x}" x2="${x}" y1="${top}" y2="${top + height}" stroke="${color}" stroke-width="2" stroke-dasharray="4 3"/>`;
    });
  }
  return svg + text(32, 722, "Rojo: VaR · Azul: pérdida media de cola (ES). No son pérdidas máximas garantizadas.", 9);
}
export function renderReportPages(bundle: ChartBundle, options: ReportOptions, generatedAt: string): ReportPage[] {
  if (options.title.length > 100 || options.comment.length > 1200) throw new Error("El título admite 100 caracteres y el comentario 1200.");
  const title = options.title.trim() || bundle.name;
  const sections: { name: string; body: string }[] = [], m = bundle.metrics;
  const weights = [...bundle.charts[0].rows!].sort((a, b) => b.value - a.value);
  const selected = weights.slice(0, 10);
  const topThree = weights.slice(0, 3).reduce((s, r) => s + r.value, 0);
  const riskRows = [...(bundle.charts[1].rows ?? [])].sort((a, b) => b.value - a.value);
  const positiveTotal = riskRows.reduce((s, r) => s + Math.max(0, r.value), 0);
  const riskShare = positiveTotal ? riskRows.slice(0, 3).reduce((s, r) => s + Math.max(0, r.value), 0) / positiveTotal : null;
  sections.push({ name: "Resumen ejecutivo", body: text(32, 155, bundle.missing.length ? "MUESTRA PARCIAL · pesos normalizados sobre activos cubiertos" : "SIMULACIÓN HISTÓRICA · pesos constantes y rebalanceo diario", 8, "#176c62") + metricCards([["Rendimiento del período", formatPercent(m.totalReturn)], ["Volatilidad anualizada", formatPercent(m.annualizedVolatility)], ["Máximo drawdown", formatPercent(m.maxDrawdown)]], 172) + text(32, 274, "Dónde está invertida la cartera", 17, "#182b3a") + donut(weights) + text(32, 535, "Lecturas del análisis", 17, "#182b3a") + paragraph(`Los ${Math.min(3, weights.length)} activos de mayor peso representan ${formatPercent(topThree)} del valor analizado.`, 565, "#182b3a") + paragraph(riskShare === null ? "Sin variación observada: aporte al riesgo no disponible." : `Los ${Math.min(3, riskRows.length)} mayores aportantes reúnen ${formatPercent(riskShare)} de los aportes positivos a la volatilidad. Los aportes negativos se conservan en el detalle.`, 613, "#182b3a") + paragraph(`Drawdown actual: ${formatPercent(m.currentDrawdown)}. La evolución simula esta distribución; no representa una cuenta con operaciones o flujos.`, 678) + paragraph("Money market excluido. Las lecturas describen el histórico, sin asignar un perfil de cliente ni recomendar operaciones.", 750) });
  let positions = text(32, 245, "Activo", 9) + text(280, 245, "Peso", 9, "#637482", "end") + text(370, 245, "Retorno", 9, "#637482", "end") + text(465, 245, "Vol. anual", 9, "#637482", "end") + text(562, 245, "Máx. caída", 9, "#637482", "end");
  const spacing = weights.length > 20 ? 16 : weights.length > 12 ? 22 : 34;
  weights.forEach((r, i) => {
    const y = 267 + i * spacing, asset = bundle.diagnostics?.assets.find(a => a.ticker === r.ticker);
    positions += `<line x1="32" x2="562" y1="${y + 7}" y2="${y + 7}" stroke="#e5eaee"/>` + text(32, y, r.ticker, 9, "#182b3a") + `<rect x="114" y="${y - 7}" width="${90 * r.value}" height="7" rx="2" fill="${CHART_COLORS[i % CHART_COLORS.length]}"/>` + text(280, y, formatPercent(r.value), 9, "#182b3a", "end") + text(370, y, asset ? formatPercent(asset.totalReturn) : "N/D", 9, "#182b3a", "end") + text(465, y, asset ? formatPercent(asset.annualizedVolatility) : "N/D", 9, "#182b3a", "end") + text(562, y, asset ? formatPercent(asset.maxDrawdown) : "N/D", 9, "#182b3a", "end");
  });
  if (weights.length <= 12) positions += paragraph("Retorno y máximo drawdown de cada activo en el período común. La volatilidad individual no es su aporte al riesgo: las correlaciones también influyen.", 267 + weights.length * spacing + 50);
  sections.push({ name: "Composición y concentración", body: text(32, 168, "Distribución y comportamiento por activo", 19, "#182b3a") + paragraph(`${weights.length} activos analizados · Pesos sobre la muestra cubierta. Los tres mayores pesos suman ${formatPercent(topThree)}.`, 193) + positions + text(32, 785, "Detalle completo. Retornos históricos, volatilidad anualizada a 252 ruedas y caídas desde máximos.", 8) });
  sections.push({ name: "Peso, riesgo y diversificación", body: text(32, 164, "Peso versus aporte al riesgo", 19, "#182b3a") + weightRisk(bundle, selected) + correlationGrid(bundle, selected) + paragraph(weights.length > 10 ? "Se muestran los 10 activos de mayor peso; matriz parcial. Todas las posiciones figuran en composición. Correlaciones muestrales, no garantías de diversificación futura." : "Correlaciones muestrales. N/D indica ausencia de variación o datos insuficientes; no se interpreta como correlación cero.", 745) });
  let episodes = text(32, 726, "Principales caídas y recuperación desde el mínimo", 11, "#182b3a");
  const rows = bundle.diagnostics?.drawdowns.episodes ?? [];
  if (!rows.length) episodes += text(32, 750, "Sin episodios de caída observados en esta muestra.", 9);
  else rows.forEach((e, i) => { episodes += text(32, 749 + i * 16, `${e.troughDate} · ${formatPercent(e.maxDrawdown)} · ${e.recoveryDate ? `Recuperó ${e.recoveryDate} (${e.recoveryDays} días calendario)` : "Sin recuperar al cierre de la muestra"}`, 9); });
  sections.push({ name: "Evolución y recuperación", body: history(bundle.charts[2], 158) + history(bundle.charts[3], 430) + episodes });
  const sampleLimited = bundle.observations < 20;
  const dynamic = bundle.dynamicVolatility;
  const money = (v: number) => bundle.portfolioValue == null ? "" : ` (${(v * bundle.portfolioValue).toLocaleString("es-AR", { maximumFractionDigits: 0 })} ${bundle.currency})`;
  sections.push({ name: "Volatilidad y pérdidas de cola", body: dynamic?.length ? history({ id: "drawdown", title: "Volatilidad dinámica EWMA", unit: "% anualizado · lambda 0,94", available: true, points: dynamic }, 158) + metricCards([["VaR histórico diario · 95%", sampleLimited ? "No disponible" : formatPercent(m.historicalVaR)], ["Pérdida media en cola · 95%", sampleLimited ? "No disponible" : formatPercent(m.expectedShortfall)], ["Retornos diarios comunes", `${bundle.observations}`]], 420) + histogram(bundle) + paragraph(sampleLimited ? "Muestra corta: estimaciones de cola no disponibles en el informe." : `VaR${money(m.historicalVaR)} / ES${money(m.expectedShortfall)}. Horizonte diario, confianza 95%. Estimaciones dependientes de la muestra; no predicen la próxima pérdida.`, 750) : paragraph("Volatilidad dinámica no disponible para este análisis.", 175) + histogram(bundle) });
  if (bundle.comparison) {
    const c = bundle.comparison;
    let comparison = text(32, 168, "Actual versus propuesta", 19, "#182b3a") + text(32, 190, "Mismas fechas, moneda, cobertura y rebalanceo diario · No es una proyección", 9);
    comparison += text(32, 226, "Métrica", 9) + text(365, 226, "Actual", 9, "#637482", "end") + text(470, 226, "Propuesta", 9, "#637482", "end") + text(562, 226, "Cambio (pp)", 9, "#637482", "end");
    const metrics = [["Retorno del período", "totalReturn"], ["Volatilidad anual", "annualizedVolatility"], ["Máximo drawdown", "maxDrawdown"], ["VaR diario 95%", "historicalVaR"], ["ES diario 95%", "expectedShortfall"]] as const;
    metrics.forEach(([label,key],i) => { const y=251+i*25, unavailable=bundle.observations<20 && (key==="historicalVaR"||key==="expectedShortfall"); comparison += text(32,y,label,10,"#182b3a") + text(365,y,unavailable?"N/D":formatPercent(m[key]),10,"#182b3a","end") + text(470,y,unavailable?"N/D":formatPercent(c.metrics[key]),10,"#182b3a","end") + text(562,y,unavailable?"N/D":((c.metrics[key]-m[key])*100).toLocaleString("es-AR",{maximumFractionDigits:2}),10,"#182b3a","end"); });
    const actual=bundle.charts[2].points!, proposed=c.evolution;
    const all=[...actual,...proposed].map(p=>p.value), lo=Math.min(...all), hi=Math.max(...all), span=hi-lo||1;
    const begin=Date.parse(actual[0].date), end=Date.parse(actual.at(-1)!.date), days=end-begin||1;
    comparison += text(32,421,"Evolución histórica comparada · base 100",17,"#182b3a");
    for(let i=0;i<4;i++){const y=456+i*65; comparison += `<line x1="70" x2="562" y1="${y}" y2="${y}" stroke="#e0e6ea"/>`+text(62,y+3,(hi-i*span/3).toLocaleString("es-AR",{maximumFractionDigits:1}),8,"#637482","end");}
    [actual,proposed].forEach((points,i)=>{const path=points.map((p,j)=>`${j?"L":"M"}${70+(Date.parse(p.date)-begin)/days*492},${456+(hi-p.value)/span*195}`).join(" ");comparison+=`<path d="${path}" fill="none" stroke="${i?"#5688b5":"#176c62"}" stroke-width="1.7" ${i?'stroke-dasharray="5 3"':''}/>`;});
    comparison+=text(70,676,actual[0].date,8)+text(562,676,actual.at(-1)!.date,8,"#637482","end")+text(32,703,"Verde: actual · Azul discontinuo: propuesta",10)+paragraph("Los cambios se expresan en puntos porcentuales. Un retorno histórico mayor no demuestra superioridad futura. No se optimizan pesos ni se incorpora una expectativa de retorno.",748);
    sections.push({name:"Comparación actual/propuesta",body:comparison});
    let allocation=text(32,168,"Cambios de pesos y riesgo",19,"#182b3a")+text(32,193,"Aportes firmados a la volatilidad; los negativos no se convierten a positivos.",9);
    allocation+=text(32,228,"Activo",9)+text(300,228,"Peso actual / propuesto",9,"#637482","end")+text(562,228,"Riesgo actual / propuesto",9,"#637482","end");
    c.weights.forEach((r,i)=>{const y=253+i*17; allocation+=text(32,y,r.ticker,9,"#182b3a")+text(300,y,`${formatPercent(r.current)} / ${formatPercent(r.proposed)}`,9,"#182b3a","end")+text(562,y,`${bundle.charts[1].available?formatPercent(r.currentRisk):"N/D"} / ${c.riskAvailable?formatPercent(r.proposedRisk):"N/D"}`,9,"#182b3a","end");});
    allocation+=paragraph("La propuesta sólo cambia pesos de activos con histórico disponible; no agrega instrumentos sin datos. Money market continúa excluido. Ambas simulaciones mantienen los pesos diarios, sin costos de rebalanceo ni operaciones reales.",760);
    sections.push({name:"Asignación actual/propuesta",body:allocation});
  }
  const notes = [...(options.comment.trim() ? ["Comentario del asesor", options.comment.trim(), ""] : ["Comentario del asesor", "Sin comentario adicional.", ""]), "Datos y metodología", ...exportNotes(bundle, generatedAt).slice(1), "Correlación de Pearson sobre retornos diarios comunes. Volatilidad EWMA anualizada a 252 ruedas, lambda 0,94. Histogramas de frecuencias, sin asumir normalidad.", "Las recuperaciones corresponden al regreso al máximo previo, con días calendario desde el mínimo. Una caída abierta no tiene fecha de recuperación estimada."];
  const noteLines = notes.flatMap(note => [...wrapReportText(note), ""]);
  for (let i = 0; i < noteLines.length; i += 43) sections.push({ name: i ? "Notas - continuación" : "Comentario y metodología", body: noteLines.slice(i, i + 43).map((s, line) => text(32, 161 + line * 14, s, 10, "#182b3a")).join("") });
  return sections.map((section, i) => {
    const heading = i === 0 ? "Cartera en perspectiva" : section.name;
    const header = `<text x="32" y="33" font-size="18" font-weight="bold" fill="#176c62">FV</text>`
      + text(64, 32, "FINANCE LAB", 9, "#182b3a") + text(562, 32, "INFORME DE CARTERA", 8, "#637482", "end")
      + `<line x1="32" x2="562" y1="46" y2="46" stroke="#d7e0df"/>`
      + text(32, 65, `${String(i + 1).padStart(2, "0")} / ANÁLISIS DE CARTERA`, 7.5, "#176c62")
      + `<text x="32" y="96" font-family="ReportSerif" font-size="24" fill="#182b3a">${escapeXml(heading)}</text>`
      + wrapReportText(title, 110).map((s, j) => text(32, 114 + j * 12, s, 9, "#637482")).join("")
      + text(32, 142, `${bundle.currency} · ${bundle.start} a ${bundle.end} · Cobertura ${formatPercent(bundle.coverage)}`, 8);
    const body = section.body.replace(/font-size="(17|19)"/g, 'font-family="ReportSerif" font-size="18"');
    return { section: section.name, width: 1600, height: Math.round(1600 * HEIGHT / WIDTH), svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="${Math.round(1600 * HEIGHT / WIDTH)}" viewBox="0 0 ${WIDTH} ${HEIGHT}"><rect width="595" height="842" fill="#ffffff"/><g font-family="ReportSans">${header}${body}<line x1="32" x2="562" y1="812" y2="812" stroke="#d7e0df"/>${text(32, 828, "FV Finance Lab · Análisis histórico", 7)}${text(562, 828, `${i + 1} / ${sections.length}`, 8, "#637482", "end")}</g></svg>` };
  });
}
