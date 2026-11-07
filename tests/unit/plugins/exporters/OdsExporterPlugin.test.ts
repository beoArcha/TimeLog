import { describe, it, expect } from 'vitest';
import { OdsExporterPlugin } from '@plugins/exporters/OdsExporterPlugin';
import { ExportPayload } from '@plugins/contracts/IExporterPlugin';

describe('OdsExporterPlugin', () => {
  const samplePayload: ExportPayload = {
    title: 'TimeLog ODS Report',
    period: '2026-11-01 - 2026-11-07',
    generatedAt: '2026-11-07 14:00:00',
    totalSeconds: 7200,
    formattedTotalDuration: '02:00:00',
    rows: [
      {
        id: 'row-1',
        date: '2026-11-02',
        projectName: 'TimeLog',
        taskName: 'ODS Export Plugin',
        startTime: '08:00:00',
        endTime: '10:00:00',
        durationSeconds: 7200,
        formattedDuration: '02:00:00',
        note: 'Tested special chars: <XML> & "Quotes"',
      },
    ],
  };

  it('should have consistent exporter metadata', () => {
    const exporter = new OdsExporterPlugin();
    expect(exporter.id).toBe('ods-exporter');
    expect(exporter.name).toBe('OpenDocument Spreadsheet (ODS)');
    expect(exporter.extension).toBe('ods');
    expect(exporter.fileExtension).toBe('ods');
    expect(exporter.mimeType).toBe('application/vnd.oasis.opendocument.spreadsheet');
    expect(exporter.iconKey).toBe('ods');
  });

  it('should export valid OpenDocument spreadsheet archive', async () => {
    const exporter = new OdsExporterPlugin();
    const blob = await exporter.export(samplePayload);

    expect(blob.type).toBe('application/vnd.oasis.opendocument.spreadsheet');
    expect(blob.size).toBeGreaterThan(100);

    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // ZIP header PK\x03\x04
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);

    const text = new TextDecoder().decode(bytes);
    expect(text).toContain('mimetype');
    expect(text).toContain('application/vnd.oasis.opendocument.spreadsheet');
    expect(text).toContain('META-INF/manifest.xml');
    expect(text).toContain('content.xml');
    expect(text).toContain('Work Report');
    expect(text).toContain('TimeLog');
    expect(text).toContain('ODS Export Plugin');
    expect(text).toContain('&lt;XML&gt; &amp; &quot;Quotes&quot;');
  });
});
