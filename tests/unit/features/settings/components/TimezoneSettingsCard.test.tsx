// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import TimezoneSettingsCard from '@features/settings/components/TimezoneSettingsCard';

describe('Unit Tests: TimezoneSettingsCard (AAA pattern)', () => {
  afterEach(() => { cleanup(); });

  it('renders timezone settings card title, system default label and options', () => {
    render(
      <MockProviders
        settingsState={{ timezone: 'System', resolvedTimezone: 'Europe/Warsaw', setTimezone: vi.fn() }}
        localeState={{ locale: 'en', customTranslations: {} }}
      >
        <TimezoneSettingsCard />
      </MockProviders>
    );

    expect(screen.getByTestId('timezone-settings-card-header')).not.toBeNull();
    expect(screen.getByText('Display Timezone')).not.toBeNull();
    expect(screen.getByText('System default')).not.toBeNull();
  });

  it('displays resolved active timezone badge and current selection', () => {
    render(
      <MockProviders
        settingsState={{ timezone: 'America/New_York', resolvedTimezone: 'America/New_York', setTimezone: vi.fn() }}
        localeState={{ locale: 'en', customTranslations: {} }}
      >
        <TimezoneSettingsCard />
      </MockProviders>
    );

    expect(screen.getAllByText('America/New_York').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('timezone-select-trigger')).not.toBeNull();
  });
});
