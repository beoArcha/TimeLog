import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DestructiveResetCard from '@features/settings/components/DestructiveResetCard';
import { getMockOxyFlowState, OxyFlowState } from '@tests/shared/test-helpers';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Unit Tests: DestructiveResetCard', () => {
  let mockState: OxyFlowState;
  const handleResetLocalStorageMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      ...getMockOxyFlowState(),
      locale: 'en',
      customTranslations: {},
      handleResetLocalStorage: handleResetLocalStorageMock,
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('should render collapsed destructive card by default', () => {
    render(
      <MockProviders state={mockState}>
        <DestructiveResetCard />
      </MockProviders>
    );

    expect(screen.getByTestId('destructive-zone-card')).not.toBeNull();
    expect(screen.getByText(/Destructive Zone/i)).not.toBeNull();
  });

  it('should render PWA browser reset semantics when supportsTray is false', async () => {
    render(
      <MockProviders state={mockState} capabilitiesState={{ supportsTray: false }}>
        <DestructiveResetCard />
      </MockProviders>
    );

    // Expand card
    fireEvent.click(screen.getByTestId('destructive-zone-card'));

    expect(screen.getByText(/Clear browser data/i)).not.toBeNull();
    expect(screen.getByText(/stored in this browser's LocalStorage/i)).not.toBeNull();

    // Click reset button
    fireEvent.click(screen.getByTestId('hard-reset-btn'));

    // Verify dialog title and description
    expect(screen.getByText(/Clear Local Storage \(Browser Cache\)/i)).not.toBeNull();
    expect(screen.getByText(/Are you sure you want to clear all data stored in the browser/i)).not.toBeNull();

    // Confirm dialog
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm-btn'));

    await waitFor(() => {
      expect(handleResetLocalStorageMock).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledTimes(1);
    });
  });

  it('should render Desktop SQLite reset semantics when supportsTray is true', async () => {
    render(
      <MockProviders state={mockState} capabilitiesState={{ supportsTray: true }}>
        <DestructiveResetCard />
      </MockProviders>
    );

    // Expand card
    fireEvent.click(screen.getByTestId('destructive-zone-card'));

    expect(screen.getByText(/Reset SQLite database/i)).not.toBeNull();
    expect(screen.getByText(/purge the local SQLite database file/i)).not.toBeNull();

    // Click reset button
    fireEvent.click(screen.getByTestId('hard-reset-btn'));

    // Verify dialog title and description
    expect(screen.getByText(/Reset Local Database \(SQLite\)/i)).not.toBeNull();
    expect(screen.getByText(/completely clear the local SQLite database/i)).not.toBeNull();

    // Confirm dialog
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm-btn'));

    await waitFor(() => {
      expect(handleResetLocalStorageMock).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledTimes(1);
    });
  });

  it('should display error toast when reset throws an error', async () => {
    handleResetLocalStorageMock.mockRejectedValueOnce(new Error('Reset storage failed'));

    render(
      <MockProviders state={mockState} capabilitiesState={{ supportsTray: false }}>
        <DestructiveResetCard />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('destructive-zone-card'));
    fireEvent.click(screen.getByTestId('hard-reset-btn'));
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm-btn'));

    await waitFor(() => {
      expect(handleResetLocalStorageMock).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledTimes(1);
    });
  });

  it('should close dialog without calling reset when cancelled', () => {
    render(
      <MockProviders state={mockState} capabilitiesState={{ supportsTray: false }}>
        <DestructiveResetCard />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('destructive-zone-card'));
    fireEvent.click(screen.getByTestId('hard-reset-btn'));
    fireEvent.click(screen.getByTestId('confirm-dialog-cancel-btn'));

    expect(handleResetLocalStorageMock).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
