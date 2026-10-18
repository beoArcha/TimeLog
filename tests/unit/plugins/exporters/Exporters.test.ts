import { describe, it, expect, vi } from 'vitest';
import { CsvExporterPlugin } from '@plugins/exporters/CsvExporterPlugin';
import { JsonExporterPlugin } from '@plugins/exporters/JsonExporterPlugin';
import { MarkdownClipboardExporterPlugin } from '@plugins/exporters/MarkdownClipboardExporterPlugin';
import { ExportPayload } from '@plugins/contracts/IExporterPlugin';

describe('Built-in Exporter Plugins', () => {
  const samplePayload: ExportPayload = {
    title: 'Time Summaries & Reports',
    period: 'week',
    generatedAt: '2026-10-19 12:00:00',
    totalSeconds: 7200,
    formattedTotalDuration: '02:00:00',
    projectBreakdown: [
      { projectName: 'Project "Alpha"', seconds: 7200, percentage: 100 },
    ],
    rows: [
      {
        id: 'row-1',
        date: '2026-10-19',
        projectName: 'Project "Alpha"',
        taskName: 'Coding, Testing & Review',
        startTime: '10:00:00',
        endTime: '12:00:00',
        durationSeconds: 7200,
        formattedDuration: '02:00:00',
        note: 'Line 1\nLine 2 with "quotes", and commas',
      },
    ],
  };

  describe('CsvExporterPlugin', () => {
    it('should export valid RFC 4180 CSV with UTF-8 BOM and escaped fields', async () => {
      // Arrange
      const exporter = new CsvExporterPlugin();

      // Act
      const blob = await exporter.export(samplePayload);
      const text = await blob.text();

      // Assert
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      expect(bytes[0]).toBe(0xef);
      expect(bytes[1]).toBe(0xbb);
      expect(bytes[2]).toBe(0xbf);
      expect(text).toContain('Date,Project,Task,Start Time,End Time,Duration (s),Formatted Duration,Note');
      // Quotes should be doubled and field wrapped in quotes
      expect(text).toContain('"Project ""Alpha"""');
      // Commas and newlines should be wrapped in quotes
      expect(text).toContain('"Coding, Testing & Review"');
      expect(text).toContain('"Line 1\nLine 2 with ""quotes"", and commas"');
    });
  });

  describe('JsonExporterPlugin', () => {
    it('should export valid formatted JSON blob matching payload schema', async () => {
      // Arrange
      const exporter = new JsonExporterPlugin();

      // Act
      const blob = await exporter.export(samplePayload);
      const text = await blob.text();
      const parsed = JSON.parse(text);

      // Assert
      expect(parsed.title).toBe(samplePayload.title);
      expect(parsed.totalSeconds).toBe(7200);
      expect(parsed.rows).toHaveLength(1);
      expect(parsed.rows[0].projectName).toBe('Project "Alpha"');
    });
  });

  describe('MarkdownClipboardExporterPlugin', () => {
    it('should format payload into a Markdown table with summary and breakdown', async () => {
      // Arrange
      const exporter = new MarkdownClipboardExporterPlugin();

      // Act
      const markdown = await exporter.export(samplePayload);

      // Assert
      expect(markdown).toContain('# Time Summaries & Reports');
      expect(markdown).toContain('**Period**: week');
      expect(markdown).toContain('### Activity Log');
      expect(markdown).toContain('| Date | Project | Task | Start | End | Duration | Note |');
      expect(markdown).toContain('| 2026-10-19 | Project "Alpha" | Coding, Testing & Review | 10:00:00 | 12:00:00 | 02:00:00 |');
    });

    it('should copy to clipboard when copyToClipboard is invoked', async () => {
      // Arrange
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });
      const exporter = new MarkdownClipboardExporterPlugin();

      // Act
      const result = await exporter.copyToClipboard(samplePayload);

      // Assert
      expect(writeTextMock).toHaveBeenCalledWith(result);
      expect(result).toContain('# Time Summaries & Reports');
    });
  });
});
