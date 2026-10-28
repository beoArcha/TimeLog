// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import DaemonStatusBar from '@layouts/components/DaemonStatusBar';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('DaemonStatusBar', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should render the tray minimize button when supportsTray is true and handleMinimizeToTray is provided', () => {
    // Arrange
    const handleMinimizeToTray = vi.fn();
    const mockState = getMockOxyFlowState();

    // Act
    render(
      <MockProviders
        state={mockState}
        windowShellState={{ handleMinimizeToTray }}
        capabilitiesState={{ supportsTray: true }}
      >
        <DaemonStatusBar />
      </MockProviders>
    );

    // Assert
    expect(screen.queryByTestId('minimize-tray-shortcut') || document.getElementById('minimize-tray-shortcut')).not.toBeNull();
  });

  it('should omit the tray minimize button when supportsTray is false', () => {
    // Arrange
    const handleMinimizeToTray = vi.fn();
    const mockState = getMockOxyFlowState();

    // Act
    render(
      <MockProviders
        state={mockState}
        windowShellState={{ handleMinimizeToTray }}
        capabilitiesState={{ supportsTray: false }}
      >
        <DaemonStatusBar />
      </MockProviders>
    );

    // Assert
    expect(document.getElementById('minimize-tray-shortcut')).toBeNull();
  });
});
