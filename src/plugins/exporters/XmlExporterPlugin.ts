import { ExportPayload, IExporterPlugin } from '../contracts/IExporterPlugin';

function escapeXml(unsafe: unknown): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export class XmlExporterPlugin implements IExporterPlugin {
  readonly id = 'xml-exporter';
  readonly name = 'XML';
  readonly fileExtension = 'xml';
  readonly mimeType = 'application/xml;charset=utf-8;';

  async export(payload: ExportPayload): Promise<Blob> {
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<report>',
      `  <title>${escapeXml(payload.title)}</title>`,
      `  <period>${escapeXml(payload.period)}</period>`,
      `  <generatedAt>${escapeXml(payload.generatedAt)}</generatedAt>`,
      `  <totalSeconds>${payload.totalSeconds}</totalSeconds>`,
      `  <formattedTotalDuration>${escapeXml(payload.formattedTotalDuration)}</formattedTotalDuration>`,
      '  <rows>',
    ];

    for (const row of payload.rows) {
      lines.push('    <row>');
      lines.push(`      <id>${escapeXml(row.id)}</id>`);
      lines.push(`      <date>${escapeXml(row.date)}</date>`);
      lines.push(`      <projectName>${escapeXml(row.projectName)}</projectName>`);
      lines.push(`      <taskName>${escapeXml(row.taskName)}</taskName>`);
      lines.push(`      <startTime>${escapeXml(row.startTime)}</startTime>`);
      lines.push(`      <endTime>${escapeXml(row.endTime)}</endTime>`);
      lines.push(`      <durationSeconds>${row.durationSeconds}</durationSeconds>`);
      lines.push(`      <formattedDuration>${escapeXml(row.formattedDuration)}</formattedDuration>`);
      if (row.note) {
        lines.push(`      <note>${escapeXml(row.note)}</note>`);
      }
      lines.push('    </row>');
    }

    lines.push('  </rows>');
    lines.push('</report>');

    return new Blob([lines.join('\n')], { type: this.mimeType });
  }
}
