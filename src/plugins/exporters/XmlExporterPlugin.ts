import { ExportPayload, IExporterPlugin } from '../contracts/IExporterPlugin';

/**
 * Checks if a Unicode code point is allowed in XML 1.0 (Fifth Edition).
 * Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
 */
export function isValidXml10CodePoint(codePoint: number): boolean {
  return (
    codePoint === 0x09 ||
    codePoint === 0x0a ||
    codePoint === 0x0d ||
    (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
    (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
    (codePoint >= 0x10000 && codePoint <= 0x10ffff)
  );
}

/**
 * Sanitizes a string for XML 1.0 by stripping disallowed control characters
 * (such as U+0000, U+0007), lone surrogates, and noncharacters (U+FFFE, U+FFFF),
 * while preserving TAB, LF, CR, emoji, and Unicode diacritics.
 */
export function sanitizeXml10(input: string): string {
  let result = '';
  for (const char of input) {
    const codePoint = char.codePointAt(0);
    if (codePoint !== undefined && isValidXml10CodePoint(codePoint)) {
      result += char;
    }
  }
  return result;
}

/**
 * Escapes predefined XML entities after XML 1.0 character sanitization.
 */
export function escapeXml(unsafe: unknown): string {
  if (unsafe === null || unsafe === undefined) return '';
  const sanitized = sanitizeXml10(String(unsafe));
  return sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Creates a leaf XML element: `<tagName>escapedValue</tagName>`.
 * Returns an empty string if value is null or undefined.
 */
export function createXmlElement(tagName: string, value: unknown, indent = 0): string {
  if (value === null || value === undefined) return '';
  const spaces = ' '.repeat(indent);
  return `${spaces}<${tagName}>${escapeXml(value)}</${tagName}>`;
}

/**
 * Creates a container XML block with optional attributes and nested children.
 * Renders self-closing `<tagName .../>` when children are empty.
 */
export function createXmlBlock(
  tagName: string,
  children: string[],
  indent = 0,
  attributes?: Record<string, string>
): string {
  const spaces = ' '.repeat(indent);
  const attrStr = attributes
    ? ' ' + Object.entries(attributes).map(([k, v]) => `${k}="${escapeXml(v)}"`).join(' ')
    : '';

  const validChildren = children.filter((c) => c && c.trim().length > 0);
  if (validChildren.length === 0) {
    return `${spaces}<${tagName}${attrStr}/>`;
  }

  return [
    `${spaces}<${tagName}${attrStr}>`,
    ...validChildren,
    `${spaces}</${tagName}>`,
  ].join('\n');
}

export class XmlExporterPlugin implements IExporterPlugin {
  readonly id = 'xml-exporter';
  readonly name = 'XML';
  readonly extension = 'xml';
  readonly fileExtension = 'xml';
  readonly mimeType = 'application/xml;charset=utf-8;';
  readonly iconKey = 'xml';

  async export(payload: ExportPayload): Promise<Blob> {
    const metadata = createXmlBlock(
      'metadata',
      [
        createXmlElement('title', payload.title, 4),
        createXmlElement('period', payload.period, 4),
        createXmlElement('generatedAt', payload.generatedAt, 4),
      ],
      2
    );

    const summary = createXmlBlock(
      'summary',
      [
        createXmlElement('totalSeconds', payload.totalSeconds, 4),
        createXmlElement('formattedTotalDuration', payload.formattedTotalDuration, 4),
      ],
      2
    );

    const projectBlocks = (payload.projectBreakdown ?? []).map((project) =>
      createXmlBlock(
        'project',
        [
          createXmlElement('name', project.projectName, 6),
          createXmlElement('durationSeconds', project.seconds, 6),
          createXmlElement('percentage', project.percentage, 6),
        ],
        4
      )
    );
    const projects = createXmlBlock('projects', projectBlocks, 2);

    const entryBlocks = (payload.rows ?? []).map((row) =>
      createXmlBlock(
        'entry',
        [
          createXmlElement('id', row.id, 6),
          createXmlElement('date', row.date, 6),
          createXmlElement('projectName', row.projectName, 6),
          createXmlElement('taskName', row.taskName, 6),
          createXmlElement('startTime', row.startTime, 6),
          createXmlElement('endTime', row.endTime, 6),
          createXmlElement('durationSeconds', row.durationSeconds, 6),
          createXmlElement('formattedDuration', row.formattedDuration, 6),
          ...(row.note ? [createXmlElement('note', row.note, 6)] : []),
        ],
        4
      )
    );
    const entries = createXmlBlock('entries', entryBlocks, 2);

    const report = createXmlBlock(
      'report',
      [metadata, summary, projects, entries],
      0,
      { schemaVersion: '1' }
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${report}\n`;
    return new Blob([xml], { type: this.mimeType });
  }
}
