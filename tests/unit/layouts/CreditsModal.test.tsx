// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CreditsModal from '@layouts/components/CreditsModal';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { getMockOxyFlowState, OxyFlowState } from '@tests/shared/mocks/oxy-state-mock';

type CreditsModalState = OxyFlowState & {
  showCreditsModal?: boolean;
  setShowCreditsModal?: (show: boolean) => void;
};

function createCreditsModalState(overrides: Partial<CreditsModalState> = {}): CreditsModalState {
  return {
    ...getMockOxyFlowState(),
    showCreditsModal: true,
    setShowCreditsModal: vi.fn(),
    ...overrides,
  };
}

describe('CreditsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render nothing when showCreditsModal is false', () => {
    // Arrange
    const state = createCreditsModalState({ showCreditsModal: false });

    // Act
    const { container } = render(
      <MockProviders state={state}>
        <CreditsModal />
      </MockProviders>
    );

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it('should render modal dialog with accessible elements when open', () => {
    // Arrange
    const state = createCreditsModalState({ showCreditsModal: true });

    // Act
    render(
      <MockProviders state={state}>
        <CreditsModal />
      </MockProviders>
    );

    // Assert
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByTestId('credits-modal-container')).toBeDefined();
    expect(screen.getByTestId('credits-modal-close-btn')).toBeDefined();
  });

  it('should notify state coordinator when close button is clicked', () => {
    // Arrange
    const state = createCreditsModalState({ showCreditsModal: true });
    render(
      <MockProviders state={state}>
        <CreditsModal />
      </MockProviders>
    );

    // Act
    const closeBtn = screen.getByTestId('credits-modal-close-btn');
    fireEvent.click(closeBtn);

    // Assert
    expect(state.setShowCreditsModal).toHaveBeenCalledWith(false);
  });
});
