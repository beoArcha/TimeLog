import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocaleProvider, useLocale } from '@common/hooks/LocaleProvider';
import { setupLocalStorageMock } from '../../shared/test-helpers';
import { STORAGE_KEYS } from '../../../src/common/constants';

describe('Unit Tests: LocaleProvider & useLocale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupLocalStorageMock();
    vi.spyOn(console, 'warn').mockImplementation(() => { });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should_throw_error_when_useLocale_is_used_outside_provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    expect(() => renderHook(() => useLocale())).toThrow('useLocale must be used within LocaleProvider');
    consoleSpy.mockRestore();
  });

  it('should_load_saved_locale_pref_and_translations_when_initialized', () => {
    localStorage.setItem(STORAGE_KEYS.LOCALE_PREF, 'pl');
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TRANSLATIONS, JSON.stringify({ app: { title: 'Mój Tytuł' } }));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LocaleProvider>{children}</LocaleProvider>
    );

    const { result } = renderHook(() => useLocale(), { wrapper });

    expect(result.current.localePref).toBe('pl');
    expect(result.current.locale).toBe('pl');
    expect(result.current.customTranslations).toEqual({ app: { title: 'Mój Tytuł' } });
  });

  it('should_fallback_to_empty_translations_on_invalid_json_in_localStorage', () => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TRANSLATIONS, '{invalidjson');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LocaleProvider>{children}</LocaleProvider>
    );

    const { result } = renderHook(() => useLocale(), { wrapper });

    expect(result.current.customTranslations).toEqual({});
    expect(console.warn).toHaveBeenCalled();
  });

  it('should_detect_browser_languages_correctly_when_localePref_is_system', () => {
    const testCases = [
      { language: 'pl-PL', expected: 'pl' },
      { language: 'de-DE', expected: 'de' },
      { language: 'es-ES', expected: 'es' },
      { language: 'pt-BR', expected: 'pt-br' },
      { language: 'fr-FR', expected: 'fr' },
      { language: 'ja-JP', expected: 'en' },
    ];

    for (const tc of testCases) {
      const languageSpy = vi.spyOn(navigator, 'language', 'get').mockReturnValue(tc.language);
      localStorage.setItem(STORAGE_KEYS.LOCALE_PREF, 'system');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LocaleProvider>{children}</LocaleProvider>
      );

      const { result } = renderHook(() => useLocale(), { wrapper });
      expect(result.current.locale).toBe(tc.expected);

      languageSpy.mockRestore();
    }
  });

  it('should_update_localStorage_and_state_when_localePref_changes', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LocaleProvider>{children}</LocaleProvider>
    );

    const { result } = renderHook(() => useLocale(), { wrapper });

    act(() => {
      result.current.setLocalePref('de');
    });

    expect(result.current.localePref).toBe('de');
    expect(result.current.locale).toBe('de');
    expect(localStorage.getItem(STORAGE_KEYS.LOCALE_PREF)).toBe('de');
  });

  it('should_update_localStorage_when_locale_changes', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LocaleProvider>{children}</LocaleProvider>
    );

    const { result } = renderHook(() => useLocale(), { wrapper });

    act(() => {
      result.current.setLocale('fr');
    });

    expect(result.current.locale).toBe('fr');
    expect(localStorage.getItem(STORAGE_KEYS.LOCALE)).toBe('fr');
  });

  it('should_update_localStorage_when_customTranslations_changes', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LocaleProvider>{children}</LocaleProvider>
    );

    const { result } = renderHook(() => useLocale(), { wrapper });

    const newTranslations = { app: { title: 'New Title' } };

    act(() => {
      result.current.setCustomTranslations(newTranslations);
    });

    expect(result.current.customTranslations).toEqual(newTranslations);
    expect(localStorage.getItem(STORAGE_KEYS.CUSTOM_TRANSLATIONS)).toBe(JSON.stringify(newTranslations));
  });
});
