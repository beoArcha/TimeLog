import { describe, it, expect } from 'vitest';
import {
  resolveProjectColor,
  isValidHexColor,
  normalizeHexColor,
  isPaletteColor,
} from '@common/utils/colorUtils';
import { PROJECT_COLORS, DEFAULT_PROJECT_COLOR, DEFAULT_PROJECT_COLOR_HEX } from '@common/constants/projectColors';

describe('colorUtils', () => {
  describe('resolveProjectColor', () => {
    it.each([
      ['rose', 'bg-rose-500', 'border-rose-500', 'text-rose-500', '#f43f5e'],
      ['teal', 'bg-teal-500', 'border-teal-500', 'text-teal-500', '#14b8a6'],
      ['amber', 'bg-amber-500', 'border-amber-500', 'text-amber-500', '#f59e0b'],
      ['violet', 'bg-violet-500', 'border-violet-500', 'text-violet-500', '#8b5cf6'],
      ['indigo', 'bg-indigo-500', 'border-indigo-500', 'text-indigo-500', '#6366f1'],
      ['emerald', 'bg-emerald-500', 'border-emerald-500', 'text-emerald-500', '#10b981'],
    ])('should resolve palette color "%s" with Tailwind classes and empty style', (name, bg, border, text, hex) => {
      const result = resolveProjectColor(name);

      expect(result.isHex).toBe(false);
      expect(result.color).toBe(name);
      expect(result.bgClass).toBe(bg);
      expect(result.borderClass).toBe(border);
      expect(result.textClass).toBe(text);
      expect(result.hex).toBe(hex);
      expect(result.style).toEqual({});
      expect(result.bgStyle).toEqual({});
      expect(result.borderStyle).toEqual({});
      expect(result.textStyle).toEqual({});
    });

    it('should be case-insensitive for palette colors', () => {
      const result = resolveProjectColor('TEAL');

      expect(result.isHex).toBe(false);
      expect(result.color).toBe('teal');
      expect(result.bgClass).toBe('bg-teal-500');
      expect(result.hex).toBe('#14b8a6');
    });

    it('should resolve standard 6-character HEX colors with inline styles', () => {
      const hex = '#3b82f6';
      const result = resolveProjectColor(hex);

      expect(result.isHex).toBe(true);
      expect(result.color).toBe(hex);
      expect(result.hex).toBe('#3b82f6');
      expect(result.bgClass).toBe('');
      expect(result.borderClass).toBe('');
      expect(result.textClass).toBe('');
      expect(result.style).toEqual({
        backgroundColor: hex,
        borderColor: hex,
        color: hex,
      });
      expect(result.bgStyle).toEqual({ backgroundColor: hex });
      expect(result.borderStyle).toEqual({ borderColor: hex });
      expect(result.textStyle).toEqual({ color: hex });
    });

    it('should resolve 3-character HEX colors and normalize hex value', () => {
      const hex = '#f40';
      const result = resolveProjectColor(hex);

      expect(result.isHex).toBe(true);
      expect(result.color).toBe(hex);
      expect(result.hex).toBe('#ff4400');
      expect(result.bgClass).toBe('');
      expect(result.bgStyle).toEqual({ backgroundColor: hex });
    });

    it('should handle uppercase 6-character HEX colors without fallback to rose', () => {
      const hex = '#FF4400';
      const result = resolveProjectColor(hex);

      expect(result.isHex).toBe(true);
      expect(result.color).toBe(hex);
      expect(result.hex).toBe('#ff4400');
      expect(result.color).not.toBe('rose');
      expect(result.bgClass).not.toBe('bg-rose-500');
    });

    it('should never cast any valid HEX color to default rose', () => {
      const sampleHexes = ['#000000', '#ffffff', '#123456', '#abcdef', '#123', '#fff'];
      sampleHexes.forEach((hex) => {
        const result = resolveProjectColor(hex);
        expect(result.isHex).toBe(true);
        expect(result.color).toBe(hex);
        expect(result.color).not.toBe(DEFAULT_PROJECT_COLOR);
      });
    });

    it.each([
      ['empty string', ''],
      ['whitespace only', '   '],
      ['null', null as unknown as string],
      ['undefined', undefined as unknown as string],
      ['unknown name', 'nonexistent-color'],
      ['2-char hex', '#12'],
      ['4-char hex', '#1234'],
      ['5-char hex', '#12345'],
      ['7-char hex without alpha', '#1234567'],
      ['missing hash', '3b82f6'],
      ['invalid hex chars', '#gggggg'],
    ])('should fallback to default rose when color is %s', (_, invalidColor) => {
      const result = resolveProjectColor(invalidColor);

      expect(result.isHex).toBe(false);
      expect(result.color).toBe(DEFAULT_PROJECT_COLOR);
      expect(result.hex).toBe(DEFAULT_PROJECT_COLOR_HEX);
      expect(result.bgClass).toBe('bg-rose-500');
      expect(result.borderClass).toBe('border-rose-500');
      expect(result.textClass).toBe('text-rose-500');
      expect(result.style).toEqual({});
    });
  });

  describe('isValidHexColor', () => {
    it('should return true for valid 3-char and 6-char HEX strings', () => {
      expect(isValidHexColor('#abc')).toBe(true);
      expect(isValidHexColor('#ABC')).toBe(true);
      expect(isValidHexColor('#3b82f6')).toBe(true);
      expect(isValidHexColor('#AABBCC')).toBe(true);
      expect(isValidHexColor('  #123456  ')).toBe(true);
    });

    it('should return false for invalid HEX strings or non-hex input', () => {
      expect(isValidHexColor('')).toBe(false);
      expect(isValidHexColor(null)).toBe(false);
      expect(isValidHexColor(undefined)).toBe(false);
      expect(isValidHexColor('violet')).toBe(false);
      expect(isValidHexColor('123456')).toBe(false);
      expect(isValidHexColor('#12')).toBe(false);
      expect(isValidHexColor('#12345')).toBe(false);
      expect(isValidHexColor('#1234567')).toBe(false);
      expect(isValidHexColor('#zzzzzz')).toBe(false);
    });
  });

  describe('normalizeHexColor', () => {
    it('should expand 3-character hex to 6-character hex and lowercase', () => {
      expect(normalizeHexColor('#abc')).toBe('#aabbcc');
      expect(normalizeHexColor('#F40')).toBe('#ff4400');
    });

    it('should lowercase 6-character hex', () => {
      expect(normalizeHexColor('#3B82F6')).toBe('#3b82f6');
    });

    it('should return default project color hex when invalid', () => {
      expect(normalizeHexColor('invalid')).toBe(DEFAULT_PROJECT_COLOR_HEX);
      expect(normalizeHexColor('')).toBe(DEFAULT_PROJECT_COLOR_HEX);
    });
  });

  describe('isPaletteColor', () => {
    it('should return true for all defined PROJECT_COLORS names', () => {
      PROJECT_COLORS.forEach((c) => {
        expect(isPaletteColor(c.name)).toBe(true);
        expect(isPaletteColor(c.name.toUpperCase())).toBe(true);
      });
    });

    it('should return false for hex colors and unknown names', () => {
      expect(isPaletteColor('#3b82f6')).toBe(false);
      expect(isPaletteColor('custom')).toBe(false);
      expect(isPaletteColor('')).toBe(false);
      expect(isPaletteColor(null)).toBe(false);
    });
  });
});
