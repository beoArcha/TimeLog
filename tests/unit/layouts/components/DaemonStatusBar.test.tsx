// @vitest-environment jsdom
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import DaemonStatusBar from '@layouts/components/DaemonStatusBar';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { getMockOXyFlowState } from '@tests/shared/test-helpers';

describe('DaemonStatusBar', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should render nothing when native daemon is ready', () => {
    // Arrange
    const mockState = { ...getMockOXyFlowState(), engineState: 'ready' as const };

    // Act
    const { container } = render(
      <MockProviders
        state={mockState}
        capabilitiesState={{ supportsTray: true, hasNativeDaemon: true }}
      >
        <DaemonStatusBar />
      </MockProviders>
    );

    // Assert
    expect(container.firstChild).toBeNull();
    expect(container.querySelector('#engine-ready-status-bar')).toBeNull();
  });

  it('should render nothing in browser PWA mode even while connecting', () => {
    // Arrange
    const mockState = { ...getMockOXyFlowState(), engineState: 'connecting' as const };

    // Act
    const { container } = render(
      <MockProviders
        state={mockState}
        capabilitiesState={{ supportsTray: false, hasNativeDaemon: false }}
      >
        <DaemonStatusBar />
      </MockProviders>
    );

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it('should render connecting status bar when native daemon is connecting', () => {
    // Arrange
    const mockState = { ...getMockOXyFlowState(), engineState: 'connecting' as const };

    // Act
    const { container } = render(
      <MockProviders
        state={mockState}
        capabilitiesState={{ supportsTray: true, hasNativeDaemon: true }}
      >
        <DaemonStatusBar />
      </MockProviders>
    );

    // Assert
    expect(container.querySelector('#engine-connecting-status-bar')).not.toBeNull();
  });
});
