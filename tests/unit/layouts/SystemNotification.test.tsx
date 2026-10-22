// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SystemNotification from '@layouts/components/SystemNotification';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { getMockOxyFlowState } from '@tests/shared/mocks/oxy-state-mock';

describe('SystemNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render nothing when trayNotification is null', () => {
    // Arrange
    const mockState = getMockOxyFlowState();
    mockState.trayNotification = null;

    // Act
    const { container } = render(
      <MockProviders state={mockState}>
        <SystemNotification />
      </MockProviders>
    );

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it('should display notification message and dismiss when close button is clicked', () => {
    // Arrange
    const mockState = getMockOxyFlowState();
    mockState.trayNotification = 'Sync complete!';
    mockState.setTrayNotification = vi.fn();

    // Act
    render(
      <MockProviders state={mockState}>
        <SystemNotification />
      </MockProviders>
    );

    // Assert
    expect(screen.getByText('Sync complete!')).toBeDefined();

    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);

    expect(mockState.setTrayNotification).toHaveBeenCalledWith(null);
  });
});
