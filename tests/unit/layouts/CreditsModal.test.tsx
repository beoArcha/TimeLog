// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CreditsModal from '@layouts/components/CreditsModal';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { getMockOXyFlowState, OXyFlowState } from '@tests/shared/mocks/oxy-state-mock';

type CreditsModalState = OXyFlowState & {
  showCreditsModal?: boolean;
  setShowCreditsModal?: (show: boolean) => void;
};

function createCreditsModalState(overrides: Partial<CreditsModalState> = {}): CreditsModalState {
  return {
    ...getMockOXyFlowState(),
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

  it('should render all refreshed tech stack core dependencies', () => {
    // Arrange
    const state = createCreditsModalState({ showCreditsModal: true });

    // Act
    render(
      <MockProviders state={state}>
        <CreditsModal />
      </MockProviders>
    );

    // Assert: verify each core dependency in TASK-18-D3 stack
    expect(screen.getByText('React 19')).toBeDefined();
    expect(screen.getByText('@base-ui/react')).toBeDefined();
    expect(screen.getByText('Tauri v2')).toBeDefined();
    expect(screen.getByText('Recharts')).toBeDefined();
    expect(screen.getByText('Sonner')).toBeDefined();
    expect(screen.getByText('Geist Font Family')).toBeDefined();
    expect(screen.getByText('Google GenAI')).toBeDefined();
    expect(screen.getByText('Motion')).toBeDefined();
    expect(screen.getByText('Tailwind CSS v4')).toBeDefined();
    expect(screen.getByText('Lucide React')).toBeDefined();
  });

  it('should render author notes on Vibe Coding and architecture practices', () => {
    // Arrange
    const state = createCreditsModalState({ showCreditsModal: true });

    // Act
    render(
      <MockProviders state={state}>
        <CreditsModal />
      </MockProviders>
    );

    // Assert: verify author bio & vibe coding architecture practices are rendered
    expect(screen.getAllByText(/Marcin 'beoArcha' Stefan/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Vibe Coding in oXyFlow/i)).toBeDefined();
    expect(screen.getByText(/dual-runtime parity/i)).toBeDefined();
  });
});

