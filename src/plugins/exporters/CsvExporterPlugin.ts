import { ExportPayload, IExporterPlugin } from '../contracts/IExporterPlugin';

/**
 * Escapes a single CSV value strictly adhering to RFC 4180:
 * Encloses values containing commas, quotes, or newlines in double quotes,
 * and doubles internal quotes (" -> "").
 */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }
  const str = String(val);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export class CsvExporterPlugin implements IExporterPlugin {
  readonly id = 'csv-exporter';
  readonly name = 'CSV (RFC 4180)';
  readonly fileExtension = 'csv';
  readonly mimeType = 'text/csv;charset=utf-8;';

  async export(payload: ExportPayload): Promise<Blob> {
    const headers = [
      'Date',
      'Project',
      'Task',
      'Start Time',
      'End Time',
      'Duration (s)',
      'Formatted Duration',
      'Note',
    ];

    const lines: string[] = [headers.map(escapeCsvValue).join(',')];

    for (const row of payload.rows) {
      const line = [
        row.date,
        row.projectName,
        row.taskName,
        row.startTime,
        row.endTime,
        row.durationSeconds,
        row.formattedDuration,
        row.note ?? '',
      ]
        .map(escapeCsvValue)
        .join(',');

      lines.push(line);
    }

    // Prepend UTF-8 BOM so spreadsheet applications (Excel) properly detect UTF-8 encoded text
    const csvContent = '\uFEFF' + lines.join('\r\n');
    return new Blob([csvContent], { type: this.mimeType });
  }
}
