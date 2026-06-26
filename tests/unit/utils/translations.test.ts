import { describe, it, expect } from 'vitest';
import { translate, dictionaries } from '@common/i18n/i18n';

describe('Unit Tests: Translations', () => {
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

    it('should_interpolate_mustache_placeholders_with_vars', () => {
      const customDict = { common: { welcome: 'Witaj {{name}}! Masz {{count}} wiadomości.' } };
      const val = translate('custom', 'common.welcome', customDict, { name: 'Jan', count: 3 });
      expect(val).toBe('Witaj Jan! Masz 3 wiadomości.');
    });

    it('should_keep_placeholder_if_variable_not_provided', () => {
      const customDict = { common: { welcome: 'Witaj {{name}}!' } };
      const val = translate('custom', 'common.welcome', customDict, {});
      expect(val).toBe('Witaj {{name}}!');
    });
  });
});
