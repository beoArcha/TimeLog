// @vitest-environment jsdom
import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import CliInterface from '@features/cli/CliInterface';
import { OxyContext, OxyFlowState } from '@common/hooks/OxyContext';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

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
      <OxyContext.Provider value={mockState}>
        <CliInterface />
      </OxyContext.Provider>
    );

    expect(screen.getByText(/LogTime by OxyFlow CLI/i)).not.toBeNull();
  });

  it('should handle terminal command input submission', () => {
    render(
      <OxyContext.Provider value={mockState}>
        <CliInterface />
      </OxyContext.Provider>
    );

    const inputField = screen.getByPlaceholderText(/Enter command/i) as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: /Send/i });

    fireEvent.change(inputField, { target: { value: 'help' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/user@logtime-by-oxyflow:~\$ help/i)).not.toBeNull();
  });

  it('should execute quick shortcut buttons', () => {
    render(
      <OxyContext.Provider value={mockState}>
        <CliInterface />
      </OxyContext.Provider>
    );

    const prjBtn = screen.getByRole('button', { name: 'projects' });
    fireEvent.click(prjBtn);

    expect(screen.getByText(/user@logtime-by-oxyflow:~\$ projects/i)).not.toBeNull();
  });
});
