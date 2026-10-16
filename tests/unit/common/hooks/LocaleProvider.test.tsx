import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  LocaleProvider,
  useLocale,
  useSafeLocale,
} from '@common/hooks/LocaleProvider';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { ContextException } from '@common/exceptions';

describe('LocaleProvider & useLocale', () => {
  const router = PersistenceRouter.getInstance();

  let originalNavigatorLanguage: string;

  beforeEach(() => {
    vi.clearAllMocks();
    originalNavigatorLanguage = navigator.language;
    vi.spyOn(router.locale, 'getLocalePref').mockResolvedValue('system');
    vi.spyOn(router.locale, 'getLocale').mockResolvedValue('en');
    vi.spyOn(router.locale, 'getCustomTranslations').mockResolvedValue({});
    vi.spyOn(router.locale, 'saveLocalePref').mockResolvedValue();
    vi.spyOn(router.locale, 'saveLocale').mockResolvedValue();
    vi.spyOn(router.locale, 'saveCustomTranslations').mockResolvedValue();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'language', {
      value: originalNavigatorLanguage,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  const mockSystemLanguage = (lang: string) => {
    Object.defineProperty(navigator, 'language', {
      value: lang,
      configurable: true,
    });
  };

  it('should throw ContextException when useLocale is called outside LocaleProvider', () => {
    // Arrange & Act & Assert
    expect(() => renderHook(() => useLocale())).toThrow(ContextException);
  });

  it('should return default fallback object when useSafeLocale is called outside LocaleProvider', () => {
    // Arrange & Act
    const { result } = renderHook(() => useSafeLocale());

    // Assert
    expect(result.current.locale).toBe('en');
    expect(result.current.localePref).toBe('en');
    expect(result.current.customTranslations).toEqual({});
  });

  it('should resolve system locale correctly for all supported language prefixes', async () => {
    // Arrange
    const testCases: Array<[string, string]> = [
      ['pl-PL', 'pl'],
      ['de-DE', 'de'],
      ['es-ES', 'es'],
      ['pt-BR', 'pt-br'],
      ['fr-FR', 'fr'],
      ['it-IT', 'en'], // unsupported falls back to 'en'
    ];

    for (const [browserLang, expectedLocale] of testCases) {
      mockSystemLanguage(browserLang);

      // Act
      const { result } = renderHook(() => useLocale(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <LocaleProvider>{children}</LocaleProvider>
        ),
      });

      await waitFor(() => expect(result.current.locale).toBe(expectedLocale));
    }
  });

  it('should load initial locale preferences from persistence router on mount', async () => {
    // Arrange
    vi.spyOn(router.locale, 'getLocalePref').mockResolvedValue('de');
    vi.spyOn(router.locale, 'getCustomTranslations').mockResolvedValue({
      common: { Save: 'Speichern' },
    });

    // Act
    const { result } = renderHook(() => useLocale(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <LocaleProvider>{children}</LocaleProvider>
      ),
    });

    // Assert
    await waitFor(() => expect(result.current.localePref).toBe('de'));
    expect(result.current.locale).toBe('de');
    expect(result.current.customTranslations).toEqual({
      common: { Save: 'Speichern' },
    });
  });

  it('should persist changed locale preference via persistence router', async () => {
    // Arrange
    const { result } = renderHook(() => useLocale(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <LocaleProvider>{children}</LocaleProvider>
      ),
    });

    await waitFor(() => expect(result.current.localePref).toBe('system'));

    // Act
    act(() => {
      result.current.setLocalePref('es');
    });

    // Assert
    await waitFor(() => {
      expect(router.locale.saveLocalePref).toHaveBeenCalledWith('es');
      expect(router.locale.saveLocale).toHaveBeenCalledWith('es');
    });
    expect(result.current.locale).toBe('es');
  });

  it('should support manual locale override with functional updater', async () => {
    // Arrange
    const { result } = renderHook(() => useLocale(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <LocaleProvider>{children}</LocaleProvider>
      ),
    });

    await waitFor(() => expect(result.current.localePref).toBe('system'));

    // Act
    act(() => {
      result.current.setLocale((_prev) => 'fr');
    });

    // Assert
    await waitFor(() => expect(result.current.locale).toBe('fr'));
    expect(router.locale.saveLocale).toHaveBeenCalledWith('fr');
  });

  it('should persist custom translations when updated', async () => {
    // Arrange
    const { result } = renderHook(() => useLocale(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <LocaleProvider>{children}</LocaleProvider>
      ),
    });

    await waitFor(() => expect(result.current.localePref).toBe('system'));

    const customDict = { common: { Save: 'Zapisz teraz' } };

    // Act
    act(() => {
      result.current.setCustomTranslations(customDict);
    });

    // Assert
    await waitFor(() => {
      expect(router.locale.saveCustomTranslations).toHaveBeenCalledWith(customDict);
    });
    expect(result.current.customTranslations).toEqual(customDict);
  });
});
