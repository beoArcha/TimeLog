/**
 * Checks if a Unicode code point is allowed in XML 1.0 (Fifth Edition).
 *
 * Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
 *
 * Disallowed characters include:
 * - Control characters: U+0000..U+0008, U+000B..U+000C, U+000E..U+001F
 * - Noncharacters: U+FFFE, U+FFFF
 * - Lone surrogates: U+D800..U+DFFF
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
 * while preserving TAB, LF, CR, emoji (surrogate pairs), and Unicode diacritics.
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
 * Predefined entities: &amp;, &lt;, &gt;, &quot;, &apos;
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
