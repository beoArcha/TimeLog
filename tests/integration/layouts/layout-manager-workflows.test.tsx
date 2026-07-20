import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import GuiClosedAlert from '@layouts/components/GuiClosedAlert';
import { getMockOxyFlowState } from '@tests/shared/mocks/oxy-state-mock';

function createMockState(overrides: Partial<any> = {}): any {
  return {
    ...getMockOxyFlowState(),
    ...overrides,
  };
}

describe('Integration Tests: Layout Manager Component Workflows', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('GuiClosedAlert', () => {
    it('Given isGuiClosed is true, When GuiClosedAlert rendered, Then it shows closed title and restart button', () => {
      const state = createMockState({ isGuiClosed: true });

      render(
        <MockProviders state={state}>
          <GuiClosedAlert />
        </MockProviders>
      );

      expect(screen.getByText(/GUI Closed/i)).toBeDefined();
      expect(screen.getByText(/Restart GUI Client/i)).toBeDefined();
    });

    it('Given GuiClosedAlert rendered, When restart button clicked, Then it calls setIsGuiClosed(false)', () => {
      const state = createMockState({ isGuiClosed: true });

      render(
        <MockProviders state={state}>
          <GuiClosedAlert />
        </MockProviders>
      );

      const restartBtn = screen.getByText(/Restart GUI Client/i);
      fireEvent.click(restartBtn);
      expect(state.setIsGuiClosed).toHaveBeenCalledWith(false);
    });
  });
});
