// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OxyContext } from '@core/providers/OxyContext';
import SettingsTab from '../../../src/gui/tabs/SettingsTab';
import { toast } from 'sonner';
import { setupMatchMediaMock, getMockOxyFlowState } from '../../shared/test-helpers';

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

  it('Given SettingsTab rendered, When hard reset database button is clicked and confirmed, Then it should clear all local state and remove database storage', () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('reset');
    const mockState = getMockOxyFlowState();

    render(
      <OxyContext.Provider value={mockState}>
        <SettingsTab />
      </OxyContext.Provider>
    );

    // Expand the Destructive Zone collapsible card
    const destructiveHeader = screen.getByText('Destructive Zone (Dangerous)');
    fireEvent.click(destructiveHeader);

    const resetBtn = screen.getByText('Reset database');
    fireEvent.click(resetBtn);

    expect(promptSpy).toHaveBeenCalled();
    expect(mockState.setProjects).toHaveBeenCalledWith([]);
    expect(mockState.setTasks).toHaveBeenCalledWith([]);
    expect(mockState.setLogs).toHaveBeenCalledWith([]);
    expect(toast.success).toHaveBeenCalled();
  });

  it('Given SettingsTab rendered, When hard reset database button is clicked and cancelled, Then it should not clear states and show cancel error toast', () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('no');
    const mockState = getMockOxyFlowState();

    render(
      <OxyContext.Provider value={mockState}>
        <SettingsTab />
      </OxyContext.Provider>
    );

    // Expand the Destructive Zone collapsible card
    const destructiveHeader = screen.getByText('Destructive Zone (Dangerous)');
    fireEvent.click(destructiveHeader);

    const resetBtn = screen.getByText('Reset database');
    fireEvent.click(resetBtn);

    expect(promptSpy).toHaveBeenCalled();
    expect(mockState.setProjects).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('Given SettingsTab rendered, When auto start setting is toggled, Then it should update the system settings', () => {
    const mockState = getMockOxyFlowState();

    render(
      <OxyContext.Provider value={mockState}>
        <SettingsTab />
      </OxyContext.Provider>
    );

    // Expand Engine Settings
    const engineHeader = screen.getByText('Engine Options & Daemons');
    fireEvent.click(engineHeader);

    const autoStartCheckbox = screen.getByLabelText('Start on system boot');
    fireEvent.click(autoStartCheckbox);

    expect(mockState.setSysSettings).toHaveBeenCalled();
  });
});
