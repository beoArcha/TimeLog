import { MockProviders } from '@tests/shared/mocks/MockProviders';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import EngineConfig from '@/src/features/settings/components/EngineConfig';
import { getMockOxyFlowState, OxyFlowState } from '@tests/shared/test-helpers';
import { PlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';

describe('EngineConfig', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const renderEngineConfig = (
    overrides: Partial<OxyFlowState> = {},
    capabilitiesOverrides: Partial<PlatformCapabilities> = {}
  ) => {
    const baseState = getMockOxyFlowState();
    const state = { ...baseState, ...overrides };
    return render(
      <MockProviders state={state} capabilitiesState={capabilitiesOverrides}>
        <EngineConfig />
      </MockProviders>
    );
  };

  it('should render collapsible trigger and show all system daemon checkboxes when expanded', () => {
    // Arrange
    const { getByTestId } = renderEngineConfig();
    const trigger = getByTestId('collapsible-trigger-engine-settings');

    // Act
    fireEvent.click(trigger);

    // Assert
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(6);
  });

  it('should render only universal settings and omit desktop-only checkboxes in web runtime capabilities', () => {
    // Arrange
    const { getByTestId } = renderEngineConfig({}, {
      supportsAutoStart: false,
      supportsTray: false,
      supportsAlwaysOnTop: false,
    });
    const trigger = getByTestId('collapsible-trigger-engine-settings');

    // Act
    fireEvent.click(trigger);

    // Assert
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(2);
  });

  it('should trigger setSysSettings when autoStart checkbox is toggled', () => {
    // Arrange
    const setSysSettingsSpy = vi.fn();
    const { getByTestId } = renderEngineConfig({ setSysSettings: setSysSettingsSpy });
    fireEvent.click(getByTestId('collapsible-trigger-engine-settings'));

    // Act
    const autoStartCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(autoStartCheckbox);

    // Assert
    expect(setSysSettingsSpy).toHaveBeenCalledTimes(1);
  });

  it('should trigger setIncludePatchesInReports when includePatchesInReports checkbox is toggled', () => {
    // Arrange
    const setSysSettingsSpy = vi.fn();
    const { getByTestId } = renderEngineConfig({ setSysSettings: setSysSettingsSpy });
    fireEvent.click(getByTestId('collapsible-trigger-engine-settings'));

    // Act
    const patchesCheckbox = screen.getAllByRole('checkbox')[1];
    fireEvent.click(patchesCheckbox);

    // Assert
    expect(setSysSettingsSpy).toHaveBeenCalledTimes(1);
  });

  it('should trigger setDefaultProjectConcurrency when defaultProjectConcurrency checkbox is toggled', () => {
    // Arrange
    const setDefaultProjectConcurrencySpy = vi.fn();
    const { getByTestId } = renderEngineConfig({ setDefaultProjectConcurrency: setDefaultProjectConcurrencySpy });
    fireEvent.click(getByTestId('collapsible-trigger-engine-settings'));

    // Act
    const concurrencyCheckbox = screen.getAllByRole('checkbox')[2];
    fireEvent.click(concurrencyCheckbox);

    // Assert
    expect(setDefaultProjectConcurrencySpy).toHaveBeenCalledTimes(1);
  });

  it('should trigger setMinimizeToTray when minimizeToTray checkbox is toggled', () => {
    // Arrange
    const setMinimizeToTraySpy = vi.fn();
    const { getByTestId } = renderEngineConfig({ setMinimizeToTray: setMinimizeToTraySpy });
    fireEvent.click(getByTestId('collapsible-trigger-engine-settings'));

    // Act
    const minimizeCheckbox = screen.getAllByRole('checkbox')[3];
    fireEvent.click(minimizeCheckbox);

    // Assert
    expect(setMinimizeToTraySpy).toHaveBeenCalledTimes(1);
  });

  it('should trigger setAlwaysOnTopSmall when alwaysOnTopSmall checkbox is toggled', () => {
    // Arrange
    const setAlwaysOnTopSmallSpy = vi.fn();
    const { getByTestId } = renderEngineConfig({ setAlwaysOnTopSmall: setAlwaysOnTopSmallSpy });
    fireEvent.click(getByTestId('collapsible-trigger-engine-settings'));

    // Act
    const smallCheckbox = screen.getAllByRole('checkbox')[4];
    fireEvent.click(smallCheckbox);

    // Assert
    expect(setAlwaysOnTopSmallSpy).toHaveBeenCalledTimes(1);
  });

  it('should trigger setAlwaysOnTopMain when alwaysOnTopMain checkbox is toggled', () => {
    // Arrange
    const setAlwaysOnTopMainSpy = vi.fn();
    const { getByTestId } = renderEngineConfig({ setAlwaysOnTopMain: setAlwaysOnTopMainSpy });
    fireEvent.click(getByTestId('collapsible-trigger-engine-settings'));

    // Act
    const mainCheckbox = screen.getAllByRole('checkbox')[5];
    fireEvent.click(mainCheckbox);

    // Assert
    expect(setAlwaysOnTopMainSpy).toHaveBeenCalledTimes(1);
  });
});
