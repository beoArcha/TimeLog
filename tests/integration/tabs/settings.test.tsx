// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SettingsTab from '@features/settings/SettingsTab';
import { toast } from 'sonner';
import { setupMatchMediaMock, getMockOxyFlowState } from '@tests/shared/test-helpers';
import { MockProviders } from '@tests/shared/mocks/MockProviders';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Integration Tests: SettingsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
  });

  afterEach(() => {
    cleanup();
  });

  it('should clear all local state and remove database storage when hard reset is confirmed', () => {
    const mockState = getMockOxyFlowState();

    render(
      <MockProviders state={mockState}>
        <SettingsTab />
      </MockProviders>
    );

    // Expand the Destructive Zone collapsible card
    const destructiveHeader = screen.getByTestId('destructive-zone-card');
    fireEvent.click(destructiveHeader);

    const resetBtn = screen.getByTestId('hard-reset-btn');
    fireEvent.click(resetBtn);

    const input = screen.getByTestId('prompt-dialog-input');
    fireEvent.change(input, { target: { value: 'reset' } });
    const confirmBtn = screen.getByTestId('prompt-dialog-confirm-btn');
    fireEvent.click(confirmBtn);

    expect(mockState.setProjects).toHaveBeenCalledWith([]);
    expect(mockState.setTasks).toHaveBeenCalledWith([]);
    expect(mockState.setLogs).toHaveBeenCalledWith([]);
    expect(toast.success).toHaveBeenCalled();
  });

  it('should preserve state and show cancel toast when hard reset is cancelled or input does not match', () => {
    const mockState = getMockOxyFlowState();

    render(
      <MockProviders state={mockState}>
        <SettingsTab />
      </MockProviders>
    );

    // Expand the Destructive Zone collapsible card
    const destructiveHeader = screen.getByTestId('destructive-zone-card');
    fireEvent.click(destructiveHeader);

    const resetBtn = screen.getByTestId('hard-reset-btn');
    fireEvent.click(resetBtn);

    const input = screen.getByTestId('prompt-dialog-input');
    fireEvent.change(input, { target: { value: 'no' } });
    const confirmBtn = screen.getByTestId('prompt-dialog-confirm-btn');
    fireEvent.click(confirmBtn);

    expect(mockState.setProjects).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('should update system settings when auto start setting is toggled', () => {
    const mockState = getMockOxyFlowState();

    render(
      <MockProviders state={mockState}>
        <SettingsTab />
      </MockProviders>
    );

    // Expand Engine Settings via testId
    const engineHeader = screen.getByTestId('collapsible-trigger-engine-settings');
    fireEvent.click(engineHeader);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(mockState.setSysSettings).toHaveBeenCalled();
  });
});
