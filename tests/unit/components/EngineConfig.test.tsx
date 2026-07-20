import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import EngineConfig from '@components/EngineConfig';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: EngineConfig', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const renderEngineConfig = (overrides: Partial<any> = {}) => {
    const baseState = getMockOxyFlowState();
    const state = { ...baseState, ...overrides } as any;
    return render(
      <MockProviders state={state}>
        <EngineConfig />
      </MockProviders>
    );
  };

  it('Given EngineConfig rendered, When expanded, Then it should show all checkboxes', () => {
    const { getByTestId } = renderEngineConfig();
    const header = getByTestId('collapsible-trigger-Konfiguracja Silnika');
    fireEvent.click(header);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(5);
  });

  it('Given autoStart checkbox clicked, When onChange fires, Then it should call setSysSettings', () => {
    const setSysSettingsSpy = vi.fn();
    const { getByTestId } = renderEngineConfig({ setSysSettings: setSysSettingsSpy });
    const header = getByTestId('collapsible-trigger-Konfiguracja Silnika');
    fireEvent.click(header);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(setSysSettingsSpy).toHaveBeenCalled();
  });

  it('Given autoPauseOnSleep checkbox clicked, When onChange fires, Then it should call setSysSettings', () => {
    const setSysSettingsSpy = vi.fn();
    const { getByTestId } = renderEngineConfig({ setSysSettings: setSysSettingsSpy });
    const header = getByTestId('collapsible-trigger-Konfiguracja Silnika');
    fireEvent.click(header);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    expect(setSysSettingsSpy).toHaveBeenCalled();
  });

  it('Given minimizeToTray checkbox clicked, When onChange fires, Then it should call setMinimizeToTray', () => {
    const setMinimizeToTraySpy = vi.fn();
    const { getByTestId } = renderEngineConfig({ setMinimizeToTray: setMinimizeToTraySpy });
    const header = getByTestId('collapsible-trigger-Konfiguracja Silnika');
    fireEvent.click(header);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[3]);

    expect(setMinimizeToTraySpy).toHaveBeenCalled();
  });

  it('Given alwaysOnTopSmall checkbox clicked, When onChange fires, Then it should call setAlwaysOnTopSmall', () => {
    const setAlwaysOnTopSmallSpy = vi.fn();
    const { getByTestId } = renderEngineConfig({ setAlwaysOnTopSmall: setAlwaysOnTopSmallSpy });
    const header = getByTestId('collapsible-trigger-Konfiguracja Silnika');
    fireEvent.click(header);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[4]);

    expect(setAlwaysOnTopSmallSpy).toHaveBeenCalled();
  });

  it('Given alwaysOnTopMain checkbox clicked, When onChange fires, Then it should call setAlwaysOnTopMain', () => {
    const setAlwaysOnTopMainSpy = vi.fn();
    const { getByTestId } = renderEngineConfig({ setAlwaysOnTopMain: setAlwaysOnTopMainSpy });
    const header = getByTestId('collapsible-trigger-Konfiguracja Silnika');
    fireEvent.click(header);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[5]);

    expect(setAlwaysOnTopMainSpy).toHaveBeenCalled();
  });
});
