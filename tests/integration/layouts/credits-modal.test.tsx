// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OxyContext, OxyFlowState } from '@common/hooks/OxyContext';
import CreditsModal from '@layouts/components/CreditsModal';
import { getMockOxyFlowState } from '@tests/shared/mocks/oxy-state-mock';

function createCreditsModalState(overrides: Partial<OxyFlowState> = {}): OxyFlowState {
  return {
    ...getMockOxyFlowState(),
    showCreditsModal: true,
    setShowCreditsModal: vi.fn(),
    ...overrides,
  };
}

describe('Integration Tests: CreditsModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('Given showCreditsModal is false, When rendered, Then it should render nothing', () => {
    const state = createCreditsModalState({ showCreditsModal: false });

    const { container } = render(
      <OxyContext.Provider value={state}>
        <CreditsModal />
      </OxyContext.Provider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('Given showCreditsModal is true, When rendered, Then it should show authors, acknowledgements and MPL-2.0 info', () => {
    const state = createCreditsModalState();

    render(
      <OxyContext.Provider value={state}>
        <CreditsModal />
      </OxyContext.Provider>
    );

    expect(screen.getByText(/^Mozilla Public License Version 2\.0/)).toBeDefined();
    expect(screen.getByText(/Lucide React/)).toBeDefined();
    expect(screen.getByText(/Tailwind CSS v4/)).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /Zamknij/i });
    fireEvent.click(closeBtn);
    expect(state.setShowCreditsModal).toHaveBeenCalledWith(false);
  });

  it('Given active modal, When close button clicked, Then it should set showCreditsModal to false', () => {
    const state = createCreditsModalState();

    render(
      <OxyContext.Provider value={state}>
        <CreditsModal />
      </OxyContext.Provider>
    );

    const closeBtn = screen.getByRole('button', { name: /Zamknij/i });
    fireEvent.click(closeBtn);
    expect(state.setShowCreditsModal).toHaveBeenCalledWith(false);
  });

  it('Given light theme, When CreditsModal is rendered, Then it applies light theme colors', () => {
    const state = createCreditsModalState({ resolvedTheme: 'light' });

    render(
      <OxyContext.Provider value={state}>
        <CreditsModal />
      </OxyContext.Provider>
    );

    const containerDiv = document.getElementById('credits-modal-container');
    expect(containerDiv).not.toBeNull();
    expect(containerDiv?.className).toContain('bg-[#FCFAF8]');
    expect(containerDiv?.className).toContain('border-[#DFD7CB]');
  });
});
