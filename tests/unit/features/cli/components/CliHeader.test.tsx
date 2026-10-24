import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CliHeader } from '@features/cli/components/CliHeader';
import { MockLocaleProvider } from '@tests/shared/mocks/MockProviders';

describe('Unit Tests: CliHeader Component (Strict AAA)', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render terminal shell version and fallback badge when onToggleSandbox is omitted', () => {
    // Arrange
    render(
      <MockLocaleProvider>
        <CliHeader version="1.2.3" isSandbox={false} />
      </MockLocaleProvider>
    );

    // Act
    const shellTitle = screen.getByText(/LogTime by OxyFlow Engine CLI Shell \(127\.0\.0\.1\) v1\.2\.3/i);
    const badge = screen.getByText('Rust CLI client emulator');

    // Assert
    expect(shellTitle).not.toBeNull();
    expect(badge).not.toBeNull();
  });

  it('should render SegmentedControl when onToggleSandbox is provided and trigger toggle callback', () => {
    // Arrange
    const onToggleSandboxMock = vi.fn();
    render(
      <MockLocaleProvider>
        <CliHeader version="1.0.0" isSandbox={false} onToggleSandbox={onToggleSandboxMock} />
      </MockLocaleProvider>
    );

    // Act
    const liveOption = screen.getByText('Live SQLite');
    const sandboxOption = screen.getByText('Emulator Sandbox');
    fireEvent.click(sandboxOption);

    // Assert
    expect(liveOption).not.toBeNull();
    expect(sandboxOption).not.toBeNull();
    expect(onToggleSandboxMock).toHaveBeenCalledWith(true);
  });

  it('should switch back to live engine when Live SQLite is clicked in sandbox mode', () => {
    // Arrange
    const onToggleSandboxMock = vi.fn();
    render(
      <MockLocaleProvider>
        <CliHeader version="1.0.0" isSandbox={true} onToggleSandbox={onToggleSandboxMock} />
      </MockLocaleProvider>
    );

    // Act
    const liveOption = screen.getByText('Live SQLite');
    fireEvent.click(liveOption);

    // Assert
    expect(onToggleSandboxMock).toHaveBeenCalledWith(false);
  });
});
