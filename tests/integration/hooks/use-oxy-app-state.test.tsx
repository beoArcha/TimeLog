import {
  setupLocalStorageMock,
  setupMatchMediaMock,
} from '@tests/shared/test-helpers';

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOxyAppState } from '@common/hooks/useOxyAppState';
import { LocaleProvider } from '@common/hooks/LocaleProvider';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <LocaleProvider>{children}</LocaleProvider>
);

describe('Integration Tests: useOxyAppState Hook Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupLocalStorageMock();
    setupMatchMediaMock(false);

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  it('should initialize and share state across all integrated sub-hooks', async () => {
    const { result } = renderHook(() => useOxyAppState(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.activeTab).toBe('gui');
    expect(result.current.locale).toBe('en');
  });

  it('should correctly handle toggle timer and update active log state', async () => {
    const { result } = renderHook(() => useOxyAppState(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    expect(result.current.activeLog).toBeNull();
    expect(result.current.selectedTaskId).toBe('102');

    await act(async () => {
      await result.current.handleToggleTimer();
    });

    expect(result.current.activeLog).not.toBeNull();
    expect(result.current.activeLog?.taskId).toBe('102');

    await act(async () => {
      await result.current.handleToggleTimer();
    });

    expect(result.current.activeLog).toBeNull();
  });

  it('should copy text to clipboard and trigger localized toast notification', async () => {
    const { result } = renderHook(() => useOxyAppState(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    await act(async () => {
      await result.current.handleCopyText('Vibe Code Test');
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Vibe Code Test');
    expect(result.current.trayNotification).toBe('Copied to clipboard!');
  });
});
