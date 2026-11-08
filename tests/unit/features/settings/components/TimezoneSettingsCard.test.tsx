// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import TimezoneSettingsCard from '@features/settings/components/TimezoneSettingsCard';

describe('TimezoneSettingsCard', () => {
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
    expect(screen.getByTestId('timezone-settings-card-header')).not.toBeNull();
    expect(screen.getByText('Display Timezone')).not.toBeNull();
    expect(screen.getAllByText('System default').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('timezone-select-trigger').textContent).toContain('System default');
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
    expect(screen.getByTestId('timezone-select-trigger')).not.toBeNull();
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

    // Assert: "Domyślna systemu" in Polish dictionary
    expect(screen.getByText('Strefa czasowa wyświetlania')).not.toBeNull();
    expect(screen.getAllByText('Domyślna systemu').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('timezone-select-trigger').textContent).toContain('Domyślna systemu');
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

    // Assert: "Systemstandard" in German dictionary
    expect(screen.getByText('Anzeigezeitzone')).not.toBeNull();
    expect(screen.getAllByText('Systemstandard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('timezone-select-trigger').textContent).toContain('Systemstandard');
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
});
