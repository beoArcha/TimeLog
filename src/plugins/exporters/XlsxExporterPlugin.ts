import { ExportPayload, IExporterPlugin } from '../contracts/IExporterPlugin';
import { createUncompressedZip, ZipEntry } from './zipBuilder';
import { escapeXml, sanitizeXml10 } from './xmlSanitizer';

function stringCell(ref: string, val: unknown): string {
  const text = escapeXml(sanitizeXml10(String(val ?? '')));
  return `<c r="${ref}" t="inlineStr"><is><t>${text}</t></is></c>`;
}

function numberCell(ref: string, val: number): string {
  return `<c r="${ref}"><v>${val}</v></c>`;
}

const COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export class XlsxExporterPlugin implements IExporterPlugin {
  readonly id = 'xlsx-exporter';
  readonly name = 'Microsoft Excel (XLSX)';
  readonly extension = 'xlsx';
  readonly fileExtension = 'xlsx';
  readonly mimeType =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  readonly iconKey = 'xlsx';

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

    let rowIdx = 1;
    const rowsXml: string[] = [];

    // Header row
    const headerCells = headers.map((h, i) =>
      stringCell(`${COL_LETTERS[i]}${rowIdx}`, h)
    );
    rowsXml.push(`<row r="${rowIdx}">${headerCells.join('')}</row>`);
    rowIdx++;

    // Data rows
    for (const row of payload.rows) {
      const cells = [
        stringCell(`A${rowIdx}`, row.date),
        stringCell(`B${rowIdx}`, row.projectName),
        stringCell(`C${rowIdx}`, row.taskName),
        stringCell(`D${rowIdx}`, row.startTime),
        stringCell(`E${rowIdx}`, row.endTime),
        numberCell(`F${rowIdx}`, row.durationSeconds),
        stringCell(`G${rowIdx}`, row.formattedDuration),
        stringCell(`H${rowIdx}`, row.note ?? ''),
      ];
      rowsXml.push(`<row r="${rowIdx}">${cells.join('')}</row>`);
      rowIdx++;
    }

    // Total row
    const totalCells = [
      stringCell(`A${rowIdx}`, 'Total'),
      stringCell(`B${rowIdx}`, ''),
      stringCell(`C${rowIdx}`, ''),
      stringCell(`D${rowIdx}`, ''),
      stringCell(`E${rowIdx}`, ''),
      numberCell(`F${rowIdx}`, payload.totalSeconds),
      stringCell(`G${rowIdx}`, payload.formattedTotalDuration),
      stringCell(`H${rowIdx}`, ''),
    ];
    rowsXml.push(`<row r="${rowIdx}">${totalCells.join('')}</row>`);

    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${rowsXml.join('\n    ')}
  </sheetData>
</worksheet>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

    const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Work Report" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

    const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;

    const entries: ZipEntry[] = [
      { name: '[Content_Types].xml', data: contentTypesXml },
      { name: '_rels/.rels', data: rootRelsXml },
      { name: 'xl/workbook.xml', data: workbookXml },
      { name: 'xl/_rels/workbook.xml.rels', data: workbookRelsXml },
      { name: 'xl/worksheets/sheet1.xml', data: sheetXml },
    ];

    const zipBytes = createUncompressedZip(entries);
    return new Blob([zipBytes], { type: this.mimeType });
  }
}
