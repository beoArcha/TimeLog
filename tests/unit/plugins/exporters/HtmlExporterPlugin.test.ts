import { describe, it, expect } from 'vitest';
import { HtmlExporterPlugin } from '@plugins/exporters/HtmlExporterPlugin';
import { ExportPayload } from '@plugins/contracts/IExporterPlugin';

describe('HtmlExporterPlugin', () => {
  const samplePayload: ExportPayload = {
    title: 'Work Summary Report & Analysis',
    period: '2026-11-01 - 2026-11-07',
    generatedAt: '2026-11-07 14:00:00',
    totalSeconds: 3600,
    formattedTotalDuration: '01:00:00',
    projectBreakdown: [
      { projectName: 'Project "Alpha"', seconds: 3600, percentage: 100 },
    ],
    rows: [
      {
        id: 'row-1',
        date: '2026-11-02',
        projectName: 'Project "Alpha"',
        taskName: 'Feature <Development>',
        startTime: '09:00:00',
        endTime: '10:00:00',
        durationSeconds: 3600,
        formattedDuration: '01:00:00',
        note: 'Tested with Polish: zażółć gęślą jaźń & "quotes"',
      },
    ],
  };

  it('should have consistent exporter metadata', () => {
    const exporter = new HtmlExporterPlugin();
    expect(exporter.id).toBe('html-exporter');
    expect(exporter.name).toBe('HTML');
    expect(exporter.extension).toBe('html');
    expect(exporter.fileExtension).toBe('html');
    expect(exporter.mimeType).toBe('text/html;charset=utf-8;');
    expect(exporter.iconKey).toBe('html');
  });

  it('should export HTML document with metadata, breakdown, and escaped content', async () => {
    const exporter = new HtmlExporterPlugin();
    const blob = await exporter.export(samplePayload);
    const html = await blob.text();

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<meta charset="UTF-8">');
    expect(html).toContain('Work Summary Report &amp; Analysis');
    expect(html).toContain('2026-11-01 - 2026-11-07');
    expect(html).toContain('01:00:00');
    expect(html).toContain('Project &quot;Alpha&quot;');
    expect(html).toContain('Feature &lt;Development&gt;');
    expect(html).toContain('Tested with Polish: zażółć gęślą jaźń &amp; &quot;quotes&quot;');
    expect(html).toContain('Project Breakdown');
    expect(html).toContain('Activity Log');
  });

  it('should render cleanly when projectBreakdown is empty', async () => {
    const exporter = new HtmlExporterPlugin();
    const emptyPayload: ExportPayload = {
      ...samplePayload,
      projectBreakdown: [],
      rows: [],
    };
    const blob = await exporter.export(emptyPayload);
    const html = await blob.text();

    expect(html).not.toContain('Project Breakdown');
    expect(html).toContain('Activity Log');
  });
});
