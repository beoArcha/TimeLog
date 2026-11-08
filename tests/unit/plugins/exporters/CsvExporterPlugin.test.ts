import { describe, it, expect } from 'vitest';
import {
  CsvExporterPlugin,
  escapeCsvValue,
  sanitizeCsvFormula,
  isNumericString,
  isWhitespaceOrControl,
  isUnicodeWhitespace,
  isUnicodeControl,
} from '@plugins/exporters/CsvExporterPlugin';
import { ExportPayload } from '@plugins/contracts/IExporterPlugin';
import parityCases from '@tests/shared/fixtures/csv-formula-parity-cases.json';

describe('CsvExporterPlugin & CSV Formula Injection Protection', () => {
  describe('shared parity fixture matrix (tests/shared/fixtures/csv-formula-parity-cases.json)', () => {
    it.each(parityCases)(
      'should satisfy parity vector $id: $description',
      ({ input, expected, isNumeric }) => {
        // Arrange
        const rawInput = input;

        // Act
        const sanitized = sanitizeCsvFormula(rawInput);
        const numeric = isNumericString(rawInput);

        // Assert
        expect(sanitized).toBe(expected);
        expect(numeric).toBe(isNumeric);
      }
    );
  });

  describe('isUnicodeWhitespace & isUnicodeControl & isWhitespaceOrControl', () => {
    it('should classify ASCII and Unicode whitespace matching Rust is_whitespace', () => {
      // Arrange & Act & Assert
      expect(isUnicodeWhitespace(0x0020)).toBe(true); // Space
      expect(isUnicodeWhitespace(0x0009)).toBe(true); // Tab
      expect(isUnicodeWhitespace(0x000a)).toBe(true); // LF
      expect(isUnicodeWhitespace(0x000b)).toBe(true); // VT
      expect(isUnicodeWhitespace(0x000c)).toBe(true); // FF
      expect(isUnicodeWhitespace(0x000d)).toBe(true); // CR
      expect(isUnicodeWhitespace(0x0085)).toBe(true); // NEL
      expect(isUnicodeWhitespace(0x00a0)).toBe(true); // NBSP
      expect(isUnicodeWhitespace(0x1680)).toBe(true); // Ogham Space Mark
      expect(isUnicodeWhitespace(0x2000)).toBe(true); // En Quad
      expect(isUnicodeWhitespace(0x200a)).toBe(true); // Hair Space
      expect(isUnicodeWhitespace(0x2028)).toBe(true); // Line Separator
      expect(isUnicodeWhitespace(0x2029)).toBe(true); // Paragraph Separator
      expect(isUnicodeWhitespace(0x202f)).toBe(true); // Narrow NBSP
      expect(isUnicodeWhitespace(0x205f)).toBe(true); // Medium Math Space
      expect(isUnicodeWhitespace(0x3000)).toBe(true); // Ideographic Space
    });

    it('should classify C0 and C1 control characters matching Rust is_control', () => {
      // Arrange & Act & Assert
      expect(isUnicodeControl(0x0000)).toBe(true); // NUL
      expect(isUnicodeControl(0x001f)).toBe(true); // Unit Separator
      expect(isUnicodeControl(0x007f)).toBe(true); // DEL
      expect(isUnicodeControl(0x0080)).toBe(true); // C1
      expect(isUnicodeControl(0x009f)).toBe(true); // C1 APC
    });

    it('should exclude format characters (Cf) such as U+FEFF and U+200B from whitespace', () => {
      // Arrange & Act & Assert
      expect(isWhitespaceOrControl(0xfeff)).toBe(false); // BOM
      expect(isWhitespaceOrControl(0x200b)).toBe(false); // Zero-width space
      expect(isWhitespaceOrControl(0x200c)).toBe(false); // ZWNJ
      expect(isWhitespaceOrControl(0x200d)).toBe(false); // ZWJ
      expect(isWhitespaceOrControl(0x2060)).toBe(false); // Word joiner
    });
  });

  describe('isNumericString', () => {
    it('should identify valid positive and negative numbers including scientific notation', () => {
      // Arrange & Act & Assert
      expect(isNumericString('123')).toBe(true);
      expect(isNumericString('+123')).toBe(true);
      expect(isNumericString('-123')).toBe(true);
      expect(isNumericString('-123.45')).toBe(true);
      expect(isNumericString('+42.0')).toBe(true);
      expect(isNumericString('0')).toBe(true);
      expect(isNumericString('-0')).toBe(true);
      expect(isNumericString('.5')).toBe(true);
      expect(isNumericString('-.5')).toBe(true);
      expect(isNumericString('1e5')).toBe(true);
      expect(isNumericString('-1e-3')).toBe(true);
    });

    it('should recognize valid numbers wrapped in Unicode whitespace', () => {
      // Arrange & Act & Assert
      expect(isNumericString('\u00A0-123.45')).toBe(true);
      expect(isNumericString('\u3000+42')).toBe(true);
      expect(isNumericString('\u0085-50')).toBe(true);
      expect(isNumericString('   -5   ')).toBe(true);
    });

    it('should reject non-numeric strings, formulas, and format characters', () => {
      // Arrange & Act & Assert
      expect(isNumericString('')).toBe(false);
      expect(isNumericString('   ')).toBe(false);
      expect(isNumericString('=1+1')).toBe(false);
      expect(isNumericString('@SUM(A1:A2)')).toBe(false);
      expect(isNumericString('+cmd|calc')).toBe(false);
      expect(isNumericString('-calc')).toBe(false);
      expect(isNumericString('-1+1')).toBe(false);
      expect(isNumericString('-')).toBe(false);
      expect(isNumericString('+')).toBe(false);
      expect(isNumericString('Project 1')).toBe(false);
      expect(isNumericString('\uFEFF-123')).toBe(false);
    });
  });

  describe('sanitizeCsvFormula', () => {
    it('should neutralize formula triggers preceded by Unicode whitespace', () => {
      // Arrange & Act & Assert
      expect(sanitizeCsvFormula('\u00A0=1+1')).toBe("'\u00A0=1+1");
      expect(sanitizeCsvFormula('\u1680+cmd')).toBe("'\u1680+cmd");
      expect(sanitizeCsvFormula('\u2000-calc')).toBe("'\u2000-calc");
      expect(sanitizeCsvFormula('\u3000@SUM(A1)')).toBe("'\u3000@SUM(A1)");
      expect(sanitizeCsvFormula('\u00A0\u3000\t =1+1')).toBe("'\u00A0\u3000\t =1+1");
    });

    it('should preserve strings starting with format characters without formula trigger prefixing', () => {
      // Arrange & Act & Assert
      expect(sanitizeCsvFormula('\uFEFF=1+1')).toBe('\uFEFF=1+1');
      expect(sanitizeCsvFormula('\u200B=1+1')).toBe('\u200B=1+1');
    });

    it('should preserve valid numeric values including negatives without prefix', () => {
      // Arrange & Act & Assert
      expect(sanitizeCsvFormula('123')).toBe('123');
      expect(sanitizeCsvFormula('+123')).toBe('+123');
      expect(sanitizeCsvFormula('-123')).toBe('-123');
      expect(sanitizeCsvFormula('-123.45')).toBe('-123.45');
      expect(sanitizeCsvFormula('\u00A0-123.45')).toBe('\u00A0-123.45');
      expect(sanitizeCsvFormula('\u3000+42')).toBe('\u3000+42');
    });
  });

  describe('escapeCsvValue', () => {
    it('should handle null and undefined safely', () => {
      // Arrange & Act & Assert
      expect(escapeCsvValue(null)).toBe('');
      expect(escapeCsvValue(undefined)).toBe('');
    });

    it('should preserve raw numbers safely', () => {
      // Arrange & Act & Assert
      expect(escapeCsvValue(7200)).toBe('7200');
      expect(escapeCsvValue(-120)).toBe('-120');
      expect(escapeCsvValue(0)).toBe('0');
      expect(escapeCsvValue(3.14)).toBe('3.14');
    });

    it('should neutralize formula and apply RFC 4180 quotes when quotes/commas are present', () => {
      // Arrange
      const raw = '=HYPERLINK("http://evil.com", "Click")';

      // Act
      const escaped = escapeCsvValue(raw);

      // Assert
      expect(escaped).toBe('"\'=HYPERLINK(""http://evil.com"", ""Click"")"');
    });

    it('should preserve multiline strings with quotes and commas per RFC 4180', () => {
      // Arrange
      const raw = 'Line 1\nLine 2 with "quotes", and commas';

      // Act
      const escaped = escapeCsvValue(raw);

      // Assert
      expect(escaped).toBe('"Line 1\nLine 2 with ""quotes"", and commas"');
    });
  });

  describe('CsvExporterPlugin.export', () => {
    it('should export payload with neutralized formula injections and RFC 4180 formatting', async () => {
      // Arrange
      const exporter = new CsvExporterPlugin();
      const payload: ExportPayload = {
        title: 'Security Audit Report',
        period: 'day',
        generatedAt: '2026-11-07 20:00:00',
        totalSeconds: 3600,
        formattedTotalDuration: '01:00:00',
        projectBreakdown: [{ projectName: '=1+1', seconds: 3600, percentage: 100 }],
        rows: [
          {
            id: 'row-sec-1',
            date: '2026-11-07',
            projectName: '\u00A0=1+1',
            taskName: "+cmd|' /C calc'!A0",
            subtaskName: 'Security subtask',
            startTime: '10:00:00',
            endTime: '11:00:00',
            durationSeconds: 3600,
            formattedDuration: '01:00:00',
            note: '-calc and @SUM(A1:A2)',
          },
        ],
      };

      // Act
      const blob = await exporter.export(payload);
      const text = await blob.text();

      // Assert
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      expect(bytes[0]).toBe(0xef);
      expect(bytes[1]).toBe(0xbb);
      expect(bytes[2]).toBe(0xbf);

      const lines = text.split('\r\n');
      expect(lines[0]).toBe(
        'Date,Project,Task,Subtask,Start Time,End Time,Duration (s),Formatted Duration,Note'
      );
      expect(lines[1]).toContain("'\u00A0=1+1");
      expect(lines[1]).toContain("'+cmd|' /C calc'!A0");
      expect(lines[1]).toContain('Security subtask');
      expect(lines[1]).toContain("'-calc and @SUM(A1:A2)");
      expect(lines[1]).toContain('3600');
    });
  });
});
