export function chartSeries(points: { date: string; value: number }[], includeZero = false) {
  if (!points.length || points.some(p => !Number.isFinite(p.value) || !Number.isFinite(Date.parse(p.date)))) throw new Error("Serie inválida");
  const values = points.map(p => p.value);
  const low = Math.min(...values, ...(includeZero ? [0] : []));
  const high = Math.max(...values, ...(includeZero ? [0] : []));
  const padding = Math.max((high - low) * .12, .001);
  const min = low - padding, max = high + padding;
  const start = Date.parse(points[0].date), end = Date.parse(points.at(-1)!.date);
  const coordinates = points.map(p => ({ x: 60 + (end === start ? 0 : (Date.parse(p.date) - start) / (end - start)) * 520, y: 24 + (max - p.value) / (max - min) * 190 }));
  return { min, max, coordinates, path: coordinates.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") };
}
