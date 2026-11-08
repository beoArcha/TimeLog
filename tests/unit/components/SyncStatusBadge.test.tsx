// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SyncStatusBadge } from '@components/SyncStatusBadge';
import { translate } from '@common/i18n/translator';
import type { SyncStatusSnapshot } from '@common/types/sync';

function aSyncStatus(overrides: Partial<SyncStatusSnapshot> = {}): SyncStatusSnapshot {
  return {
    state: 'idle',
    pendingCount: 0,
    failedCount: 0,
    lastError: null,
    lastDeliveredAt: null,
    ...overrides,
  };
}

describe('SyncStatusBadge', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render idle sync status with success token when state is idle', () => {
    // Arrange
    const status = aSyncStatus({ state: 'idle' });
    const expectedText = translate('en', 'engine', 'SyncStatusOk');

    // Act
    const { container } = render(<SyncStatusBadge status={status} />);

    // Assert
    expect(screen.getByText(expectedText)).toBeTruthy();
    const icon = container.querySelector('svg');
    expect(icon?.getAttribute('class')).toContain('text-success');
    expect(icon?.getAttribute('class')).not.toContain('text-emerald');
  });

  it('should render syncing status with info token when state is syncing', () => {
    // Arrange
    const status = aSyncStatus({ state: 'syncing' });
    const expectedText = translate('en', 'engine', 'SyncStatusSyncing');

    // Act
    const { container } = render(<SyncStatusBadge status={status} />);

    // Assert
    expect(screen.getByText(expectedText)).toBeTruthy();
    const content = container.querySelector('[data-slot="hstack"]');
    expect(content?.className).toContain('text-info');
    expect(content?.className).not.toContain('text-sky');
  });

  it('should render queued count with warning token and call retry callback on click when state is queued', () => {
    // Arrange
    const onRetry = vi.fn();
    const status = aSyncStatus({ state: 'queued', pendingCount: 3 });

    // Act
    const { container } = render(<SyncStatusBadge status={status} onRetry={onRetry} />);

    // Assert
    expect(screen.getByText(/3/)).toBeTruthy();
    const content = container.querySelector('[data-slot="hstack"]');
    expect(content?.className).toContain('text-warning');
    expect(content?.className).not.toContain('text-amber');
    const retryBtn = screen.getByTestId('webhook-retry-now-btn');
    expect(retryBtn.className).toContain('text-warning');
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should render failed count with destructive token and retry button when state is error', () => {
    // Arrange
    const onRetry = vi.fn();
    const status = aSyncStatus({ state: 'error', failedCount: 2 });

    // Act
    const { container } = render(<SyncStatusBadge status={status} onRetry={onRetry} />);

    // Assert
    expect(screen.getByText(/2/)).toBeTruthy();
    const content = container.querySelector('[data-slot="hstack"]');
    expect(content?.className).toContain('text-destructive');
    expect(content?.className).not.toContain('text-rose');
    const retryBtn = screen.getByTestId('webhook-retry-now-btn');
    expect(retryBtn.className).toContain('text-destructive');
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
