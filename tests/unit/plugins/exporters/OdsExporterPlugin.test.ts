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
        subtaskName: 'Archive Validation',
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
    expect(text).toContain('Subtask');
    expect(text).toContain('Archive Validation');
    expect(text).toContain('&lt;XML&gt; &amp; &quot;Quotes&quot;');
  });

  it('should sanitize XML 1.0 disallowed characters and produce well-formed content.xml', async () => {
    const exporter = new OdsExporterPlugin();
    const dirtyPayload: ExportPayload = {
      title: 'Dirty ODS\u0000 Report\u0007',
      period: '2026-11-01',
      generatedAt: '2026-11-07 15:00:00',
      totalSeconds: 3600,
      formattedTotalDuration: '01:00:00',
      rows: [
        {
          id: 'row-dirty',
          date: '2026-11-02',
          projectName: 'Project\u0000 with \u0007\u0008 controls \ufffe\uffff',
          taskName: 'Task with <brackets> & "quotes" and \u001f stripped \ud83d\ude80',
          startTime: '08:00:00',
          endTime: '09:00:00',
          durationSeconds: 3600,
          formattedDuration: '01:00:00',
          note: 'Note with Polish: Zażółć gęślą jaźń and disallowed \u000b\u000c chars',
        },
      ],
    };

    const blob = await exporter.export(dirtyPayload);
    const buffer = await blob.arrayBuffer();
    const text = new TextDecoder().decode(new Uint8Array(buffer));

    // Extract content.xml from the uncompressed zip
    const startTag = '<?xml version="1.0" encoding="UTF-8"?>';
    const endTag = '</office:document-content>';
    const startIdx = text.indexOf('<office:document-content');
    const endIdx = text.indexOf(endTag);
    expect(startIdx).toBeGreaterThan(-1);
    expect(endIdx).toBeGreaterThan(startIdx);

    const xmlSlice = `${startTag}\n${text.slice(startIdx, endIdx + endTag.length)}`;

    // Ensure raw disallowed control characters do not appear in the generated XML
    expect(xmlSlice).not.toContain('\u0000');
    expect(xmlSlice).not.toContain('\u0007');
    expect(xmlSlice).not.toContain('\u0008');
    expect(xmlSlice).not.toContain('\u001f');
    expect(xmlSlice).not.toContain('\ufffe');
    expect(xmlSlice).not.toContain('\uffff');
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlSlice, 'application/xml');

    expect(doc.querySelector('parsererror')).toBeNull();
    const cells = Array.from(doc.getElementsByTagName('table:table-cell'));
    expect(cells.length).toBeGreaterThan(0);
    expect(xmlSlice).toContain('Project with  controls');
    expect(xmlSlice).toContain('Zażółć gęślą jaźń');
    expect(xmlSlice).toContain('🚀');
  });
});
