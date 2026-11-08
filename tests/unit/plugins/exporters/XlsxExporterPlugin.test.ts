import { describe, it, expect } from 'vitest';
import { XlsxExporterPlugin } from '@plugins/exporters/XlsxExporterPlugin';
import { ExportPayload } from '@plugins/contracts/IExporterPlugin';

describe('XlsxExporterPlugin', () => {
  const samplePayload: ExportPayload = {
    title: 'TimeLog Excel Report',
    period: '2026-11-01 - 2026-11-07',
    generatedAt: '2026-11-07 14:00:00',
    totalSeconds: 3600,
    formattedTotalDuration: '01:00:00',
    rows: [
      {
        id: 'row-1',
        date: '2026-11-02',
        projectName: 'TimeLog',
        taskName: 'Excel Export Implementation',
        subtaskName: 'Worksheet Validation',
        startTime: '10:00:00',
        endTime: '11:00:00',
        durationSeconds: 3600,
        formattedDuration: '01:00:00',
        note: 'Excel with <brackets> & "quotes"',
      },
    ],
  };

  it('should have consistent exporter metadata', () => {
    const exporter = new XlsxExporterPlugin();
    expect(exporter.id).toBe('xlsx-exporter');
    expect(exporter.name).toBe('Microsoft Excel (XLSX)');
    expect(exporter.extension).toBe('xlsx');
    expect(exporter.fileExtension).toBe('xlsx');
    expect(exporter.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(exporter.iconKey).toBe('xlsx');
  });

  it('should export valid OpenXML XLSX archive with worksheet and workbook relationships', async () => {
    const exporter = new XlsxExporterPlugin();
    const blob = await exporter.export(samplePayload);

    expect(blob.type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(blob.size).toBeGreaterThan(100);

    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // ZIP header signature PK\x03\x04
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);

    const text = new TextDecoder().decode(bytes);
    expect(text).toContain('[Content_Types].xml');
    expect(text).toContain('_rels/.rels');
    expect(text).toContain('xl/workbook.xml');
    expect(text).toContain('xl/_rels/workbook.xml.rels');
    expect(text).toContain('xl/worksheets/sheet1.xml');
    expect(text).toContain('Work Report');
    expect(text).toContain('TimeLog');
    expect(text).toContain('Excel Export Implementation');
    expect(text).toContain('Subtask');
    expect(text).toContain('Worksheet Validation');
    expect(text).toContain('Excel with &lt;brackets&gt; &amp; &quot;quotes&quot;');
  });

  it('should sanitize XML 1.0 disallowed characters and produce well-formed xl/worksheets/sheet1.xml', async () => {
    const exporter = new XlsxExporterPlugin();
    const dirtyPayload: ExportPayload = {
      title: 'Dirty Excel\u0000 Report\u0007',
      period: '2026-11-01',
      generatedAt: '2026-11-07 15:00:00',
      totalSeconds: 3600,
      formattedTotalDuration: '01:00:00',
      rows: [
        {
          id: 'row-dirty-xlsx',
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

    // Extract sheet1.xml from the uncompressed zip
    const startTag = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet';
    const endTag = '</worksheet>';
    const startIdx = text.indexOf(startTag);
    const endIdx = text.indexOf(endTag);
    expect(startIdx).toBeGreaterThan(-1);
    expect(endIdx).toBeGreaterThan(startIdx);

    const xmlSlice = text.slice(startIdx, endIdx + endTag.length);

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
    const rows = doc.querySelectorAll('row');
    expect(rows.length).toBeGreaterThan(0);
    expect(xmlSlice).toContain('Project with  controls');
    expect(xmlSlice).toContain('Zażółć gęślą jaźń');
    expect(xmlSlice).toContain('🚀');
  });
});
