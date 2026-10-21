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

describe('Given SettingsTab component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
  });

  afterEach(() => {
    cleanup();
  });

  describe('When hard reset is confirmed with valid keyword', () => {
    it('Then it should reset all local state arrays and display success notification', () => {
      // Given
      const mockState = getMockOxyFlowState();
      render(
        <MockProviders state={mockState}>
          <SettingsTab />
        </MockProviders>
      );

      // When
      const destructiveHeader = screen.getByTestId('destructive-zone-card');
      fireEvent.click(destructiveHeader);

      const resetBtn = screen.getByTestId('hard-reset-btn');
      fireEvent.click(resetBtn);

      const input = screen.getByTestId('prompt-dialog-input');
      fireEvent.change(input, { target: { value: 'reset' } });
      const confirmBtn = screen.getByTestId('prompt-dialog-confirm-btn');
      fireEvent.click(confirmBtn);

      // Then
      expect(mockState.setProjects).toHaveBeenCalledWith([]);
      expect(mockState.setTasks).toHaveBeenCalledWith([]);
      expect(mockState.setLogs).toHaveBeenCalledWith([]);
      expect(toast.success).toHaveBeenCalled();
    });
  });

  describe('When hard reset is cancelled or keyword does not match', () => {
    it('Then it should preserve all state and display error notification', () => {
      // Given
      const mockState = getMockOxyFlowState();
      render(
        <MockProviders state={mockState}>
          <SettingsTab />
        </MockProviders>
      );

      // When
      const destructiveHeader = screen.getByTestId('destructive-zone-card');
      fireEvent.click(destructiveHeader);

      const resetBtn = screen.getByTestId('hard-reset-btn');
      fireEvent.click(resetBtn);

      const input = screen.getByTestId('prompt-dialog-input');
      fireEvent.change(input, { target: { value: 'no' } });
      const confirmBtn = screen.getByTestId('prompt-dialog-confirm-btn');
      fireEvent.click(confirmBtn);

      // Then
      expect(mockState.setProjects).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('When auto-start setting is toggled', () => {
    it('Then it should persist updated configuration via state coordinator', () => {
      // Given
      const mockState = getMockOxyFlowState();
      render(
        <MockProviders state={mockState}>
          <SettingsTab />
        </MockProviders>
      );

      // When
      const engineHeader = screen.getByTestId('collapsible-trigger-engine-settings');
      fireEvent.click(engineHeader);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      // Then
      expect(mockState.setSysSettings).toHaveBeenCalled();
    });
  });
});
