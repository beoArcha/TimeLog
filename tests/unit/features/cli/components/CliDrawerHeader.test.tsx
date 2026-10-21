import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CliDrawerHeader } from '@features/cli/components/CliDrawerHeader';

describe('Unit Tests: CliDrawerHeader Component (Strict AAA)', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render drawer title, live badge and trigger onClose when close button clicked', () => {
    // Arrange
    const onCloseMock = vi.fn();
    render(
      <CliDrawerHeader
        title="OxyFlow CLI Terminal"
        closeLabel="Close"
        isSandbox={false}
        liveBadge="LIVE ENGINE"
        sandboxBadge="SANDBOX EMULATOR"
        onClose={onCloseMock}
      />
    );

    // Act
    const heading = screen.getByText('OxyFlow CLI Terminal');
    const badge = screen.getByText('[LIVE ENGINE]');
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeBtn);

    // Assert
    expect(heading).not.toBeNull();
    expect(badge).not.toBeNull();
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('should render sandbox badge when isSandbox is true', () => {
    // Arrange
    const onCloseMock = vi.fn();
    render(
      <CliDrawerHeader
        title="OxyFlow CLI Terminal"
        closeLabel="Close"
        isSandbox={true}
        liveBadge="LIVE ENGINE"
        sandboxBadge="SANDBOX EMULATOR"
        onClose={onCloseMock}
      />
    );

    // Act
    const badge = screen.getByText('[SANDBOX EMULATOR]');

    // Assert
    expect(badge).not.toBeNull();
  });
});
