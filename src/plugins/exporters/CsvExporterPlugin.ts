import { ExportPayload, IExporterPlugin } from '../contracts/IExporterPlugin';

/**
 * CSV Exporter Plugin with CSV Formula Injection (CWE-1236) Protection and RFC 4180 Compliance.
 *
 * # Formula Injection Neutralization Policy
 *
 * Spreadsheet software (such as Microsoft Excel, LibreOffice Calc, and Google Sheets)
 * automatically evaluates cells as formulas or dynamic data exchange (DDE) commands if
 * the cell begins with formula trigger characters:
 * - `=` (standard formula execution)
 * - `+` (formula addition / command prefix)
 * - `-` (formula subtraction / command prefix)
 * - `@` (function call / implicit intersection operator)
 *
 * Additionally, spreadsheet engines strip leading whitespace (` `, `\t`) and ASCII
 * control characters (`\r`, `\n`, etc.) before evaluating formula triggers.
 *
 * ## Neutralization Strategy:
 * 1. Find the first non-whitespace, non-control character in the cell value.
 * 2. If the character is one of the formula triggers (`=`, `+`, `-`, `@`):
 *    - Check if the value represents a valid finite number (e.g. `123`, `-123`, `+123`,
 *      `-123.45`, `0.5`). Valid numeric values are safe in spreadsheets and are preserved
 *      as-is without modification.
 *    - Otherwise, prefix the cell with an apostrophe (`'`). In spreadsheet software,
 *      a leading apostrophe is interpreted as a text prefix marker, instructing the
 *      application to treat the entire cell content strictly as literal text.
 * 3. Standard RFC 4180 CSV escaping is applied:
 *    - Values containing commas, double quotes, or newlines are enclosed in double quotes.
 *    - Internal double quotes are doubled (`"` -> `""`).
 */

const FORMULA_TRIGGERS = new Set(['=', '+', '-', '@']);

const RUST_FLOAT_REGEX = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;

/**
 * Checks whether a character code represents Unicode White_Space,
 * matching Rust's `char::is_whitespace()` in core::char exactly.
 *
 * Rust whitespace codepoints:
 * - 0x0020 (Space)
 * - 0x0009..=0x000D (Tab, LF, VT, FF, CR)
 * - 0x0085 (NEL: Next Line)
 * - 0x00A0 (NBSP: No-Break Space)
 * - 0x1680 (Ogham Space Mark)
 * - 0x2000..=0x200A (En Quad through Hair Space)
 * - 0x2028 (Line Separator)
 * - 0x2029 (Paragraph Separator)
 * - 0x202F (Narrow No-Break Space)
 * - 0x205F (Medium Mathematical Space)
 * - 0x3000 (Ideographic Space)
 *
 * Format characters like U+200B (Zero-Width Space) and U+FEFF (BOM) are
 * intentionally excluded to maintain strict parity with Rust.
 */
export function isUnicodeWhitespace(charCode: number): boolean {
  return (
    charCode === 0x0020 ||
    (charCode >= 0x0009 && charCode <= 0x000d) ||
    charCode === 0x0085 ||
    charCode === 0x00a0 ||
    charCode === 0x1680 ||
    (charCode >= 0x2000 && charCode <= 0x200a) ||
    charCode === 0x2028 ||
    charCode === 0x2029 ||
    charCode === 0x202f ||
    charCode === 0x205f ||
    charCode === 0x3000
  );
}

/**
 * Checks whether a character code represents an ASCII or Unicode control character,
 * matching Rust's `char::is_control()` (Unicode General Category Cc) exactly:
 * - 0x0000..=0x001F (C0 control characters)
 * - 0x007F..=0x009F (Delete and C1 control characters)
 */
export function isUnicodeControl(charCode: number): boolean {
  return (
    (charCode >= 0x0000 && charCode <= 0x001f) ||
    (charCode >= 0x007f && charCode <= 0x009f)
  );
}

/**
 * Checks whether a character code represents whitespace or an ASCII/Unicode control character,
 * matching Rust's `char::is_whitespace() || char::is_control()` parity contract.
 */
export function isWhitespaceOrControl(charCode: number): boolean {
  return isUnicodeWhitespace(charCode) || isUnicodeControl(charCode);
}

/**
 * Trims leading and trailing Unicode whitespace characters according to Rust's
 * `char::is_whitespace()` definition.
 */
export function trimRustWhitespace(str: string): string {
  let start = 0;
  while (start < str.length && isUnicodeWhitespace(str.charCodeAt(start))) {
    start++;
  }
  let end = str.length;
  while (end > start && isUnicodeWhitespace(str.charCodeAt(end - 1))) {
    end--;
  }
  return str.slice(start, end);
}

/**
 * Checks whether a string represents a valid numeric literal (integer or float).
 * Legitimate numbers (e.g. "123", "-123", "+123", "-123.45") are safe in spreadsheets
 * and should not be neutralized with an apostrophe.
 */
export function isNumericString(str: string): boolean {
  const trimmed = trimRustWhitespace(str);
  if (trimmed === '') {
    return false;
  }
  return RUST_FLOAT_REGEX.test(trimmed);
}

/**
 * Neutralizes CSV formula injection (CWE-1236) by prefixing potentially dangerous
 * cell values with a single quote (`'`).
 *
 * If a string's first non-whitespace, non-control character is `=`, `+`, `-`, or `@`,
 * and the string does not represent a valid number, an apostrophe (`'`) is prepended.
 */
export function sanitizeCsvFormula(val: string): string {
  if (!val) {
    return val;
  }

  let firstChar: string | null = null;
  for (let i = 0; i < val.length; i++) {
    const code = val.charCodeAt(i);
    if (!isWhitespaceOrControl(code)) {
      firstChar = val[i];
      break;
    }
  }

  if (!firstChar || !FORMULA_TRIGGERS.has(firstChar) || isNumericString(val)) {
    return val;
  }

  return `'${val}`;
}

/**
 * Escapes a single CSV value strictly adhering to RFC 4180 and protecting against
 * CSV formula injection (CWE-1236):
 * 1. Safely formats numbers and preserves their numeric format.
 * 2. Checks and neutralizes formula injection triggers (=, +, -, @) on text fields.
 * 3. Encloses values containing commas, quotes, or newlines in double quotes,
 *    and doubles internal quotes (" -> "").
 */
export function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }

  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : '';
  }

  const rawStr = String(val);
  const sanitized = sanitizeCsvFormula(rawStr);

  if (/[",\r\n]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

export class CsvExporterPlugin implements IExporterPlugin {
  readonly id = 'csv-exporter';
  readonly name = 'CSV (RFC 4180)';
  readonly extension = 'csv';
  readonly fileExtension = 'csv';
  readonly mimeType = 'text/csv;charset=utf-8;';
  readonly iconKey = 'csv';

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

    const lines: string[] = [headers.map(escapeCsvValue).join(',')];

    for (const row of payload.rows) {
      const line = [
        row.date,
        row.projectName,
        row.taskName,
        row.subtaskName ?? '',
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
