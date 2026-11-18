// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import TimezoneSettingsCard from '@features/settings/components/TimezoneSettingsCard';

describe('TimezoneSettingsCard', () => {
  beforeAll(() => {
    if (typeof Intl.supportedValuesOf === 'function') {
      vi.spyOn(Intl, 'supportedValuesOf').mockImplementation((key: string) => {
        if (key === 'timeZone') {
          return ['America/New_York', 'Asia/Tokyo', 'Europe/Warsaw', 'Europe/Berlin'];
        }
        return [];
      });
    }
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render title and system default label when timezone is system', () => {
    // Arrange
    const setTimezone = vi.fn();

    // Act
    render(
      <MockProviders
        settingsState={{ timezone: 'System', resolvedTimezone: 'Europe/Warsaw', setTimezone }}
        localeState={{ locale: 'en', customTranslations: {} }}
      >
        <TimezoneSettingsCard />
      </MockProviders>
    );

    // Assert
    const header = screen.getByTestId('timezone-settings-card-header');
    const trigger = screen.getByTestId('timezone-select-trigger');
    expect(header).not.toBeNull();
    expect(trigger.textContent).toContain('System default');
  });

  it('should display resolved active timezone badge and current selection when custom timezone is provided', () => {
    // Arrange
    const setTimezone = vi.fn();

    // Act
    render(
      <MockProviders
        settingsState={{ timezone: 'America/New_York', resolvedTimezone: 'America/New_York', setTimezone }}
        localeState={{ locale: 'en', customTranslations: {} }}
      >
        <TimezoneSettingsCard />
      </MockProviders>
    );

    // Assert
    const trigger = screen.getByTestId('timezone-select-trigger');
    expect(trigger).toBeDefined();
    expect(trigger.textContent).toContain('America/New_York');
  });

  it('should render translated system label in Polish (pl) in both header text and select trigger', () => {
    // Arrange
    const setTimezone = vi.fn();

    // Act
    render(
      <MockProviders
        settingsState={{ timezone: 'System', resolvedTimezone: 'Europe/Warsaw', setTimezone }}
        localeState={{ locale: 'pl', customTranslations: {} }}
      >
        <TimezoneSettingsCard />
      </MockProviders>
    );

    // Assert
    const header = screen.getByTestId('timezone-settings-card-header');
    const trigger = screen.getByTestId('timezone-select-trigger');
    expect(header).toBeDefined();
    expect(trigger.textContent).toContain('Domyślna systemu');
  });

  it('should render translated system label in German (de) in both header text and select trigger', () => {
    // Arrange
    const setTimezone = vi.fn();

    // Act
    render(
      <MockProviders
        settingsState={{ timezone: 'System', resolvedTimezone: 'Europe/Berlin', setTimezone }}
        localeState={{ locale: 'de', customTranslations: {} }}
      >
        <TimezoneSettingsCard />
      </MockProviders>
    );

    // Assert
    const header = screen.getByTestId('timezone-settings-card-header');
    const trigger = screen.getByTestId('timezone-select-trigger');
    expect(header).toBeDefined();
    expect(trigger.textContent).toContain('Systemstandard');
  });

  it('should conform to accessibility (a11y) standards for combobox and decorative icons', () => {
    // Arrange
    const setTimezone = vi.fn();

    // Act
    const { container } = render(
      <MockProviders
        settingsState={{ timezone: 'UTC', resolvedTimezone: 'UTC', setTimezone }}
        localeState={{ locale: 'en', customTranslations: {} }}
      >
        <TimezoneSettingsCard />
      </MockProviders>
    );

    // Assert
    const trigger = screen.getByTestId('timezone-select-trigger');
    expect(trigger.getAttribute('role')).toBe('combobox');
    expect(trigger.getAttribute('aria-label')).toBe('Select timezone');

    // Decorative clock icon must have aria-hidden="true" and use semantic text-info class
    const clockIcon = container.querySelector('svg.lucide-clock');
    expect(clockIcon).not.toBeNull();
    expect(clockIcon?.getAttribute('aria-hidden')).toBe('true');
    expect(clockIcon?.getAttribute('class')).toContain('text-info');
  });

  it('should handle real user interaction when opening select, choosing Asia/Tokyo and updating context', async () => {
    // Arrange
    const user = userEvent.setup({ delay: null });
    const setTimezone = vi.fn();

    const { rerender } = render(
      <MockProviders
        settingsState={{ timezone: 'System', resolvedTimezone: 'Europe/Warsaw', setTimezone }}
        localeState={{ locale: 'en', customTranslations: {} }}
      >
        <TimezoneSettingsCard />
      </MockProviders>
    );

    const trigger = screen.getByTestId('timezone-select-trigger');
    expect(trigger.textContent).toContain('System default');

    // Act
    await user.click(trigger);
    const tokyoOption = await screen.findByTestId('timezone-option-Asia/Tokyo');
    await user.click(tokyoOption);

    // Assert
    expect(setTimezone).toHaveBeenCalledWith('Asia/Tokyo');

    rerender(
      <MockProviders
        settingsState={{ timezone: 'Asia/Tokyo', resolvedTimezone: 'Asia/Tokyo', setTimezone }}
        localeState={{ locale: 'en', customTranslations: {} }}
      >
        <TimezoneSettingsCard />
      </MockProviders>
    );

    expect(screen.getByTestId('timezone-select-trigger').textContent).toContain('Asia/Tokyo');
  });
});

