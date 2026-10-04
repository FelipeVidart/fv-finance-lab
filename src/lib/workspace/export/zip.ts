// ZIP stored entries: PNG is already compressed, so a second compression adds little.
const crcTable = Array.from({ length: 256 }, (_, n) => { let crc = n; for (let i = 0; i < 8; i++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1; return crc >>> 0; });
export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
export function createZip(files: { name: string; data: Uint8Array }[]): Uint8Array<ArrayBuffer> {
  if (!files.length || files.length > 65535 || new Set(files.map(f => f.name)).size !== files.length) throw new Error("Archivos ZIP inválidos");
  const encoder = new TextEncoder();
  const entries = files.map(file => {
    if (!file.name || /[\\/\x00-\x1f]/.test(file.name) || file.name === "..") throw new Error("Nombre ZIP inválido");
    const name = encoder.encode(file.name); if (name.length > 65535) throw new Error("Nombre ZIP demasiado largo");
    return { ...file, name, crc: crc32(file.data) };
  });
  const localSize = entries.reduce((n, f) => n + 30 + f.name.length + f.data.length, 0);
  const centralSize = entries.reduce((n, f) => n + 46 + f.name.length, 0);
  const total = localSize + centralSize + 22;
  if (total >= 0xffffffff) throw new Error("El ZIP supera el tamaño permitido");
  const bytes = new Uint8Array(new ArrayBuffer(total)); const view = new DataView(bytes.buffer);
  let offset = 0, central = localSize;
  for (const file of entries) {
    view.setUint32(offset, 0x04034b50, true); view.setUint16(offset + 4, 20, true); view.setUint16(offset + 6, 0x800, true); view.setUint16(offset + 12, 0x21, true);
    view.setUint32(offset + 14, file.crc, true); view.setUint32(offset + 18, file.data.length, true); view.setUint32(offset + 22, file.data.length, true); view.setUint16(offset + 26, file.name.length, true);
    bytes.set(file.name, offset + 30); bytes.set(file.data, offset + 30 + file.name.length);
    view.setUint32(central, 0x02014b50, true); view.setUint16(central + 4, 20, true); view.setUint16(central + 6, 20, true); view.setUint16(central + 8, 0x800, true); view.setUint16(central + 14, 0x21, true);
    view.setUint32(central + 16, file.crc, true); view.setUint32(central + 20, file.data.length, true); view.setUint32(central + 24, file.data.length, true); view.setUint16(central + 28, file.name.length, true); view.setUint32(central + 42, offset, true);
    bytes.set(file.name, central + 46);
    offset += 30 + file.name.length + file.data.length; central += 46 + file.name.length;
  }
  view.setUint32(central, 0x06054b50, true); view.setUint16(central + 8, files.length, true); view.setUint16(central + 10, files.length, true); view.setUint32(central + 12, centralSize, true); view.setUint32(central + 16, localSize, true);
  return bytes;
}
