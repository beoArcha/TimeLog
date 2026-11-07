import { describe, it, expect } from 'vitest';
import {
  CsvExporterPlugin,
  escapeCsvValue,
  sanitizeCsvFormula,
  isNumericString,
} from '@plugins/exporters/CsvExporterPlugin';
import { ExportPayload } from '@plugins/contracts/IExporterPlugin';

describe('CsvExporterPlugin & CSV Formula Injection Protection', () => {
  describe('isNumericString', () => {
    it('should identify valid positive and negative numbers', () => {
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

    it('should reject non-numeric strings, formulas, and empty values', () => {
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
    });
  });

  describe('sanitizeCsvFormula', () => {
    it('should neutralize formula trigger characters with leading apostrophe', () => {
      // Arrange & Act & Assert
      expect(sanitizeCsvFormula('=1+1')).toBe("'=1+1");
      expect(sanitizeCsvFormula('@SUM(A1:A2)')).toBe("'@SUM(A1:A2)");
      expect(sanitizeCsvFormula("+cmd|' /C calc'!A0")).toBe("'+cmd|' /C calc'!A0");
      expect(sanitizeCsvFormula('-calc')).toBe("'-calc");
    });

    it('should neutralize formula triggers preceded by whitespace and control characters', () => {
      // Arrange & Act & Assert
      expect(sanitizeCsvFormula('   =1+1')).toBe("'   =1+1");
      expect(sanitizeCsvFormula('\t@SUM(A1:A2)')).toBe("'\t@SUM(A1:A2)");
      expect(sanitizeCsvFormula("\r\n+cmd|' /C calc'!A0")).toBe("'\r\n+cmd|' /C calc'!A0");
      expect(sanitizeCsvFormula('\x00-calc')).toBe("'\x00-calc");
    });

    it('should preserve plain text and empty values without prefix', () => {
      // Arrange & Act & Assert
      expect(sanitizeCsvFormula('')).toBe('');
      expect(sanitizeCsvFormula('   ')).toBe('   ');
      expect(sanitizeCsvFormula('Regular Project')).toBe('Regular Project');
      expect(sanitizeCsvFormula('Task #42')).toBe('Task #42');
      expect(sanitizeCsvFormula('Alpha & Omega')).toBe('Alpha & Omega');
    });

    it('should preserve valid numeric values including negatives without prefix', () => {
      // Arrange & Act & Assert
      expect(sanitizeCsvFormula('123')).toBe('123');
      expect(sanitizeCsvFormula('+123')).toBe('+123');
      expect(sanitizeCsvFormula('-123')).toBe('-123');
      expect(sanitizeCsvFormula('-123.45')).toBe('-123.45');
      expect(sanitizeCsvFormula('+42.0')).toBe('+42.0');
      expect(sanitizeCsvFormula('0')).toBe('0');
      expect(sanitizeCsvFormula('-0')).toBe('-0');
      expect(sanitizeCsvFormula('.5')).toBe('.5');
      expect(sanitizeCsvFormula('-.5')).toBe('-.5');
      expect(sanitizeCsvFormula('1e5')).toBe('1e5');
      expect(sanitizeCsvFormula('-1e-3')).toBe('-1e-3');
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
            projectName: '=1+1',
            taskName: "+cmd|' /C calc'!A0",
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
        'Date,Project,Task,Start Time,End Time,Duration (s),Formatted Duration,Note'
      );
      // Row 1 should have neutralized formulas
      expect(lines[1]).toContain("'=1+1");
      expect(lines[1]).toContain("'+cmd|' /C calc'!A0");
      expect(lines[1]).toContain("'-calc and @SUM(A1:A2)");
      expect(lines[1]).toContain('3600');
    });
  });
});
