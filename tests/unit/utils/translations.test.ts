import { describe, it, expect } from 'vitest';
import { getTranslation, defaultTranslations } from '../../../src/utils/translations';

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
});
