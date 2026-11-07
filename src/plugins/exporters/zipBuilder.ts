/**
 * Lightweight, dependency-free ZIP file generator for browser environments.
 * Creates standard, uncompressed (STORE mode) ZIP archives suitable for
 * OpenDocument (.ods) and Office Open XML (.xlsx) container packaging.
 */

export interface ZipEntry {
  name: string;
  data: string | Uint8Array;
}

/**
 * Computes the standard IEEE 802.3 CRC-32 checksum for a byte array.
 */
export function crc32(buffer: Uint8Array): number {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) {
    let c = (crc ^ buffer[i]) & 0xff;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ -1) >>> 0;
}

/**
 * Packs the given entries into a standard uncompressed ZIP archive.
 */
export function createUncompressedZip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const fileParts: Uint8Array[] = [];
  const centralDirectoryHeaders: Uint8Array[] = [];
  let currentOffset = 0;

  for (const entry of entries) {
    const filenameBytes = encoder.encode(entry.name);
    const dataBytes =
      typeof entry.data === 'string'
        ? encoder.encode(entry.data)
        : entry.data;

    const checksum = crc32(dataBytes);
    const size = dataBytes.length;

    // Local file header (30 bytes + filename)
    const localHeader = new Uint8Array(30 + filenameBytes.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true); // signature
    view.setUint16(4, 20, true);         // version needed (2.0)
    view.setUint16(6, 0x0800, true);     // flags: UTF-8 filename
    view.setUint16(8, 0, true);          // compression method: 0 (stored)
    view.setUint16(10, 0, true);         // mod time
    view.setUint16(12, 0, true);         // mod date
    view.setUint32(14, checksum, true);  // crc-32
    view.setUint32(18, size, true);      // compressed size
    view.setUint32(22, size, true);      // uncompressed size
    view.setUint16(26, filenameBytes.length, true);
    view.setUint16(28, 0, true);         // extra field length
    localHeader.set(filenameBytes, 30);

    fileParts.push(localHeader, dataBytes);

    // Central directory header (46 bytes + filename)
    const cdHeader = new Uint8Array(46 + filenameBytes.length);
    const cdView = new DataView(cdHeader.buffer);
    cdView.setUint32(0, 0x02014b50, true); // central header signature
    cdView.setUint16(4, 20, true);         // version made by
    cdView.setUint16(6, 20, true);         // version needed
    cdView.setUint16(8, 0x0800, true);     // flags (UTF-8)
    cdView.setUint16(10, 0, true);         // compression method: stored
    cdView.setUint16(12, 0, true);         // mod time
    cdView.setUint16(14, 0, true);         // mod date
    cdView.setUint32(16, checksum, true);  // crc-32
    cdView.setUint32(20, size, true);      // compressed size
    cdView.setUint32(24, size, true);      // uncompressed size
    cdView.setUint16(28, filenameBytes.length, true);
    cdView.setUint16(30, 0, true);         // extra field length
    cdView.setUint16(32, 0, true);         // comment length
    cdView.setUint16(34, 0, true);         // disk number start
    cdView.setUint16(36, 0, true);         // internal file attributes
    cdView.setUint32(38, 0, true);         // external file attributes
    cdView.setUint32(42, currentOffset, true); // relative offset of local header
    cdHeader.set(filenameBytes, 46);

    centralDirectoryHeaders.push(cdHeader);
    currentOffset += localHeader.length + size;
  }

  const centralDirectoryOffset = currentOffset;
  let centralDirectorySize = 0;
  for (const cd of centralDirectoryHeaders) {
    fileParts.push(cd);
    centralDirectorySize += cd.length;
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
  eocdView.setUint16(4, 0, true);          // disk number
  eocdView.setUint16(6, 0, true);          // disk with CD
  eocdView.setUint16(8, entries.length, true);  // entries on this disk
  eocdView.setUint16(10, entries.length, true); // total entries
  eocdView.setUint32(12, centralDirectorySize, true);
  eocdView.setUint32(16, centralDirectoryOffset, true);
  eocdView.setUint16(20, 0, true);         // comment length
  fileParts.push(eocd);

  const totalLength = fileParts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of fileParts) {
    result.set(part, pos);
    pos += part.length;
  }

  return result;
}
