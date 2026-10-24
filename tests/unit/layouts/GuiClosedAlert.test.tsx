// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import GuiClosedAlert from '@layouts/components/GuiClosedAlert';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { getMockOxyFlowState, OxyFlowState } from '@tests/shared/mocks/oxy-state-mock';

function createMockState(overrides: Partial<OxyFlowState> = {}): OxyFlowState {
  return {
    ...getMockOxyFlowState(),
    ...overrides,
  };
}

describe('GuiClosedAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render alert elements when isGuiClosed is true', () => {
    // Arrange
    const state = createMockState({ isGuiClosed: true });

    // Act
    render(
      <MockProviders state={state}>
        <GuiClosedAlert />
      </MockProviders>
    );

    // Assert
    expect(screen.getByText(/GUI Closed/i)).toBeDefined();
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('should invoke setIsGuiClosed with false when restart button is clicked', () => {
    // Arrange
    const state = createMockState({ isGuiClosed: true });
    render(
      <MockProviders state={state}>
        <GuiClosedAlert />
      </MockProviders>
    );

    // Act
    const restartBtn = screen.getByRole('button');
    fireEvent.click(restartBtn);

    // Assert
    expect(state.setIsGuiClosed).toHaveBeenCalledWith(false);
  });
});
