import { describe, it, expect } from 'vitest';
import { getTranslation, defaultTranslations } from '@core/i18n/translations';
import { translate, dictionaries } from '@core/i18n/i18n';

describe('Unit Tests: Translations', () => {
  it('should_return_correct_translation_value_from_Polish_locale_when_guiInterface_is_requested', () => {
    const val = getTranslation('pl', 'guiInterface');
    expect(val).toBe('Interfejs GUI');
  });

  it('should_fallback_to_English_when_missing_custom_keys_or_custom_parameters_are_absent', () => {
    const val = getTranslation('custom', 'guiInterface', {});
    expect(val).toBe(defaultTranslations['en']['guiInterface']);
  });

  it('should_correctly_prioritize_custom_overrides_when_provided_custom_locale_state', () => {
    const overrides = { guiInterface: 'Moje wspaniałe GUI' };
    const val = getTranslation('custom', 'guiInterface', overrides);
    expect(val).toBe('Moje wspaniałe GUI');
  });

  it('should_return_custom_translation_or_fallback_value_when_using_getTranslation', () => {
    const locale = 'custom';
    const customDict = {
      activeTracker: 'Mój Aktywny Czas'
    };
    
    const translation = getTranslation(locale, 'activeTracker', customDict);
    expect(translation).toBe('Mój Aktywny Czas');
    
    const fallback = getTranslation('fr' as any, 'missing_key' as any);
    expect(fallback).toBeUndefined();
  });

  describe('translate function', () => {
    it('should_return_correct_translation_for_nested_key', () => {
      const val = translate('pl', 'common.cancel');
      expect(val).toBe('Anuluj');
    });

    it('should_return_custom_translation_when_locale_is_custom_and_customDict_is_provided', () => {
      const customDict = { common: { cancel: 'Zaniechaj' } };
      const val = translate('custom', 'common.cancel', customDict);
      expect(val).toBe('Zaniechaj');
    });

    it('should_fallback_to_english_when_custom_dict_does_not_contain_key', () => {
      const customDict = { common: {} };
      const val = translate('custom', 'common.cancel', customDict);
      expect(val).toBe('Cancel');
    });

    it('should_fallback_to_english_when_requested_locale_is_missing_the_key', () => {
      // Temporarily delete a key from pl dictionary
      const originalCommon = (dictionaries.pl as any).common;
      const mockedCommon = { ...originalCommon };
      delete (mockedCommon as any).cancel;
      (dictionaries.pl as any).common = mockedCommon;

      try {
        const val = translate('pl', 'common.cancel');
        expect(val).toBe('Cancel'); // Falls back to English
      } finally {
        (dictionaries.pl as any).common = originalCommon;
      }
    });

    it('should_return_keyPath_when_key_is_missing_entirely', () => {
      const val = translate('en', 'common.nonexistent_key_path');
      expect(val).toBe('common.nonexistent_key_path');
    });

    it('should_break_lookup_loop_and_fallback_for_deeply_nested_missing_keys', () => {
      const val = translate('pl', 'common.nonexistent.deep.key');
      expect(val).toBe('common.nonexistent.deep.key');
    });
  });
});
