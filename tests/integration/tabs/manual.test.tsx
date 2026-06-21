// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OxyContext } from '@core/providers/OxyContext';
import ManualTab from '../../../src/gui/tabs/ManualTab';
import { toast } from 'sonner';
import { setupMatchMediaMock, getMockOxyFlowState } from '../../shared/test-helpers';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Integration Tests: ManualTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
  });

  afterEach(() => {
    cleanup();
  });

  it('Given ManualTab rendered, When OS button is clicked, Then it should notify via toast and update OS specifics', async () => {
    const mockState = getMockOxyFlowState();

    render(
      <OxyContext.Provider value={mockState}>
        <ManualTab />
      </OxyContext.Provider>
    );

    expect(screen.getByText('Compilation Manual, Shortcuts & Arch (Tauri OS Guides)')).toBeDefined();

    const macBtn = screen.getByText('macos');
    fireEvent.click(macBtn);

    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('MACOS'));
  });

  it('Given ManualTab rendered, When missing locale dictionary is used, Then it should fall back to English/key name', () => {
    const mockState = getMockOxyFlowState();
    mockState.locale = 'custom';
    mockState.customTranslations = {}; // Empty custom translations

    render(
      <OxyContext.Provider value={mockState}>
        <ManualTab />
      </OxyContext.Provider>
    );

    // Should fall back to English translation
    expect(screen.getByText('Compilation Manual, Shortcuts & Arch (Tauri OS Guides)')).toBeDefined();
  });
});
