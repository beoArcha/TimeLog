import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
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
  const handleResetLocalStorageMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      ...getMockOxyFlowState(),
      locale: 'en',
      customTranslations: {},
      resolvedTheme: 'dark',
      sysSettings: { autoStart: false, includePatchesInReports: false, activeSinks: [] },
      setSysSettings: setSysSettingsMock,
      setProjects: setProjectsMock,
      setTasks: setTasksMock,
      setLogs: setLogsMock,
      handleResetLocalStorage: handleResetLocalStorageMock,
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

  it('should open confirm dialog in browser mode and call handleResetLocalStorage on confirm', async () => {
    render(
      <MockProviders state={mockState} capabilitiesState={{ supportsTray: false }}>
        <SettingsTab />
      </MockProviders>
    );

    // Expand Destructive Zone
    const destructiveCard = screen.getByTestId('destructive-zone-card');
    fireEvent.click(destructiveCard);

    // Verify PWA / browser specific text
    expect(screen.getByText(/Clear browser data/i)).not.toBeNull();

    // Open ConfirmDialog via hard-reset-btn
    const resetBtn = screen.getByTestId('hard-reset-btn');
    fireEvent.click(resetBtn);

    // Verify dialog content
    expect(screen.getByText(/Clear Local Storage \(Browser Cache\)/i)).not.toBeNull();

    // Click confirm in ConfirmDialog
    const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleResetLocalStorageMock).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('should display desktop reset semantics when running in desktop mode', async () => {
    render(
      <MockProviders state={mockState} capabilitiesState={{ supportsTray: true }}>
        <SettingsTab />
      </MockProviders>
    );

    // Expand Destructive Zone
    const destructiveCard = screen.getByTestId('destructive-zone-card');
    fireEvent.click(destructiveCard);

    // Verify Desktop SQLite specific text
    expect(screen.getByText(/Reset SQLite database/i)).not.toBeNull();

    // Open ConfirmDialog
    const resetBtn = screen.getByTestId('hard-reset-btn');
    fireEvent.click(resetBtn);

    // Verify dialog content
    expect(screen.getByText(/Reset Local Database \(SQLite\)/i)).not.toBeNull();

    // Confirm reset
    const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleResetLocalStorageMock).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
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

    // Open ConfirmDialog
    const resetBtn = screen.getByTestId('hard-reset-btn');
    fireEvent.click(resetBtn);

    // Click cancel in ConfirmDialog
    const cancelBtn = screen.getByTestId('confirm-dialog-cancel-btn');
    fireEvent.click(cancelBtn);

    expect(handleResetLocalStorageMock).not.toHaveBeenCalled();
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
