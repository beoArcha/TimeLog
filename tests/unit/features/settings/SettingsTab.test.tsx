// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import SettingsTab from '@features/settings/SettingsTab';
import { OxyContext, OxyFlowState } from '@common/hooks/OxyContext';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: SettingsTab', () => {
  const setSysSettingsMock = vi.fn();
  const mockState: OxyFlowState = {
    ...getMockOxyFlowState(),
    locale: 'en',
    customTranslations: {},
    resolvedTheme: 'dark',
    sysSettings: { autoStart: false, autoPauseOnSleep: true, includePatchesInReports: false, activeSinks: [] },
    setSysSettings: setSysSettingsMock,
  };

  afterEach(() => {
    cleanup();
  });

  it('should render general settings options', () => {
    render(
      <OxyContext.Provider value={mockState}>
        <SettingsTab />
      </OxyContext.Provider>
    );

    expect(screen.getByText(/Engine Options & Daemons/i)).not.toBeNull();
  });

  it('should handle settings input change', () => {
    render(
      <OxyContext.Provider value={mockState}>
        <SettingsTab />
      </OxyContext.Provider>
    );

    // Expand the engine config panel
    const trigger = screen.getByTestId('collapsible-trigger-Konfiguracja Silnika');
    fireEvent.click(trigger);

    const autoStartCheckbox = screen.getByLabelText(/Start on system boot/i) as HTMLInputElement;
    fireEvent.click(autoStartCheckbox);

    expect(setSysSettingsMock).toHaveBeenCalled();
  });
});
