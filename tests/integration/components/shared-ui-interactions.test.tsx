import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CollapsibleCard from '@components/CollapsibleCard';
import RestoreButton from '@components/RestoreButton';
import { getMockOxyFlowState } from '@tests/shared/mocks/oxy-state-mock';

describe('Integration Tests: Shared UI Component Interactions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('CollapsibleCard', () => {
    it('Given CollapsibleCard, When defaultExpanded is true, Then children should be visible', () => {
      const mockState = getMockOxyFlowState();

      render(
        <MockProviders state={mockState}>
          <CollapsibleCard title="My Card" defaultExpanded={true} headerTestId="card-test">
            <div data-testid="card-child">Child Content</div>
          </CollapsibleCard>
        </MockProviders>
      );

      expect(screen.getByTestId('card-child')).toBeDefined();
    });

    it('Given CollapsibleCard, When header clicked, Then it toggles children visibility and triggers onClick callback', () => {
      const mockState = getMockOxyFlowState();
      const clickSpy = vi.fn();

      render(
        <MockProviders state={mockState}>
          <CollapsibleCard title="My Card" defaultExpanded={true} onClick={clickSpy} headerTestId="card-test">
            <div data-testid="card-child">Child Content</div>
          </CollapsibleCard>
        </MockProviders>
      );

      expect(screen.getByTestId('card-child')).toBeDefined();

      const headerBtn = screen.getByRole('button');
      fireEvent.click(headerBtn);

      expect(screen.queryByTestId('card-child')).toBeNull();
      expect(clickSpy).toHaveBeenCalled();

      fireEvent.click(headerBtn);
      expect(screen.getByTestId('card-child')).toBeDefined();
    });

    it('Given CollapsibleCard, When Enter or Space key pressed on header, Then it toggles children expansion', () => {
      const mockState = getMockOxyFlowState();

      render(
        <MockProviders state={mockState}>
          <CollapsibleCard title="Keyboard Card" defaultExpanded={false} headerTestId="kb-test">
            <div data-testid="kb-child">Keyboard Child</div>
          </CollapsibleCard>
        </MockProviders>
      );

      expect(screen.queryByTestId('kb-child')).toBeNull();

      const headerBtn = screen.getByRole('button');

      // Send Space key
      fireEvent.keyDown(headerBtn, { key: ' ' });
      expect(screen.getByTestId('kb-child')).toBeDefined();

      // Send Enter key
      fireEvent.keyDown(headerBtn, { key: 'Enter' });
      expect(screen.queryByTestId('kb-child')).toBeNull();
    });
  });

  describe('RestoreButton', () => {
    it('Given RestoreButton rendered, When clicked, Then it calls setIsMinimized and triggers showToast', () => {
      const mockState = getMockOxyFlowState();
      const setIsMinimizedSpy = vi.fn();
      const showToastSpy = vi.fn();

      render(
        <MockProviders state={mockState}>
          <RestoreButton setIsMinimized={setIsMinimizedSpy} showToast={showToastSpy} />
        </MockProviders>
      );

      const restoreBtn = screen.getByRole('button');
      fireEvent.click(restoreBtn);

      expect(setIsMinimizedSpy).toHaveBeenCalledWith(false);
      expect(showToastSpy).toHaveBeenCalled();
    });
  });
});
