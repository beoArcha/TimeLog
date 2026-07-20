import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ManualTab from '@features/settings/ManualTab';
import { toast } from 'sonner';
import { setupMatchMediaMock, getMockOxyFlowState } from '@tests/shared/test-helpers';

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
      <MockProviders state={mockState}>
        <ManualTab />
      </MockProviders>
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
      <MockProviders state={mockState}>
        <ManualTab />
      </MockProviders>
    );

    // Should fall back to English translation
    expect(screen.getByText('Compilation Manual, Shortcuts & Arch (Tauri OS Guides)')).toBeDefined();
  });
});
