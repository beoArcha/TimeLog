// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { RootErrorBoundary } from '@components/RootErrorBoundary';

const ProblematicChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test crash message');
  }
  return <div data-testid="child-content">Normal Content</div>;
};

describe('Unit Tests: RootErrorBoundary', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error occurs', () => {
    render(
      <RootErrorBoundary>
        <ProblematicChild shouldThrow={false} />
      </RootErrorBoundary>
    );

    expect(screen.getByTestId('child-content')).toBeTruthy();
    expect(screen.queryByTestId('root-error-boundary-fallback')).toBeNull();
  });

  it('catches render error and displays error UI with reload button', () => {
    render(
      <RootErrorBoundary>
        <ProblematicChild shouldThrow={true} />
      </RootErrorBoundary>
    );

    expect(screen.queryByTestId('child-content')).toBeNull();
    expect(screen.getByTestId('root-error-boundary-fallback')).toBeTruthy();
    expect(screen.getByText(/Test crash message/)).toBeTruthy();

    const reloadButton = screen.getByTestId('root-error-reload-btn');
    expect(reloadButton).toBeTruthy();
  });

  it('triggers window reload when reload button is clicked', () => {
    const originalLocation = window.location;
    const reloadMock = vi.fn();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: reloadMock },
    });

    render(
      <RootErrorBoundary>
        <ProblematicChild shouldThrow={true} />
      </RootErrorBoundary>
    );

    fireEvent.click(screen.getByTestId('root-error-reload-btn'));
    expect(reloadMock).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });
});
