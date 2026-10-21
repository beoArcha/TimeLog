import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CreditsModal from '@layouts/components/CreditsModal';
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

describe('Given CreditsModal component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('When showCreditsModal is false', () => {
    it('Then it should render nothing in the DOM', () => {
      // Given
      const state = createCreditsModalState({ showCreditsModal: false });

      // When
      const { container } = render(
        <MockProviders state={state}>
          <CreditsModal />
        </MockProviders>
      );

      // Then
      expect(container.firstChild).toBeNull();
    });
  });

  describe('When showCreditsModal is true', () => {
    it('Then it should render modal dialog with accessible attributes and components', () => {
      // Given
      const state = createCreditsModalState({ showCreditsModal: true });

      // When
      render(
        <MockProviders state={state}>
          <CreditsModal />
        </MockProviders>
      );

      // Then
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeDefined();
      expect(screen.getByTestId('credits-modal-container')).toBeDefined();
      expect(screen.getByTestId('credits-modal-close-btn')).toBeDefined();
    });
  });

  describe('When close button is clicked', () => {
    it('Then it should notify state coordinator to close the modal', () => {
      // Given
      const state = createCreditsModalState({ showCreditsModal: true });
      render(
        <MockProviders state={state}>
          <CreditsModal />
        </MockProviders>
      );

      // When
      const closeBtn = screen.getByTestId('credits-modal-close-btn');
      fireEvent.click(closeBtn);

      // Then
      expect(state.setShowCreditsModal).toHaveBeenCalledWith(false);
    });
  });
});
