// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { LanguageSelector } from '@layouts/components/header-parts/LanguageSelector';
import { SUPPORTED_LOCALES, STANDARD_LOCALES } from '@common/i18n/locales';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import type { Locale } from '@bindings/Locale';

describe('Unit Tests: LanguageSelector', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('Given standard configuration, all 10 standard locales plus system are supported', () => {
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
    expect(SUPPORTED_LOCALES).toHaveLength(11);
    expect(SUPPORTED_LOCALES).toEqual([
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
      'system',
    ]);
  });


  describe('When layoutVariant is full (expanded desktop layout)', () => {
    it('Then it should render quick-selector buttons for all supported locales', () => {
      const setLocalePrefMock = vi.fn();

      render(
        <MockProviders
          settingsState={{ layoutVariant: 'full' }}
          localeState={{
            localePref: 'en',
            locale: 'en',
            setLocalePref: setLocalePrefMock,
          }}
        >
          <LanguageSelector />
        </MockProviders>
      );

      // Verify that all 11 locale buttons are present in the DOM
      for (const loc of SUPPORTED_LOCALES) {
        const btn = screen.getByTestId(`lang-btn-${loc}`);
        expect(btn).toBeTruthy();
      }
    });

    it('Then clicking a locale button should call setLocalePref with the target locale', () => {
      const setLocalePrefMock = vi.fn();

      render(
        <MockProviders
          settingsState={{ layoutVariant: 'full' }}
          localeState={{
            localePref: 'en',
            locale: 'en',
            setLocalePref: setLocalePrefMock,
          }}
        >
          <LanguageSelector />
        </MockProviders>
      );

      // Click Japanese button
      const jaBtn = screen.getByTestId('lang-btn-ja');
      fireEvent.click(jaBtn);
      expect(setLocalePrefMock).toHaveBeenCalledWith('ja');

      // Click Italian button
      const itBtn = screen.getByTestId('lang-btn-it');
      fireEvent.click(itBtn);
      expect(setLocalePrefMock).toHaveBeenCalledWith('it');

      // Click Dutch button
      const nlBtn = screen.getByTestId('lang-btn-nl');
      fireEvent.click(nlBtn);
      expect(setLocalePrefMock).toHaveBeenCalledWith('nl');

      // Click System button
      const sysBtn = screen.getByTestId('lang-btn-system');
      fireEvent.click(sysBtn);
      expect(setLocalePrefMock).toHaveBeenCalledWith('system');
    });

    it('Then it should render the custom button in SegmentedControl when localePref is custom', () => {
      render(
        <MockProviders
          settingsState={{ layoutVariant: 'full' }}
          localeState={{
            localePref: 'custom' as Locale,
            locale: 'en',
            setLocalePref: vi.fn(),
          }}
        >
          <LanguageSelector />
        </MockProviders>
      );

      const customBtn = screen.getByTestId('lang-btn-custom');
      expect(customBtn).toBeTruthy();
      expect(customBtn.textContent).toContain('CUSTOM');
    });
  });


  describe('When layoutVariant is compact or medium (compact viewports)', () => {
    it('Then it should render a clean dropdown Select trigger', () => {
      render(
        <MockProviders
          settingsState={{ layoutVariant: 'compact' }}
          localeState={{
            localePref: 'de',
            locale: 'de',
            setLocalePref: vi.fn(),
          }}
        >
          <LanguageSelector />
        </MockProviders>
      );

      const trigger = screen.getByTestId('lang-select-trigger');
      expect(trigger).toBeTruthy();
      expect(trigger.getAttribute('aria-label')).toBe('Language selection');
      expect(trigger.textContent).toContain('DE');
    });

    it('Then it should display SYSTEM when system preference is active', () => {
      render(
        <MockProviders
          settingsState={{ layoutVariant: 'medium' }}
          localeState={{
            localePref: 'system',
            locale: 'pl',
            setLocalePref: vi.fn(),
          }}
        >
          <LanguageSelector />
        </MockProviders>
      );

      const trigger = screen.getByTestId('lang-select-trigger');
      expect(trigger.textContent).toContain('SYSTEM');
    });

    it('Then it should support custom locale gracefully without crashing', () => {
      render(
        <MockProviders
          settingsState={{ layoutVariant: 'compact' }}
          localeState={{
            localePref: 'custom' as Locale,
            locale: 'en',
            setLocalePref: vi.fn(),
          }}
        >
          <LanguageSelector />
        </MockProviders>
      );

      const trigger = screen.getByTestId('lang-select-trigger');
      expect(trigger.textContent).toContain('CUSTOM');
    });
  });
});
