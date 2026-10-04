import { exportStem, type ChartBundle } from "./chart-bundle";
import { svgImageBlob } from "./download-charts";
import { createImagePdf } from "./image-pdf";
import { renderReportPages, type ReportOptions } from "./report-pages";
export async function prepareReportDownload(bundle: ChartBundle, options: ReportOptions) {
  const generatedAt = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }) + " (Argentina)";
  const pages = [];
  for (const page of renderReportPages(bundle, options, generatedAt)) pages.push({ jpeg: new Uint8Array(await (await svgImageBlob(page, "image/jpeg")).arrayBuffer()), width: page.width, height: page.height });
  return { blob: new Blob([createImagePdf(pages)], { type: "application/pdf" }), name: `${exportStem({ ...bundle, name: options.title.trim() || bundle.name })}-informe.pdf` };
}
