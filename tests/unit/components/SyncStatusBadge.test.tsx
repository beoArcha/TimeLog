// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SyncStatusBadge } from '@components/SyncStatusBadge';
import { translate } from '@common/i18n/translator';
import type { SyncStatusSnapshot, SyncStateType } from '@common/types/sync';

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

  describe('Accessibility & Semantics', () => {
    it('should expose role="status" and aria-live="polite" on the badge container', () => {
      // Arrange
      const status = aSyncStatus({ state: 'idle' });

      // Act
      render(<SyncStatusBadge status={status} />);

      // Assert
      const badge = screen.getByTestId('webhook-sync-indicator');
      expect(badge.getAttribute('role')).toBe('status');
      expect(badge.getAttribute('aria-live')).toBe('polite');
    });

    it.each([
      { state: 'idle' as const, expectedIconClass: 'text-emerald-500' },
      { state: 'syncing' as const, expectedIconClass: 'animate-spin' },
      { state: 'queued' as const, expectedIconClass: 'animate-pulse' },
      { state: 'error' as const, expectedIconClass: 'shrink-0' },
    ])('should mark icon with aria-hidden="true" in $state state', ({ state, expectedIconClass }) => {
      // Arrange
      const status = aSyncStatus({ state, pendingCount: 1, failedCount: 1 });

      // Act
      const { container } = render(<SyncStatusBadge status={status} />);

      // Assert
      const icon = container.querySelector('svg');
      expect(icon).toBeTruthy();
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
      expect(icon?.getAttribute('class')).toContain(expectedIconClass);
    });
  });

  describe('Touch Target & Interactions', () => {
    it('should satisfy WCAG 2.2 touch target minimum size (min-h-[24px] / h-6) on retry button', () => {
      // Arrange
      const onRetry = vi.fn();
      const status = aSyncStatus({ state: 'queued', pendingCount: 3 });

      // Act
      render(<SyncStatusBadge status={status} onRetry={onRetry} />);

      // Assert
      const retryBtn = screen.getByTestId('webhook-sync-indicator-retry-btn');
      expect(retryBtn.className).toContain('min-h-[24px]');
      expect(retryBtn.className).toContain('h-6');
    });

    it('should support custom testId prop propagating to retry button', () => {
      // Arrange
      const onRetry = vi.fn();
      const status = aSyncStatus({ state: 'error', failedCount: 2 });

      // Act
      render(<SyncStatusBadge status={status} onRetry={onRetry} testId="custom-sync" />);

      // Assert
      expect(screen.getByTestId('custom-sync')).toBeTruthy();
      const retryBtn = screen.getByTestId('custom-sync-retry-btn');
      expect(retryBtn).toBeTruthy();
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not render retry button if onRetry callback is not provided', () => {
      // Arrange
      const status = aSyncStatus({ state: 'queued', pendingCount: 2 });

      // Act
      render(<SyncStatusBadge status={status} />);

      // Assert
      expect(screen.queryByTestId('webhook-sync-indicator-retry-btn')).toBeNull();
    });
  });

  describe('State Rendering', () => {
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
      const retryBtn = screen.getByTestId('webhook-sync-indicator-retry-btn');
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
      const retryBtn = screen.getByTestId('webhook-sync-indicator-retry-btn');
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should safely render fallback count 0 when count properties are missing', () => {
      // Arrange
      const queuedStatus = aSyncStatus({ state: 'queued', pendingCount: undefined });
      const errorStatus = aSyncStatus({ state: 'error', failedCount: undefined });

      // Act
      const { rerender } = render(<SyncStatusBadge status={queuedStatus} />);
      expect(screen.getByText(/0/)).toBeTruthy();

      rerender(<SyncStatusBadge status={errorStatus} />);
      expect(screen.getByText(/0/)).toBeTruthy();
    });

    it('should correctly render all 4 supported sync states without errors', () => {
      const states: SyncStateType[] = ['idle', 'syncing', 'queued', 'error'];
      for (const state of states) {
        const { unmount } = render(<SyncStatusBadge status={aSyncStatus({ state, pendingCount: 1, failedCount: 1 })} />);
        expect(screen.getByTestId('webhook-sync-indicator')).toBeTruthy();
        unmount();
      }
    });
  });
});
