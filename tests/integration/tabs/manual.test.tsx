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

describe('Given ManualTab component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
  });

  afterEach(() => {
    cleanup();
  });

  describe('When rendered with OS selectors', () => {
    it('Then it should render heading and notify user upon selecting an OS platform', () => {
      // Given
      const mockState = getMockOxyFlowState();
      render(
        <MockProviders state={mockState}>
          <ManualTab />
        </MockProviders>
      );

      // When
      const osButtons = screen.getAllByRole('button');
      const macBtn = osButtons.find(b => b.textContent?.trim().toLowerCase() === 'macos');
      expect(macBtn).toBeDefined();
      fireEvent.click(macBtn!);

      // Then
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('MACOS'));
    });
  });

  describe('When custom locale dictionary is empty', () => {
    it('Then it should safely fall back and render structural headings', () => {
      // Given
      const mockState = getMockOxyFlowState();
      mockState.locale = 'custom';
      mockState.customTranslations = {};

      // When
      render(
        <MockProviders state={mockState}>
          <ManualTab />
        </MockProviders>
      );

      // Then
      expect(screen.getByRole('heading', { level: 2 })).toBeDefined();
    });
  });
});
