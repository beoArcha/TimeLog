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

  it('should render idle sync status when state is idle', () => {
    // Arrange
    const status = aSyncStatus({ state: 'idle' });
    const expectedText = translate('en', 'engine', 'SyncStatusOk');

    // Act
    render(<SyncStatusBadge status={status} />);

    // Assert
    expect(screen.getByText(expectedText)).toBeTruthy();
  });

  it('should render syncing status when state is syncing', () => {
    // Arrange
    const status = aSyncStatus({ state: 'syncing' });
    const expectedText = translate('en', 'engine', 'SyncStatusSyncing');

    // Act
    render(<SyncStatusBadge status={status} />);

    // Assert
    expect(screen.getByText(expectedText)).toBeTruthy();
  });

  it('should render queued count and call retry callback on click when state is queued', () => {
    // Arrange
    const onRetry = vi.fn();
    const status = aSyncStatus({ state: 'queued', pendingCount: 3 });

    // Act
    render(<SyncStatusBadge status={status} onRetry={onRetry} />);

    // Assert
    expect(screen.getByText(/3/)).toBeTruthy();
    const retryBtn = screen.getByTestId('webhook-retry-now-btn');
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should render failed count and retry button when state is error', () => {
    // Arrange
    const onRetry = vi.fn();
    const status = aSyncStatus({ state: 'error', failedCount: 2 });

    // Act
    render(<SyncStatusBadge status={status} onRetry={onRetry} />);

    // Assert
    expect(screen.getByText(/2/)).toBeTruthy();
    const retryBtn = screen.getByTestId('webhook-retry-now-btn');
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
