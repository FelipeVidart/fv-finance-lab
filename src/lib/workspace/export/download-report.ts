import { exportStem, type ChartBundle } from "./chart-bundle";
import { renderReportPages, type ReportOptions } from "./report-pages";
import { jsPDF } from "jspdf";
import "svg2pdf.js";

const reportFonts = [
  { file: "report-sans.ttf", family: "ReportSans", style: "normal" },
  { file: "report-sans-bold.ttf", family: "ReportSans", style: "bold" },
  { file: "report-serif.ttf", family: "ReportSerif", style: "normal" },
] as const;
function base64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(binary);
}
export async function prepareReportDownload(bundle: ChartBundle, options: ReportOptions) {
  const generatedAt = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }) + " (Argentina)";
  const pages = renderReportPages(bundle, options, generatedAt);
  const pdf = new jsPDF({ unit: "pt", format: [595, 842], compress: true, putOnlyUsedFonts: true });
  const loaded: FontFace[] = [];
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;pointer-events:none;";
  host.setAttribute("aria-hidden", "true");
  try {
    for (const font of reportFonts) {
      const response = await fetch(`/fonts/${font.file}`);
      if (!response.ok) throw new Error("No se pudo cargar la tipografía del informe. Volvé a intentar.");
      const bytes = await response.arrayBuffer();
      pdf.addFileToVFS(font.file, base64(bytes));
      pdf.addFont(font.file, font.family, font.style);
      const face = await new FontFace(font.family, bytes, { weight: font.style === "bold" ? "700" : "400" }).load();
      document.fonts.add(face); loaded.push(face);
    }
    document.body.append(host);
    for (const [index, page] of pages.entries()) {
      const svg = new DOMParser().parseFromString(page.svg, "image/svg+xml").documentElement;
      if (svg.localName !== "svg" || svg.querySelector("parsererror")) throw new Error("No se pudo preparar una página del informe.");
      host.replaceChildren(document.importNode(svg, true));
      if (index) pdf.addPage([595, 842]);
      await pdf.svg(host.firstElementChild as SVGSVGElement, { x: 0, y: 0, width: 595, height: 842 });
    }
    pdf.setProperties({ title: options.title.trim() || bundle.name, subject: "Análisis histórico de cartera", creator: "FV Finance Lab" });
    return { blob: pdf.output("blob"), name: `${exportStem({ ...bundle, name: options.title.trim() || bundle.name })}-informe.pdf` };
  } finally {
    host.remove();
    for (const face of loaded) document.fonts.delete(face);
  }
}
