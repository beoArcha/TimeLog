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
    expect(screen.getByText('System default')).not.toBeNull();
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
});
