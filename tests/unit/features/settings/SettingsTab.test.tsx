import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SettingsTab from '@features/settings/SettingsTab';
import { getMockOxyFlowState, OxyFlowState } from '@tests/shared/test-helpers';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Unit Tests: SettingsTab', () => {
  let mockState: OxyFlowState;
  const setSysSettingsMock = vi.fn();
  const setProjectsMock = vi.fn();
  const setTasksMock = vi.fn();
  const setLogsMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      ...getMockOxyFlowState(),
      locale: 'en',
      customTranslations: {},
      resolvedTheme: 'dark',
      sysSettings: { autoStart: false, autoPauseOnSleep: true, includePatchesInReports: false, activeSinks: [] },
      setSysSettings: setSysSettingsMock,
      setProjects: setProjectsMock,
      setTasks: setTasksMock,
      setLogs: setLogsMock,
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('should render general settings options', () => {
    render(
      <MockProviders state={mockState}>
        <SettingsTab />
      </MockProviders>
    );

    expect(screen.getByText(/Engine Options & Daemons/i)).not.toBeNull();
  });

  it('should handle settings input change', () => {
    render(
      <MockProviders state={mockState}>
        <SettingsTab />
      </MockProviders>
    );

    // Expand the engine config panel
    const trigger = screen.getByTestId('collapsible-trigger-engine-settings');
    fireEvent.click(trigger);

    const autoStartCheckbox = screen.getByLabelText(/Start on system boot/i) as HTMLInputElement;
    fireEvent.click(autoStartCheckbox);

    expect(setSysSettingsMock).toHaveBeenCalled();
  });

  it('should open prompt dialog, confirm reset with correct keyword, and clear local state', () => {
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    render(
      <MockProviders state={mockState}>
        <SettingsTab />
      </MockProviders>
    );

    // Expand Destructive Zone
    const destructiveCard = screen.getByTestId('destructive-zone-card');
    fireEvent.click(destructiveCard);

    // Open PromptDialog via hard-reset-btn
    const resetBtn = screen.getByTestId('hard-reset-btn');
    fireEvent.click(resetBtn);

    // Fill in 'reset' into PromptDialog
    const input = screen.getByTestId('prompt-dialog-input');
    fireEvent.change(input, { target: { value: 'reset' } });

    // Confirm
    const confirmBtn = screen.getByTestId('prompt-dialog-confirm-btn');
    fireEvent.click(confirmBtn);

    expect(setProjectsMock).toHaveBeenCalledWith([]);
    expect(setTasksMock).toHaveBeenCalledWith([]);
    expect(setLogsMock).toHaveBeenCalledWith([]);
    expect(removeItemSpy).toHaveBeenCalledWith('oxytime_state_db_6');
    expect(toast.success).toHaveBeenCalled();

    removeItemSpy.mockRestore();
  });

  it('should show error toast when reset confirmation text does not match', () => {
    render(
      <MockProviders state={mockState}>
        <SettingsTab />
      </MockProviders>
    );

    // Expand Destructive Zone
    const destructiveCard = screen.getByTestId('destructive-zone-card');
    fireEvent.click(destructiveCard);

    // Open PromptDialog
    const resetBtn = screen.getByTestId('hard-reset-btn');
    fireEvent.click(resetBtn);

    // Input incorrect confirmation keyword
    const input = screen.getByTestId('prompt-dialog-input');
    fireEvent.change(input, { target: { value: 'no' } });

    // Confirm
    const confirmBtn = screen.getByTestId('prompt-dialog-confirm-btn');
    fireEvent.click(confirmBtn);

    expect(setProjectsMock).not.toHaveBeenCalled();
    expect(setTasksMock).not.toHaveBeenCalled();
    expect(setLogsMock).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('should close dialog without clearing state when cancelled', () => {
    render(
      <MockProviders state={mockState}>
        <SettingsTab />
      </MockProviders>
    );

    // Expand Destructive Zone
    const destructiveCard = screen.getByTestId('destructive-zone-card');
    fireEvent.click(destructiveCard);

    // Open PromptDialog
    const resetBtn = screen.getByTestId('hard-reset-btn');
    fireEvent.click(resetBtn);

    // Click cancel in PromptDialog
    const cancelBtn = screen.getByTestId('prompt-dialog-cancel-btn');
    fireEvent.click(cancelBtn);

    expect(setProjectsMock).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should render application version details card', () => {
    render(
      <MockProviders state={mockState}>
        <SettingsTab />
      </MockProviders>
    );

    expect(screen.getByText(/OxyFlow Versions/i)).not.toBeNull();
  });
});
