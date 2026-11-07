import { describe, it, expect } from 'vitest';
import { crc32, createUncompressedZip, ZipEntry } from '@plugins/exporters/zipBuilder';

describe('zipBuilder', () => {
  describe('crc32', () => {
    it('should compute standard CRC-32 checksums', () => {
      const encoder = new TextEncoder();
      expect(crc32(encoder.encode('hello'))).toBe(907060870);
      expect(crc32(encoder.encode('123456789'))).toBe(0xcbf43926);
      expect(crc32(new Uint8Array([]))).toBe(0);
    });
  });

  describe('createUncompressedZip', () => {
    it('should build a valid uncompressed zip archive with local and central directory headers', () => {
      const entries: ZipEntry[] = [
        { name: 'mimetype', data: 'application/vnd.oasis.opendocument.spreadsheet' },
        { name: 'content.xml', data: '<test>Hello</test>' },
      ];

      const zipBytes = createUncompressedZip(entries);

      // Verify ZIP local file header signature 0x04034b50 (PK\x03\x04)
      expect(zipBytes[0]).toBe(0x50);
      expect(zipBytes[1]).toBe(0x4b);
      expect(zipBytes[2]).toBe(0x03);
      expect(zipBytes[3]).toBe(0x04);

      // Verify archive contains both filenames
      const textDecoder = new TextDecoder();
      const rawText = textDecoder.decode(zipBytes);
      expect(rawText).toContain('mimetype');
      expect(rawText).toContain('content.xml');
      expect(rawText).toContain('<test>Hello</test>');
    });

    it('should handle Uint8Array binary data entries correctly', () => {
      const binaryData = new Uint8Array([1, 2, 3, 4, 5, 6]);
      const entries: ZipEntry[] = [{ name: 'binary.bin', data: binaryData }];

      const zipBytes = createUncompressedZip(entries);
      expect(zipBytes.length).toBeGreaterThan(binaryData.length + 30 + 46 + 22);

      const dv = new DataView(zipBytes.buffer);
      // EOCD signature is at zipBytes.length - 22: 0x06054b50
      const eocdOffset = zipBytes.length - 22;
      expect(dv.getUint32(eocdOffset, true)).toBe(0x06054b50);
      expect(dv.getUint16(eocdOffset + 8, true)).toBe(1); // 1 entry
    });
  });
});
