import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import CliInterface from '@features/cli/CliInterface';
import { getMockOxyFlowState, OxyFlowState } from '@tests/shared/test-helpers';

// Mock scrollIntoView globally
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

const mockState: OxyFlowState = {
  ...getMockOxyFlowState(),
  locale: 'en',
  customTranslations: {},
  resolvedTheme: 'dark',
};

describe('Unit Tests: CliInterface', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the CLI interface with initial greeting lines', () => {
    render(
      <MockProviders state={mockState}>
        <CliInterface />
      </MockProviders>
    );

    expect(screen.getByText(/LogTime by OxyFlow CLI/i)).not.toBeNull();
  });

  it('should handle terminal command input submission', async () => {
    // Arrange
    render(
      <MockProviders state={mockState}>
        <CliInterface />
      </MockProviders>
    );

    const inputField = screen.getByPlaceholderText(/Enter command/i) as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: /Send/i });

    // Act
    fireEvent.change(inputField, { target: { value: 'help' } });
    fireEvent.click(submitBtn);

    // Assert
    await vi.waitFor(() => {
      expect(screen.getByText(/user@logtime-by-oxyflow:~\$ help/i)).not.toBeNull();
    });
  });

  it('should execute quick shortcut buttons', async () => {
    // Arrange
    render(
      <MockProviders state={mockState}>
        <CliInterface />
      </MockProviders>
    );

    const prjBtn = screen.getByRole('button', { name: 'projects' });

    // Act
    fireEvent.click(prjBtn);

    // Assert
    await vi.waitFor(() => {
      expect(screen.getByText(/user@logtime-by-oxyflow:~\$ projects/i)).not.toBeNull();
    });
  });

  it('should clear terminal history when Ctrl+L is pressed in input field', async () => {
    // Arrange
    render(
      <MockProviders state={mockState}>
        <CliInterface />
      </MockProviders>
    );

    const inputField = screen.getByPlaceholderText(/Enter command/i) as HTMLInputElement;
    expect(screen.getByText(/LogTime by OxyFlow CLI/i)).not.toBeNull();

    // Act
    fireEvent.keyDown(inputField, { key: 'l', ctrlKey: true });

    // Assert
    await vi.waitFor(() => {
      expect(screen.queryByText(/LogTime by OxyFlow CLI/i)).toBeNull();
    });
  });

  it('should switch prompt to oxyflow@emulator> when sandbox mode is toggled', async () => {
    // Arrange
    render(
      <MockProviders state={mockState}>
        <CliInterface />
      </MockProviders>
    );

    // Initial prompt
    expect(screen.getByText('oxyflow>')).not.toBeNull();

    // Act: click Emulator Sandbox in header
    const sandboxToggle = screen.getByText('Emulator Sandbox');
    fireEvent.click(sandboxToggle);

    // Assert
    await vi.waitFor(() => {
      expect(screen.getByText('oxyflow@emulator>')).not.toBeNull();
    });
  });

  it('should populate input with addtask when task add shortcut button is clicked', () => {
    // Arrange
    render(
      <MockProviders state={mockState}>
        <CliInterface />
      </MockProviders>
    );

    const taskAddBtn = screen.getByRole('button', { name: 'task add' });
    const inputField = screen.getByPlaceholderText(/Enter command/i) as HTMLInputElement;

    // Act
    fireEvent.click(taskAddBtn);

    // Assert
    expect(inputField.value).toBe('addtask ');
  });
});
