// A narrow PDF writer for opaque JPEG pages. Text/graphics are rasterized first
// so browser font support and Unicode are preserved without a font dependency.
export function createImagePdf(pages: { jpeg: Uint8Array; width: number; height: number }[]): Uint8Array<ArrayBuffer> {
  if (!pages.length || pages.some(p => p.jpeg[0] !== 0xff || p.jpeg[1] !== 0xd8 || !Number.isSafeInteger(p.width) || !Number.isSafeInteger(p.height) || p.width <= 0 || p.height <= 0)) throw new Error("Páginas PDF inválidas.");
  const encoder = new TextEncoder(), chunks: Uint8Array[] = [], offsets = [0]; let length = 0;
  const append = (value: string | Uint8Array) => { const bytes = typeof value === "string" ? encoder.encode(value) : value; chunks.push(bytes); length += bytes.length; };
  const object = (id: number, value: string) => { offsets[id] = length; append(`${id} 0 obj\n${value}\nendobj\n`); };
  append("%PDF-1.4\n");
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(" ")}] >>`);
  pages.forEach((page, i) => {
    const id = 3 + i * 3;
    object(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Image ${id + 1} 0 R >> >> /Contents ${id + 2} 0 R >>`);
    offsets[id + 1] = length;
    append(`${id + 1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`);
    append(page.jpeg); append("\nendstream\nendobj\n");
    const stream = "q\n595 0 0 842 0 0 cm\n/Image Do\nQ\n";
    object(id + 2, `<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}endstream`);
  });
  const xref = length, count = 3 + pages.length * 3;
  append(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let i = 1; i < count; i++) append(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  append(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const output = new Uint8Array(new ArrayBuffer(length)); let index = 0;
  for (const chunk of chunks) { output.set(chunk, index); index += chunk.length; }
  return output;
}
