import { describe, it, expect } from 'vitest';
import {
  crc32,
  dateToDosDateTime,
  createUncompressedZip,
  ZipEntry,
  MIN_DOS_DATE,
  MIN_DOS_TIME,
  MAX_ZIP_ENTRIES,
  MAX_FILENAME_BYTES,
  MAX_ZIP32_SIZE,
} from '@plugins/exporters/zipBuilder';

/**
 * Helper to inspect and parse a generated uncompressed ZIP archive according to PKWARE spec.
 */
function parseZipArchive(zipBytes: Uint8Array) {
  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
  const textDecoder = new TextDecoder();

  // 1. Locate and parse EOCD (last 22 bytes minimum)
  expect(zipBytes.byteLength).toBeGreaterThanOrEqual(22);
  const eocdOffset = zipBytes.byteLength - 22;
  const eocdSignature = view.getUint32(eocdOffset, true);
  expect(eocdSignature).toBe(0x06054b50); // PK\x05\x06

  const diskNumber = view.getUint16(eocdOffset + 4, true);
  const cdDisk = view.getUint16(eocdOffset + 6, true);
  const entriesOnDisk = view.getUint16(eocdOffset + 8, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const cdSize = view.getUint32(eocdOffset + 12, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);
  const commentLength = view.getUint16(eocdOffset + 20, true);

  expect(diskNumber).toBe(0);
  expect(cdDisk).toBe(0);
  expect(entriesOnDisk).toBe(totalEntries);
  expect(commentLength).toBe(0);

  // 2. Parse Central Directory headers
  let cdCursor = cdOffset;
  const centralEntries: Array<{
    name: string;
    crc32: number;
    compressedSize: number;
    uncompressedSize: number;
    localHeaderOffset: number;
    dosTime: number;
    dosDate: number;
    flags: number;
  }> = [];

  for (let i = 0; i < totalEntries; i++) {
    expect(view.getUint32(cdCursor, true)).toBe(0x02014b50); // PK\x01\x02
    const versionMadeBy = view.getUint16(cdCursor + 4, true);
    const versionNeeded = view.getUint16(cdCursor + 6, true);
    const flags = view.getUint16(cdCursor + 8, true);
    const method = view.getUint16(cdCursor + 10, true);
    const dosTime = view.getUint16(cdCursor + 12, true);
    const dosDate = view.getUint16(cdCursor + 14, true);
    const crc = view.getUint32(cdCursor + 16, true);
    const cSize = view.getUint32(cdCursor + 20, true);
    const uSize = view.getUint32(cdCursor + 24, true);
    const fnameLen = view.getUint16(cdCursor + 28, true);
    const extraLen = view.getUint16(cdCursor + 30, true);
    const commentLen = view.getUint16(cdCursor + 32, true);
    const localHeaderOffset = view.getUint32(cdCursor + 42, true);

    expect(versionMadeBy).toBe(20);
    expect(versionNeeded).toBe(20);
    expect(method).toBe(0); // stored
    expect(flags & 0x0800).toBe(0x0800); // UTF-8 (EFS) bit set
    expect(extraLen).toBe(0);
    expect(commentLen).toBe(0);

    const fnameBytes = zipBytes.subarray(cdCursor + 46, cdCursor + 46 + fnameLen);
    const fname = textDecoder.decode(fnameBytes);

    centralEntries.push({
      name: fname,
      crc32: crc,
      compressedSize: cSize,
      uncompressedSize: uSize,
      localHeaderOffset,
      dosTime,
      dosDate,
      flags,
    });

    cdCursor += 46 + fnameLen + extraLen + commentLen;
  }

  expect(cdCursor - cdOffset).toBe(cdSize);

  // 3. Parse and verify Local File headers and payloads
  const localEntries: Array<{
    name: string;
    data: Uint8Array;
    crc32: number;
    dosTime: number;
    dosDate: number;
  }> = [];

  for (const cdEntry of centralEntries) {
    const locOffset = cdEntry.localHeaderOffset;
    expect(view.getUint32(locOffset, true)).toBe(0x04034b50); // PK\x03\x04
    const versionNeeded = view.getUint16(locOffset + 4, true);
    const flags = view.getUint16(locOffset + 6, true);
    const method = view.getUint16(locOffset + 8, true);
    const dosTime = view.getUint16(locOffset + 10, true);
    const dosDate = view.getUint16(locOffset + 12, true);
    const crc = view.getUint32(locOffset + 14, true);
    const cSize = view.getUint32(locOffset + 18, true);
    const uSize = view.getUint32(locOffset + 22, true);
    const fnameLen = view.getUint16(locOffset + 26, true);
    const extraLen = view.getUint16(locOffset + 28, true);

    expect(versionNeeded).toBe(20);
    expect(flags & 0x0800).toBe(0x0800);
    expect(method).toBe(0);
    expect(dosTime).toBe(cdEntry.dosTime);
    expect(dosDate).toBe(cdEntry.dosDate);
    expect(crc).toBe(cdEntry.crc32);
    expect(cSize).toBe(cdEntry.compressedSize);
    expect(uSize).toBe(cdEntry.uncompressedSize);
    expect(extraLen).toBe(0);

    const fnameBytes = zipBytes.subarray(locOffset + 30, locOffset + 30 + fnameLen);
    const fname = textDecoder.decode(fnameBytes);
    expect(fname).toBe(cdEntry.name);

    const dataStart = locOffset + 30 + fnameLen + extraLen;
    const dataBytes = zipBytes.subarray(dataStart, dataStart + uSize);
    expect(crc32(dataBytes)).toBe(crc);

    localEntries.push({
      name: fname,
      data: dataBytes,
      crc32: crc,
      dosTime,
      dosDate,
    });
  }

  return {
    totalEntries,
    cdSize,
    cdOffset,
    centralEntries,
    localEntries,
  };
}

describe('zipBuilder', () => {
  describe('crc32', () => {
    it('should compute standard CRC-32 checksums', () => {
      const encoder = new TextEncoder();
      expect(crc32(encoder.encode('hello'))).toBe(907060870);
      expect(crc32(encoder.encode('123456789'))).toBe(0xcbf43926);
      expect(crc32(new Uint8Array([]))).toBe(0);
    });
  });

  describe('dateToDosDateTime', () => {
    it('should fallback to MIN_DOS_DATE (0x0021) and MIN_DOS_TIME (0x0000) when date is undefined or invalid', () => {
      expect(dateToDosDateTime(undefined)).toEqual({
        dosTime: MIN_DOS_TIME,
        dosDate: MIN_DOS_DATE,
      });

      expect(dateToDosDateTime(new Date(NaN))).toEqual({
        dosTime: MIN_DOS_TIME,
        dosDate: MIN_DOS_DATE,
      });
    });

    it('should fallback to MIN_DOS_DATE and MIN_DOS_TIME for dates before 1980-01-01', () => {
      const epoch = new Date('1970-01-01T00:00:00Z');
      expect(dateToDosDateTime(epoch)).toEqual({
        dosTime: MIN_DOS_TIME,
        dosDate: MIN_DOS_DATE,
      });

      const dayBeforeDos = new Date('1979-12-31T23:59:59');
      expect(dateToDosDateTime(dayBeforeDos)).toEqual({
        dosTime: MIN_DOS_TIME,
        dosDate: MIN_DOS_DATE,
      });
    });

    it('should accurately encode minimal valid DOS date 1980-01-01 00:00:00', () => {
      const minDate = new Date(1980, 0, 1, 0, 0, 0); // Jan 1, 1980 00:00:00
      const res = dateToDosDateTime(minDate);
      expect(res.dosDate).toBe(0x0021);
      expect(res.dosTime).toBe(0x0000);
      expect(res.dosDate).toBeGreaterThanOrEqual(MIN_DOS_DATE);
    });

    it('should correctly convert modern Date values to 16-bit MS-DOS format', () => {
      // 2026-11-07 16:30:20
      const testDate = new Date(2026, 10, 7, 16, 30, 20);
      const res = dateToDosDateTime(testDate);

      // Year offset: 2026 - 1980 = 46 (46 << 9 = 23552)
      // Month: 11 (11 << 5 = 352)
      // Day: 7
      // dosDate = 23552 | 352 | 7 = 23911 = 0x5D67
      expect(res.dosDate).toBe(23911);
      expect(res.dosDate).toBeGreaterThanOrEqual(MIN_DOS_DATE);

      // Hour: 16 (16 << 11 = 32768)
      // Minute: 30 (30 << 5 = 960)
      // Second / 2: 20 / 2 = 10
      // dosTime = 32768 | 960 | 10 = 33738 = 0x83CA
      expect(res.dosTime).toBe(33738);
    });

    it('should clamp distant future dates beyond year 2107 without 16-bit overflow', () => {
      const futureDate = new Date(2150, 5, 15, 12, 0, 0);
      const res = dateToDosDateTime(futureDate);
      expect(res.dosDate).toBeLessThanOrEqual(0xffff);
      expect(res.dosDate).toBeGreaterThanOrEqual(MIN_DOS_DATE);
      expect(res.dosTime).toBeLessThanOrEqual(0xffff);
    });
  });

  describe('createUncompressedZip', () => {
    it('should generate empty archive with valid 22-byte EOCD when entries list is empty', () => {
      const zipBytes = createUncompressedZip([]);
      expect(zipBytes.byteLength).toBe(22);

      const parsed = parseZipArchive(zipBytes);
      expect(parsed.totalEntries).toBe(0);
      expect(parsed.cdSize).toBe(0);
      expect(parsed.cdOffset).toBe(0);
      expect(parsed.centralEntries).toHaveLength(0);
      expect(parsed.localEntries).toHaveLength(0);
    });

    it('should store DOS date >= 0x0021 in local and central headers by default', () => {
      const entries: ZipEntry[] = [
        { name: 'test.txt', data: 'Sample content' },
      ];

      const zipBytes = createUncompressedZip(entries);
      const parsed = parseZipArchive(zipBytes);

      expect(parsed.centralEntries[0].dosDate).toBe(MIN_DOS_DATE);
      expect(parsed.centralEntries[0].dosTime).toBe(MIN_DOS_TIME);
      expect(parsed.localEntries[0].dosDate).toBe(MIN_DOS_DATE);
      expect(parsed.localEntries[0].dosTime).toBe(MIN_DOS_TIME);
      expect(parsed.centralEntries[0].dosDate).toBeGreaterThanOrEqual(0x0021);
      expect(parsed.localEntries[0].dosDate).toBeGreaterThanOrEqual(0x0021);
    });

    it('should support custom per-entry dates and default options date', () => {
      const defaultDate = new Date(2025, 5, 1, 10, 0, 0);
      const customDate = new Date(2026, 7, 15, 14, 20, 10);
      const pre1980Date = new Date(1975, 0, 1);

      const entries: ZipEntry[] = [
        { name: 'default.txt', data: 'Default date' },
        { name: 'custom.txt', data: 'Custom date', date: customDate },
        { name: 'old.txt', data: 'Old date', date: pre1980Date },
      ];

      const zipBytes = createUncompressedZip(entries, { defaultDate });
      const parsed = parseZipArchive(zipBytes);

      const expectedDefault = dateToDosDateTime(defaultDate);
      const expectedCustom = dateToDosDateTime(customDate);

      // Entry 0 should use defaultDate
      expect(parsed.centralEntries[0].dosDate).toBe(expectedDefault.dosDate);
      expect(parsed.centralEntries[0].dosTime).toBe(expectedDefault.dosTime);

      // Entry 1 should use customDate
      expect(parsed.centralEntries[1].dosDate).toBe(expectedCustom.dosDate);
      expect(parsed.centralEntries[1].dosTime).toBe(expectedCustom.dosTime);

      // Entry 2 should fallback to MIN_DOS_DATE
      expect(parsed.centralEntries[2].dosDate).toBe(MIN_DOS_DATE);
      expect(parsed.centralEntries[2].dosTime).toBe(MIN_DOS_TIME);

      // All dates must be >= 0x0021
      for (const entry of parsed.centralEntries) {
        expect(entry.dosDate).toBeGreaterThanOrEqual(0x0021);
      }
    });

    it('should build and roundtrip archives with multiple files, binary data, and UTF-8 filenames', () => {
      const binaryData = new Uint8Array([0x00, 0xff, 0x42, 0x13, 0x37]);
      const entries: ZipEntry[] = [
        { name: 'mimetype', data: 'application/vnd.oasis.opendocument.spreadsheet' },
        { name: 'zażółć gęślą jaźń.txt', data: 'Polish characters: ąćęłńóśźż' },
        { name: '📊_reports/データ_2026.csv', data: 'id,val\n1,100\n2,200\n' },
        { name: 'nested/deep/binary.dat', data: binaryData },
      ];

      const zipBytes = createUncompressedZip(entries);
      const parsed = parseZipArchive(zipBytes);

      expect(parsed.totalEntries).toBe(4);
      expect(parsed.localEntries).toHaveLength(4);

      const textDecoder = new TextDecoder();
      expect(parsed.localEntries[0].name).toBe('mimetype');
      expect(textDecoder.decode(parsed.localEntries[0].data)).toBe(
        'application/vnd.oasis.opendocument.spreadsheet'
      );

      expect(parsed.localEntries[1].name).toBe('zażółć gęślą jaźń.txt');
      expect(textDecoder.decode(parsed.localEntries[1].data)).toBe('Polish characters: ąćęłńóśźż');

      expect(parsed.localEntries[2].name).toBe('📊_reports/データ_2026.csv');
      expect(textDecoder.decode(parsed.localEntries[2].data)).toBe('id,val\n1,100\n2,200\n');

      expect(parsed.localEntries[3].name).toBe('nested/deep/binary.dat');
      expect(parsed.localEntries[3].data).toEqual(binaryData);
    });

    describe('ZIP 32-bit format limit validations', () => {
      it('should throw explicit error when entry count exceeds 65535', () => {
        // Create an array exceeding MAX_ZIP_ENTRIES
        const dummyEntries: ZipEntry[] = new Array(MAX_ZIP_ENTRIES + 1).fill({
          name: 'f.txt',
          data: '',
        });

        expect(() => createUncompressedZip(dummyEntries)).toThrow(
          /maximum number of entries is 65535.*ZIP64 format is not supported/i
        );
      });

      it('should throw explicit error when filename length exceeds 65535 bytes', () => {
        const longName = 'x'.repeat(MAX_FILENAME_BYTES + 1);
        const entries: ZipEntry[] = [{ name: longName, data: 'content' }];

        expect(() => createUncompressedZip(entries)).toThrow(
          /exceeds maximum allowed length of 65535 bytes/i
        );
      });

      it('should throw explicit error when entry size exceeds 4GB limit', () => {
        const entries: ZipEntry[] = [
          {
            name: 'large.dat',
            // Mock a data object with length exceeding MAX_ZIP32_SIZE without allocating physical memory
            data: { length: MAX_ZIP32_SIZE + 1 } as unknown as Uint8Array,
          },
        ];

        expect(() => createUncompressedZip(entries)).toThrow(
          /size .* exceeds 4GB limit.*ZIP64 format is not supported/i
        );
      });
    });
  });
});
