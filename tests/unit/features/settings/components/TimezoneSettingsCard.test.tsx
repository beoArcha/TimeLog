// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import TimezoneSettingsCard from '@features/settings/components/TimezoneSettingsCard';
import { translate } from '@common/i18n/translator';

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
    const title = translate('en', 'settings', 'TimezoneTitle');
    const systemLabel = translate('en', 'settings', 'TimezoneSystem');

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
    expect(header.textContent).toContain(title);
    expect(trigger.textContent).toContain(systemLabel);
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
    expect(screen.getAllByText('America/New_York').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('timezone-select-trigger').textContent).toContain('America/New_York');
  });

  it('should render translated system label in Polish (pl) in both header text and select trigger', () => {
    // Arrange
    const setTimezone = vi.fn();
    const title = translate('pl', 'settings', 'TimezoneTitle');
    const systemLabel = translate('pl', 'settings', 'TimezoneSystem');

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
    expect(screen.getByTestId('timezone-settings-card-header').textContent).toContain(title);
    expect(screen.getByTestId('timezone-select-trigger').textContent).toContain(systemLabel);
  });

  it('should render translated system label in German (de) in both header text and select trigger', () => {
    // Arrange
    const setTimezone = vi.fn();
    const title = translate('de', 'settings', 'TimezoneTitle');
    const systemLabel = translate('de', 'settings', 'TimezoneSystem');

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
    expect(screen.getByTestId('timezone-settings-card-header').textContent).toContain(title);
    expect(screen.getByTestId('timezone-select-trigger').textContent).toContain(systemLabel);
  });

  it('should conform to accessibility (a11y) standards for combobox and decorative icons', () => {
    // Arrange
    const setTimezone = vi.fn();
    const selectAriaLabel = translate('en', 'settings', 'TimezoneSelectAria');

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
    expect(trigger.getAttribute('aria-label')).toBe(selectAriaLabel);

    // Decorative clock icon must have aria-hidden="true" and use semantic text-info class
    const clockIcon = container.querySelector('svg.lucide-clock');
    expect(clockIcon).not.toBeNull();
    expect(clockIcon?.getAttribute('aria-hidden')).toBe('true');
    expect(clockIcon?.getAttribute('class')).toContain('text-info');
  });

  it('should call setTimezone with Asia/Tokyo when the user picks it from the select', async () => {
    // Arrange
    const user = userEvent.setup({ delay: null });
    const setTimezone = vi.fn();
    render(
      <MockProviders
        settingsState={{ timezone: 'System', resolvedTimezone: 'Europe/Warsaw', setTimezone }}
        localeState={{ locale: 'en', customTranslations: {} }}
      >
        <TimezoneSettingsCard />
      </MockProviders>
    );

    // Act
    await user.click(screen.getByTestId('timezone-select-trigger'));
    await user.click(await screen.findByTestId('timezone-option-Asia/Tokyo'));

    // Assert
    expect(setTimezone).toHaveBeenCalledWith('Asia/Tokyo');
  });

  it('should show Asia/Tokyo in the trigger when the context timezone is Asia/Tokyo', () => {
    // Arrange
    const setTimezone = vi.fn();

    // Act
    render(
      <MockProviders
        settingsState={{ timezone: 'Asia/Tokyo', resolvedTimezone: 'Asia/Tokyo', setTimezone }}
        localeState={{ locale: 'en', customTranslations: {} }}
      >
        <TimezoneSettingsCard />
      </MockProviders>
    );

    // Assert
    expect(screen.getByTestId('timezone-select-trigger').textContent).toContain('Asia/Tokyo');
  });
});
