import { describe, it, expect } from 'vitest';
import {
  isValidXml10CodePoint,
  sanitizeXml10,
  escapeXml,
} from '@plugins/exporters/xmlSanitizer';

describe('xmlSanitizer', () => {
  describe('isValidXml10CodePoint', () => {
    it('allows valid whitespace: TAB, LF, CR', () => {
      expect(isValidXml10CodePoint(0x09)).toBe(true); // TAB '\t'
      expect(isValidXml10CodePoint(0x0a)).toBe(true); // LF '\n'
      expect(isValidXml10CodePoint(0x0d)).toBe(true); // CR '\r'
    });

    it('allows valid ASCII printable characters and space', () => {
      expect(isValidXml10CodePoint(0x20)).toBe(true); // Space ' '
      expect(isValidXml10CodePoint('a'.charCodeAt(0))).toBe(true);
      expect(isValidXml10CodePoint('Z'.charCodeAt(0))).toBe(true);
      expect(isValidXml10CodePoint('0'.charCodeAt(0))).toBe(true);
      expect(isValidXml10CodePoint(0x7e)).toBe(true); // '~'
    });

    it('allows Polish diacritics and international Unicode characters', () => {
      const polishChars = 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ';
      for (const char of polishChars) {
        const codePoint = char.codePointAt(0)!;
        expect(isValidXml10CodePoint(codePoint)).toBe(true);
      }
      expect(isValidXml10CodePoint('日'.codePointAt(0)!)).toBe(true);
      expect(isValidXml10CodePoint('語'.codePointAt(0)!)).toBe(true);
      expect(isValidXml10CodePoint('é'.codePointAt(0)!)).toBe(true);
    });

    it('allows emoji code points in supplementary planes (#x10000-#x10FFFF)', () => {
      expect(isValidXml10CodePoint(0x10000)).toBe(true);
      expect(isValidXml10CodePoint('🚀'.codePointAt(0)!)).toBe(true); // 0x1F680
      expect(isValidXml10CodePoint('😀'.codePointAt(0)!)).toBe(true); // 0x1F600
      expect(isValidXml10CodePoint('🎉'.codePointAt(0)!)).toBe(true); // 0x1F389
      expect(isValidXml10CodePoint(0x10ffff)).toBe(true);
    });

    it('disallows XML 1.0 disallowed C0 control characters', () => {
      const disallowedControls = [
        0x00, // NUL
        0x01, // SOH
        0x02, // STX
        0x03, // ETX
        0x04, // EOT
        0x05, // ENQ
        0x06, // ACK
        0x07, // BEL
        0x08, // BS
        0x0b, // VT
        0x0c, // FF
        0x0e, // SO
        0x0f, // SI
        0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b,
        0x1c, 0x1d, 0x1e, 0x1f,
      ];

      for (const cp of disallowedControls) {
        expect(isValidXml10CodePoint(cp)).toBe(false);
      }
    });

    it('disallows lone surrogates (#xD800-#xDFFF)', () => {
      expect(isValidXml10CodePoint(0xd800)).toBe(false);
      expect(isValidXml10CodePoint(0xdbff)).toBe(false);
      expect(isValidXml10CodePoint(0xdc00)).toBe(false);
      expect(isValidXml10CodePoint(0xdfff)).toBe(false);
    });

    it('disallows noncharacters (#xFFFE and #xFFFF)', () => {
      expect(isValidXml10CodePoint(0xfffe)).toBe(false);
      expect(isValidXml10CodePoint(0xffff)).toBe(false);
    });

    it('disallows code points beyond Unicode maximum (#x10FFFF)', () => {
      expect(isValidXml10CodePoint(0x110000)).toBe(false);
      expect(isValidXml10CodePoint(0x200000)).toBe(false);
      expect(isValidXml10CodePoint(-1)).toBe(false);
    });
  });

  describe('sanitizeXml10', () => {
    it('strips disallowed control characters and noncharacters', () => {
      const input = 'A\u0000B\u0007C\u0008D\u000bE\u000cF\u000eG\u001fH\ufffeI\uffffJ';
      expect(sanitizeXml10(input)).toBe('ABCDEFGHIJ');
    });

    it('preserves allowed whitespace: TAB, LF, CR, space', () => {
      const input = '\tLine 1\n\rLine 2   with spaces\t';
      expect(sanitizeXml10(input)).toBe('\tLine 1\n\rLine 2   with spaces\t');
    });

    it('preserves Polish diacritics', () => {
      const input = 'Zażółć gęślą jaźń ZAŻÓŁĆ GĘŚLĄ JAŹŃ';
      expect(sanitizeXml10(input)).toBe('Zażółć gęślą jaźń ZAŻÓŁĆ GĘŚLĄ JAŹŃ');
    });

    it('preserves emoji surrogate pairs', () => {
      const input = 'Deploy 🚀 and celebrate 🎉! Status: ✅ Smile: 😀';
      expect(sanitizeXml10(input)).toBe('Deploy 🚀 and celebrate 🎉! Status: ✅ Smile: 😀');
    });

    it('strips lone surrogates without damaging adjacent characters', () => {
      const input = 'Before\uD800Middle\uDFFFAfter';
      expect(sanitizeXml10(input)).toBe('BeforeMiddleAfter');
    });

    it('handles empty string and clean strings without mutation', () => {
      expect(sanitizeXml10('')).toBe('');
      expect(sanitizeXml10('Simple plain ASCII 123')).toBe('Simple plain ASCII 123');
    });
  });

  describe('escapeXml', () => {
    it('returns empty string for null and undefined', () => {
      expect(escapeXml(null)).toBe('');
      expect(escapeXml(undefined)).toBe('');
    });

    it('stringifies numbers and booleans correctly', () => {
      expect(escapeXml(12345)).toBe('12345');
      expect(escapeXml(0)).toBe('0');
      expect(escapeXml(true)).toBe('true');
      expect(escapeXml(false)).toBe('false');
    });

    it('escapes all five XML 1.0 predefined metacharacters', () => {
      expect(escapeXml('&')).toBe('&amp;');
      expect(escapeXml('<')).toBe('&lt;');
      expect(escapeXml('>')).toBe('&gt;');
      expect(escapeXml('"')).toBe('&quot;');
      expect(escapeXml("'")).toBe('&apos;');
    });

    it('correctly escapes combined XML markup string', () => {
      const input = '<item id="42" name=\'Alpha & Omega\'>Fast > Slow & "Good"</item>';
      expect(escapeXml(input)).toBe(
        '&lt;item id=&quot;42&quot; name=&apos;Alpha &amp; Omega&apos;&gt;Fast &gt; Slow &amp; &quot;Good&quot;&lt;/item&gt;'
      );
    });

    it('sanitizes disallowed XML 1.0 characters before escaping', () => {
      const dirty = '<task\u0000 note="Report \u0007 & summary \ufffe">Zażółć \ud83d\ude80 & Enjoy!</task>';
      expect(escapeXml(dirty)).toBe(
        '&lt;task note=&quot;Report  &amp; summary &quot;&gt;Zażółć 🚀 &amp; Enjoy!&lt;/task&gt;'
      );
    });
  });
});
