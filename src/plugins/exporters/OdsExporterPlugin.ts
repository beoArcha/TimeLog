import { ExportPayload, IExporterPlugin } from '../contracts/IExporterPlugin';
import { createUncompressedZip, ZipEntry } from './zipBuilder';
import { escapeXml, sanitizeXml10 } from './xmlSanitizer';

function stringCell(val: unknown): string {
  const text = escapeXml(sanitizeXml10(String(val ?? '')));
  return `<table:table-cell office:value-type="string"><text:p>${text}</text:p></table:table-cell>`;
}

function floatCell(val: number): string {
  return `<table:table-cell office:value-type="float" office:value="${val}"><text:p>${val}</text:p></table:table-cell>`;
}

export class OdsExporterPlugin implements IExporterPlugin {
  readonly id = 'ods-exporter';
  readonly name = 'OpenDocument Spreadsheet (ODS)';
  readonly extension = 'ods';
  readonly fileExtension = 'ods';
  readonly mimeType = 'application/vnd.oasis.opendocument.spreadsheet';
  readonly iconKey = 'ods';

  async export(payload: ExportPayload): Promise<Blob> {
    const headers = [
      'Date',
      'Project',
      'Task',
      'Subtask',
      'Start Time',
      'End Time',
      'Duration (s)',
      'Formatted Duration',
      'Note',
    ];

    const headerRow = `<table:table-row>${headers.map(stringCell).join('')}</table:table-row>`;

    const dataRows = payload.rows.map((row) => {
      const cells = [
        stringCell(row.date),
        stringCell(row.projectName),
        stringCell(row.taskName),
        stringCell(row.subtaskName ?? ''),
        stringCell(row.startTime),
        stringCell(row.endTime),
        floatCell(row.durationSeconds),
        stringCell(row.formattedDuration),
        stringCell(row.note ?? ''),
      ];
      return `<table:table-row>${cells.join('')}</table:table-row>`;
    });

    const totalRow = `<table:table-row>${[
      stringCell('Total'),
      stringCell(''),
      stringCell(''),
      stringCell(''),
      stringCell(''),
      stringCell(''),
      floatCell(payload.totalSeconds),
      stringCell(payload.formattedTotalDuration),
      stringCell(''),
    ].join('')}</table:table-row>`;

    const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  office:version="1.2">
  <office:body>
    <office:spreadsheet>
      <table:table table:name="Work Report">
        ${headerRow}
        ${dataRows.join('\n        ')}
        ${totalRow}
      </table:table>
    </office:spreadsheet>
  </office:body>
</office:document-content>`;

    const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

    const entries: ZipEntry[] = [
      { name: 'mimetype', data: 'application/vnd.oasis.opendocument.spreadsheet' },
      { name: 'META-INF/manifest.xml', data: manifestXml },
      { name: 'content.xml', data: contentXml },
    ];

    const zipBytes = createUncompressedZip(entries);
    return new Blob([zipBytes], { type: this.mimeType });
  }
}
