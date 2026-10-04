import { exportNotes, exportStem, type ChartBundle, type ExportChart } from "./chart-bundle";
import { renderChartSvg } from "./chart-svg";
import { createZip } from "./zip";

export async function chartPng(bundle: ChartBundle, chart: ExportChart, generatedAt: string): Promise<Blob> {
  return svgImageBlob(renderChartSvg(bundle, chart, generatedAt));
}
export async function svgImageBlob({ svg, width, height }: { svg: string; width: number; height: number }, type: "image/png" | "image/jpeg" = "image/png"): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("No se pudo generar el gráfico.")); image.src = url; });
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d"); if (!context) throw new Error("Este navegador no permite generar imágenes.");
    context.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("No se pudo generar el PNG.")), type, .94));
  } finally { URL.revokeObjectURL(url); }
}
export async function prepareChartDownload(bundle: ChartBundle, id: ExportChart["id"] | "all") {
  const generatedAt = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }) + " (Argentina)";
  const stem = exportStem(bundle);
  if (id !== "all") {
    const chart = bundle.charts.find(c => c.id === id); if (!chart) throw new Error("Gráfico desconocido.");
    return { blob: await chartPng(bundle, chart, generatedAt), name: `${stem}-${id}.png` };
  }
  const files = [];
  // Sequential rendering bounds memory when a portfolio has many assets or long sources.
  for (const chart of bundle.charts) files.push({ name: `${stem}-${chart.id}.png`, data: new Uint8Array(await (await chartPng(bundle, chart, generatedAt)).arrayBuffer()) });
  files.push({ name: "datos-y-metodologia.txt", data: new TextEncoder().encode([bundle.name, `${bundle.currency} · ${bundle.start} a ${bundle.end}`, ...exportNotes(bundle, generatedAt)].join("\n")) });
  return { blob: new Blob([createZip(files)], { type: "application/zip" }), name: `${stem}-graficos.zip` };
}
export function saveDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  // The caller keeps this URL for an explicit retry link and revokes it on replacement/unmount.
  return url;
}
