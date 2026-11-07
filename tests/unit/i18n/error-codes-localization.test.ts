import { describe, it, expect } from 'vitest';
import { translate, dictionaries } from '@common/i18n/translator';
import { STANDARD_LOCALES } from '@common/i18n/locales';
import { ENGINE_ERROR_CODES } from '@common/engine/errorCodes';

describe('Error Codes Localization in i18n Dictionaries', () => {
  const codes = [
    ENGINE_ERROR_CODES.AUDIT_REASON_REQUIRED,
    ENGINE_ERROR_CODES.AUDIT_SOURCE_INVALID,
    ENGINE_ERROR_CODES.TIMELOG_INVALID_RANGE,
  ] as const;

  it('should have all 10 standard locales defined', () => {
    expect(STANDARD_LOCALES).toHaveLength(10);
    expect(STANDARD_LOCALES).toEqual([
      'en',
      'pl',
      'de',
      'es',
      'pt-br',
      'fr',
      'uk',
      'ja',
      'nl',
      'it',
    ]);
  });

  describe('common domain dictionary', () => {
    STANDARD_LOCALES.forEach((locale) => {
      it(`should contain non-empty translations for all error codes in [${locale}]`, () => {
        const dict = dictionaries['common'][locale];
        expect(dict, `Dictionary for [${locale}] must be defined`).toBeDefined();

        codes.forEach((code) => {
          const translation = dict[code];
          expect(translation, `Key ${code} in [${locale}] must be defined`).toBeDefined();
          expect(typeof translation).toBe('string');
          expect(translation.trim().length, `Key ${code} in [${locale}] must not be empty`).toBeGreaterThan(0);
          expect(translation, `Key ${code} in [${locale}] should not be the key name itself`).not.toBe(code);
        });
      });

      it(`should successfully resolve via translate() for [${locale}]`, () => {
        codes.forEach((code) => {
          const resolved = translate(locale, 'common', code);
          expect(resolved).toBeDefined();
          expect(resolved.trim().length).toBeGreaterThan(0);
          expect(resolved).not.toBe(code);
        });
      });
    });
  });

  describe('report domain dictionary', () => {
    STANDARD_LOCALES.forEach((locale) => {
      it(`should also contain non-empty translations for error codes in [${locale}]`, () => {
        const dict = dictionaries['report'][locale];
        expect(dict, `Report dictionary for [${locale}] must be defined`).toBeDefined();

        codes.forEach((code) => {
          const translation = dict[code];
          expect(translation, `Key ${code} in report [${locale}] must be defined`).toBeDefined();
          expect(translation.trim().length).toBeGreaterThan(0);
        });
      });
    });
  });

  it('should provide localized Polish and English messages matching spec', () => {
    expect(translate('en', 'common', 'ERR_AUDIT_REASON_REQUIRED')).toBe(
      'Audit reason is required for manual edits'
    );
    expect(translate('pl', 'common', 'ERR_AUDIT_REASON_REQUIRED')).toBe(
      'Powód audytu jest wymagany przy ręcznej edycji'
    );

    expect(translate('en', 'common', 'ERR_TIMELOG_INVALID_RANGE')).toBe(
      'End time cannot be before start time'
    );
    expect(translate('pl', 'common', 'ERR_TIMELOG_INVALID_RANGE')).toBe(
      'Czas zakończenia nie może być wcześniejszy niż czas rozpoczęcia'
    );

    expect(translate('en', 'common', 'ERR_AUDIT_SOURCE_INVALID')).toBe('Invalid audit source');
    expect(translate('pl', 'common', 'ERR_AUDIT_SOURCE_INVALID')).toBe('Nieprawidłowe źródło audytu');
  });
});
