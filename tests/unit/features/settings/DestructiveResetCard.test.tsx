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

describe('DestructiveResetCard', () => {
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

  it('should render collapsed destructive card by default when rendered', () => {
    // Arrange
    render(
      <MockProviders state={mockState}>
        <DestructiveResetCard />
      </MockProviders>
    );

    // Act & Assert
    expect(screen.getByTestId('destructive-zone-card')).not.toBeNull();
    expect(screen.getByText(/Destructive Zone/i)).not.toBeNull();
  });

  it('should render PWA browser reset semantics and default all domains selected when supportsTray is false', async () => {
    // Arrange
    render(
      <MockProviders state={mockState} capabilitiesState={{ supportsTray: false }}>
        <DestructiveResetCard />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('destructive-zone-card'));
    fireEvent.click(screen.getByTestId('hard-reset-btn'));

    // Assert
    expect(screen.getByText(/Clear Local Storage \(Browser Cache\)/i)).not.toBeNull();
    expect(screen.getByTestId('reset-scope-all')).toBeDefined();
    expect(screen.getByTestId('reset-scope-business')).toBeDefined();
    expect(screen.getByTestId('reset-scope-settings')).toBeDefined();
    expect(screen.getByTestId('reset-scope-system')).toBeDefined();

    // Act
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm-btn'));

    // Assert
    await waitFor(() => {
      expect(handleResetLocalStorageMock).toHaveBeenCalledWith(['BUSINESS', 'SETTINGS', 'SYSTEM']);
      expect(toast.success).toHaveBeenCalledTimes(1);
    });
  });

  it('should allow toggling individual domains in PWA mode and pass only selected domains on confirm', async () => {
    // Arrange
    render(
      <MockProviders state={mockState} capabilitiesState={{ supportsTray: false }}>
        <DestructiveResetCard />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('destructive-zone-card'));
    fireEvent.click(screen.getByTestId('hard-reset-btn'));

    // Deselect SETTINGS and SYSTEM, keeping only BUSINESS
    fireEvent.click(screen.getByTestId('reset-scope-settings'));
    fireEvent.click(screen.getByTestId('reset-scope-system'));

    fireEvent.click(screen.getByTestId('confirm-dialog-confirm-btn'));

    // Assert
    await waitFor(() => {
      expect(handleResetLocalStorageMock).toHaveBeenCalledWith(['BUSINESS']);
    });
  });

  it('should disable confirm button when all domains are unselected in PWA mode', async () => {
    // Arrange
    render(
      <MockProviders state={mockState} capabilitiesState={{ supportsTray: false }}>
        <DestructiveResetCard />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('destructive-zone-card'));
    fireEvent.click(screen.getByTestId('hard-reset-btn'));

    // Toggle select all off
    fireEvent.click(screen.getByTestId('reset-scope-all'));

    // Assert
    const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn') as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);
  });

  it('should render Desktop SQLite reset semantics and invoke reset without domain parameters when supportsTray is true', async () => {
    // Arrange
    render(
      <MockProviders state={mockState} capabilitiesState={{ supportsTray: true }}>
        <DestructiveResetCard />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('destructive-zone-card'));
    fireEvent.click(screen.getByTestId('hard-reset-btn'));

    // Assert
    expect(screen.getByText(/Reset Local Database \(SQLite\)/i)).not.toBeNull();
    expect(screen.queryByTestId('reset-scope-all')).toBeNull();

    // Act
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm-btn'));

    // Assert
    await waitFor(() => {
      expect(handleResetLocalStorageMock).toHaveBeenCalledTimes(1);
      expect(handleResetLocalStorageMock).toHaveBeenCalledWith();
      expect(toast.success).toHaveBeenCalledTimes(1);
    });
  });

  it('should display error toast when reset throws an error', async () => {
    // Arrange
    handleResetLocalStorageMock.mockRejectedValueOnce(new Error('Reset storage failed'));

    render(
      <MockProviders state={mockState} capabilitiesState={{ supportsTray: false }}>
        <DestructiveResetCard />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('destructive-zone-card'));
    fireEvent.click(screen.getByTestId('hard-reset-btn'));
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm-btn'));

    // Assert
    await waitFor(() => {
      expect(handleResetLocalStorageMock).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledTimes(1);
    });
  });

  it('should close dialog without calling reset when cancelled', () => {
    // Arrange
    render(
      <MockProviders state={mockState} capabilitiesState={{ supportsTray: false }}>
        <DestructiveResetCard />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('destructive-zone-card'));
    fireEvent.click(screen.getByTestId('hard-reset-btn'));
    fireEvent.click(screen.getByTestId('confirm-dialog-cancel-btn'));

    // Assert
    expect(handleResetLocalStorageMock).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
