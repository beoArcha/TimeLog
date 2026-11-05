// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SettingsTab from '@features/settings/SettingsTab';
import { LocaleProvider, useLocale } from '@common/hooks/LocaleProvider';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { setupMatchMediaMock } from '@tests/shared/test-helpers';
import { STANDARD_LOCALES, LOCALE_METADATA } from '@common/i18n/locales';

describe('Integration Tests: Language Selection Experience & Modal Integration', () => {
  let originalNavigatorLanguage: string;
  const router = PersistenceRouter.getInstance();

  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
    originalNavigatorLanguage = navigator.language;

    vi.spyOn(router.locale, 'getLocalePref').mockResolvedValue('system');
    vi.spyOn(router.locale, 'getLocale').mockResolvedValue('en');
    vi.spyOn(router.locale, 'getCustomTranslations').mockResolvedValue({});
    vi.spyOn(router.locale, 'saveLocalePref').mockResolvedValue();
    vi.spyOn(router.locale, 'saveLocale').mockResolvedValue();
    vi.spyOn(router.locale, 'saveCustomTranslations').mockResolvedValue();
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(navigator, 'language', {
      value: originalNavigatorLanguage,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe('When viewing SettingsTab with LanguageSettingsCard', () => {
    it('Then it should display the current language and all 10 quick-select locales plus system', () => {
      render(
        <MockProviders
          localeState={{
            localePref: 'en',
            locale: 'en',
            setLocalePref: vi.fn(),
            customTranslations: {},
          }}
        >
          <SettingsTab />
        </MockProviders>
      );

      // Verify that Quick Selection header exists
      expect(screen.getByText('Quick Language Selection')).toBeTruthy();

      // Verify quick buttons for system and all 10 locales
      expect(screen.getByTestId('quick-lang-system')).toBeTruthy();
      for (const code of STANDARD_LOCALES) {
        const btn = screen.getByTestId(`quick-lang-${code}`);
        expect(btn).toBeTruthy();
        expect(btn.textContent).toContain(LOCALE_METADATA[code].nativeName);
      }
    });

    it('Then clicking a quick-select locale button updates locale preference immediately', () => {
      const setLocalePrefMock = vi.fn();

      render(
        <MockProviders
          localeState={{
            localePref: 'en',
            locale: 'en',
            setLocalePref: setLocalePrefMock,
            customTranslations: {},
          }}
        >
          <SettingsTab />
        </MockProviders>
      );

      // Click Japanese quick select
      fireEvent.click(screen.getByTestId('quick-lang-ja'));
      expect(setLocalePrefMock).toHaveBeenCalledWith('ja');

      // Click Ukrainian quick select
      fireEvent.click(screen.getByTestId('quick-lang-uk'));
      expect(setLocalePrefMock).toHaveBeenCalledWith('uk');

      // Click System quick select
      fireEvent.click(screen.getByTestId('quick-lang-system'));
      expect(setLocalePrefMock).toHaveBeenCalledWith('system');
    });

    it('Then it displays the active system resolution when system locale is selected', () => {
      render(
        <MockProviders
          localeState={{
            localePref: 'system',
            locale: 'pl',
            setLocalePref: vi.fn(),
            customTranslations: {},
          }}
        >
          <SettingsTab />
        </MockProviders>
      );

      // Active system resolution should show Polski (pl)
      expect(screen.getByText(/Active system resolution:/i)).toBeTruthy();
      expect(screen.getByText(/Polski \(pl\)/i)).toBeTruthy();
    });
  });

  describe('When interacting with LanguageSelectionModal', () => {
    it('Then clicking the modal trigger button opens an accessible dialog with all native language names', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'de-DE',
        configurable: true,
      });

      render(
        <MockProviders
          localeState={{
            localePref: 'system',
            locale: 'de',
            setLocalePref: vi.fn(),
            customTranslations: {},
          }}
        >
          <SettingsTab />
        </MockProviders>
      );

      // Open the modal
      const openBtn = screen.getByTestId('open-language-modal-btn');
      fireEvent.click(openBtn);

      // Dialog should be rendered with role="dialog" and aria-label
      const modal = screen.getByTestId('language-selection-modal');
      expect(modal).toBeTruthy();
      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-label')).toBe('Language selection');

      // All 10 standard locales with native names must be listed in the modal
      for (const code of STANDARD_LOCALES) {
        const meta = LOCALE_METADATA[code];
        expect(screen.getByTestId(`modal-lang-${code}`)).toBeTruthy();
        expect(screen.getAllByText(meta.nativeName).length).toBeGreaterThanOrEqual(1);
      }

      // System default option shows active resolution
      expect(screen.getByTestId('modal-lang-system')).toBeTruthy();
      expect(screen.getByText(/Resolved: Deutsch \(de\)/i)).toBeTruthy();
    });

    it('Then system default card displays actual operating system locale when localePref is explicitly set to de', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'pl-PL',
        configurable: true,
      });

      render(
        <MockProviders
          localeState={{
            localePref: 'de',
            locale: 'de',
            setLocalePref: vi.fn(),
            customTranslations: {},
          }}
        >
          <SettingsTab />
        </MockProviders>
      );

      // Open the modal
      fireEvent.click(screen.getByTestId('open-language-modal-btn'));

      // Even though localePref is 'de', System default must show Polski (pl) resolved from navigator.language
      expect(screen.getByTestId('modal-lang-system')).toBeTruthy();
      expect(screen.getByText(/Resolved: Polski \(pl\)/i)).toBeTruthy();
    });

    it('Then selecting a language and confirming persists the selection and closes modal', () => {
      const setLocalePrefMock = vi.fn();

      render(
        <MockProviders
          localeState={{
            localePref: 'en',
            locale: 'en',
            setLocalePref: setLocalePrefMock,
            customTranslations: {},
          }}
        >
          <SettingsTab />
        </MockProviders>
      );

      // Open modal
      fireEvent.click(screen.getByTestId('open-language-modal-btn'));

      // Select Italian in modal
      const itRadio = screen.getByTestId('modal-lang-it');
      fireEvent.click(itRadio);

      // Confirm
      const confirmBtn = screen.getByTestId('modal-confirm-btn');
      fireEvent.click(confirmBtn);

      expect(setLocalePrefMock).toHaveBeenCalledWith('it');
      expect(screen.queryByTestId('language-selection-modal')).toBeNull();
    });

    it('Then clicking cancel discards pending changes without updating preference', () => {
      const setLocalePrefMock = vi.fn();

      render(
        <MockProviders
          localeState={{
            localePref: 'en',
            locale: 'en',
            setLocalePref: setLocalePrefMock,
            customTranslations: {},
          }}
        >
          <SettingsTab />
        </MockProviders>
      );

      // Open modal
      fireEvent.click(screen.getByTestId('open-language-modal-btn'));

      // Select Japanese
      fireEvent.click(screen.getByTestId('modal-lang-ja'));

      // Cancel
      const cancelBtn = screen.getByTestId('modal-cancel-btn');
      fireEvent.click(cancelBtn);

      expect(setLocalePrefMock).not.toHaveBeenCalled();
      expect(screen.queryByTestId('language-selection-modal')).toBeNull();
    });
  });

  describe('When configuring custom translation overrides', () => {
    it('Then user can add and remove custom translations overrides', () => {
      const setCustomTranslationsMock = vi.fn();

      render(
        <MockProviders
          localeState={{
            localePref: 'en',
            locale: 'en',
            setLocalePref: vi.fn(),
            customTranslations: {
              common: { Save: 'Custom Save Text' },
            },
            setCustomTranslations: setCustomTranslationsMock,
          }}
        >
          <SettingsTab />
        </MockProviders>
      );

      // Existing override is rendered
      expect(screen.getByText('common.Save')).toBeTruthy();
      expect(screen.getByText('"Custom Save Text"')).toBeTruthy();

      // Enter new override
      const keyInput = screen.getByTestId('override-key-input');
      const valueInput = screen.getByTestId('override-value-input');

      fireEvent.change(keyInput, { target: { value: 'Title' } });
      fireEvent.change(valueInput, { target: { value: 'My Custom Title' } });

      fireEvent.click(screen.getByTestId('save-custom-override-btn'));
      expect(setCustomTranslationsMock).toHaveBeenCalled();

      // Test remove button
      const removeBtn = screen.getByTestId('remove-override-common-Save');
      fireEvent.click(removeBtn);
      expect(setCustomTranslationsMock).toHaveBeenCalled();
    });

    it('Then it rejects empty key or empty value with a clear validation error', () => {
      const setCustomTranslationsMock = vi.fn();

      render(
        <MockProviders
          localeState={{
            localePref: 'en',
            locale: 'en',
            setLocalePref: vi.fn(),
            customTranslations: {},
            setCustomTranslations: setCustomTranslationsMock,
          }}
        >
          <SettingsTab />
        </MockProviders>
      );

      // Attempt to save with empty key and value
      fireEvent.click(screen.getByTestId('save-custom-override-btn'));
      expect(setCustomTranslationsMock).not.toHaveBeenCalled();
      expect(screen.getByTestId('custom-override-validation-error')).toBeTruthy();
      expect(screen.getByText('Translation key cannot be empty')).toBeTruthy();

      // Enter key but leave value empty
      const keyInput = screen.getByTestId('override-key-input');
      fireEvent.change(keyInput, { target: { value: 'Save' } });
      fireEvent.click(screen.getByTestId('save-custom-override-btn'));
      expect(setCustomTranslationsMock).not.toHaveBeenCalled();
      expect(screen.getByText('Translation value cannot be empty')).toBeTruthy();

      // Enter value and save
      const valueInput = screen.getByTestId('override-value-input');
      fireEvent.change(valueInput, { target: { value: 'Zapisz' } });
      fireEvent.click(screen.getByTestId('save-custom-override-btn'));
      expect(setCustomTranslationsMock).toHaveBeenCalled();
      expect(screen.queryByTestId('custom-override-validation-error')).toBeNull();
    });

    it('Then user can select domain from the domain select dropdown', () => {
      render(
        <MockProviders
          localeState={{
            localePref: 'en',
            locale: 'en',
            setLocalePref: vi.fn(),
            customTranslations: {},
          }}
        >
          <SettingsTab />
        </MockProviders>
      );

      // Verify domain select trigger exists with initial default 'common'
      const trigger = screen.getByTestId('override-domain-select');
      expect(trigger).toBeTruthy();
      expect(trigger.textContent).toContain('common');
    });
  });


  describe('When running with real LocaleProvider and PersistenceRouter', () => {
    it('Then selecting a new locale persists preference across restarts', async () => {
      // Set initial persistence to German
      vi.spyOn(router.locale, 'getLocalePref').mockResolvedValue('de');
      vi.spyOn(router.locale, 'getLocale').mockResolvedValue('de');

      // Test Component consuming LocaleProvider
      function TestSettingsConsumer() {
        const { localePref, setLocalePref, locale } = useLocale();
        return (
          <div>
            <span data-testid="active-pref">{localePref}</span>
            <span data-testid="active-locale">{locale}</span>
            <button
              data-testid="switch-to-ja"
              onClick={() => setLocalePref('ja')}
            >
              Switch to JA
            </button>
          </div>
        );
      }

      render(
        <LocaleProvider>
          <TestSettingsConsumer />
        </LocaleProvider>
      );

      // Wait for persistence to hydrate initial German preference
      await waitFor(() => {
        expect(screen.getByTestId('active-pref').textContent).toBe('de');
        expect(screen.getByTestId('active-locale').textContent).toBe('de');
      });

      // Switch to Japanese
      fireEvent.click(screen.getByTestId('switch-to-ja'));

      // Verify that persistence router is called to save both preference and resolved locale
      await waitFor(() => {
        expect(router.locale.saveLocalePref).toHaveBeenCalledWith('ja');
        expect(router.locale.saveLocale).toHaveBeenCalledWith('ja');
        expect(screen.getByTestId('active-pref').textContent).toBe('ja');
        expect(screen.getByTestId('active-locale').textContent).toBe('ja');
      });
    });
  });
});
