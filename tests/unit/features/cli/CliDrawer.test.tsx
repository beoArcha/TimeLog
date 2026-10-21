import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CliDrawer } from '@features/cli/CliDrawer';
import { CliSessionProvider } from '@features/cli/context/CliSessionProvider';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { SandboxEmulatorStore } from '@features/cli/sandbox/sandboxEmulatorStore';

describe('Unit Tests: CliDrawer Component (Strict AAA)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SandboxEmulatorStore.resetInstanceForTesting();
  });

  afterEach(() => {
    cleanup();
  });

  it('should not render dialog when drawer is closed', () => {
    // Arrange
    render(
      <MockProviders>
        <CliSessionProvider initialDrawerOpen={false}>
          <CliDrawer />
        </CliSessionProvider>
      </MockProviders>
    );

    // Act
    const dialog = screen.queryByRole('dialog');

    // Assert
    expect(dialog).toBeNull();
  });

  it('should render dialog when drawer is open with input, history and close button', () => {
    // Arrange & Act
    const { container } = render(
      <MockProviders>
        <CliSessionProvider initialDrawerOpen={true}>
          <CliDrawer />
        </CliSessionProvider>
      </MockProviders>
    );

    // Assert
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(container.querySelector('#cli-input-field')).not.toBeNull();
    expect(container.querySelector('#cli-drawer-close-btn')).not.toBeNull();
  });

  it('should call onClose callback when close button is clicked', () => {
    // Arrange
    const onCloseMock = vi.fn();
    const { container } = render(
      <MockProviders>
        <CliSessionProvider initialDrawerOpen={true}>
          <CliDrawer onClose={onCloseMock} />
        </CliSessionProvider>
      </MockProviders>
    );

    // Act
    const closeBtn = container.querySelector('#cli-drawer-close-btn');
    expect(closeBtn).not.toBeNull();
    fireEvent.click(closeBtn!);

    // Assert
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('should close drawer when Escape key is pressed', () => {
    // Arrange
    const onCloseMock = vi.fn();
    render(
      <MockProviders>
        <CliSessionProvider initialDrawerOpen={true}>
          <CliDrawer onClose={onCloseMock} />
        </CliSessionProvider>
      </MockProviders>
    );

    // Act
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    // Assert
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('should submit command on form submission and clear input field', async () => {
    // Arrange
    const { container } = render(
      <MockProviders>
        <CliSessionProvider initialDrawerOpen={true}>
          <CliDrawer />
        </CliSessionProvider>
      </MockProviders>
    );

    const inputField = container.querySelector('#cli-input-field') as HTMLInputElement;
    expect(inputField).not.toBeNull();

    // Act
    fireEvent.change(inputField, { target: { value: 'help' } });
    expect(inputField.value).toBe('help');

    const submitBtn = container.querySelector('#cli-submit-btn');
    expect(submitBtn).not.toBeNull();
    fireEvent.click(submitBtn!);

    // Assert
    await waitFor(() => {
      expect(inputField.value).toBe('');
    });
  });

  it('should display sandbox badge in mode indicator when sandbox is active', () => {
    // Arrange
    const { container } = render(
      <MockProviders>
        <CliSessionProvider initialDrawerOpen={true} initialSandbox={true}>
          <CliDrawer />
        </CliSessionProvider>
      </MockProviders>
    );

    // Act
    const badgeContainer = container.querySelector('#cli-drawer-mode-badge');

    // Assert
    expect(badgeContainer).not.toBeNull();
    expect(badgeContainer?.textContent?.length).toBeGreaterThan(0);
  });
});
