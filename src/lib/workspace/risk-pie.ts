export type PieRow = { ticker: string; value: number };
export function riskPieRows(rows: PieRow[]) {
  if (rows.some(r => !Number.isFinite(r.value))) throw new Error("Aportes al riesgo inválidos.");
  const positiveTotal = rows.reduce((s, r) => s + Math.max(0, r.value), 0);
  const negative = rows.filter(r => r.value < 0);
  return { rows: rows.map(r => ({ ...r, value: positiveTotal ? Math.max(0, r.value) / positiveTotal : 0 })), negative, available: positiveTotal > 0, partial: negative.length > 0 };
}
export function assetPieColor(index: number) {
  return ["#248c7c", "#5688b5", "#ba8a40", "#a779aa", "#6b98a0", "#b96961", "#63884b", "#8868a2", "#be7946", "#536e95", "#a38c65", "#788494"][index % 12];
}
export function pieSlices(rows: PieRow[], cx: number, cy: number, radius: number) {
  let angle = -Math.PI / 2;
  return rows.map((r, index) => {
    const start = angle; angle += r.value * Math.PI * 2;
    const x = (a: number) => cx + Math.cos(a) * radius, y = (a: number) => cy + Math.sin(a) * radius;
    return { ...r, index, full: r.value >= 1 - 1e-10, path: `M${cx},${cy} L${x(start)},${y(start)} A${radius},${radius} 0 ${r.value > .5 ? 1 : 0},1 ${x(angle)},${y(angle)} Z` };
  });
}
