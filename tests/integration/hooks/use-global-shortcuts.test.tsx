import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGlobalShortcuts } from '../../../src/hooks/useGlobalShortcuts';
import { useOxyAppState } from '../../../src/hooks/useOxyAppState';
import { LocaleProvider } from '../../../src/providers/LocaleProvider';
import { setupLocalStorageMock, setupMatchMediaMock } from '../../shared/test-helpers';
import React from 'react';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <LocaleProvider>{children}</LocaleProvider>
);

describe('Integration Tests: useGlobalShortcuts Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupLocalStorageMock();
    setupMatchMediaMock(false);
  });

  it('Given stopped timer, When Space key is pressed outside inputs, Then it starts the timer via app state integration', () => {
    const { result } = renderHook(() => {
      const state = useOxyAppState();
      useGlobalShortcuts({ onToggleTimer: state.handleToggleTimer });
      return state;
    }, { wrapper: Wrapper });

    expect(result.current.activeLog).toBeNull();

    const event = new KeyboardEvent('keydown', { code: 'Space', bubbles: true });
    Object.defineProperty(event, 'target', { value: document.createElement('div') });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(result.current.activeLog).not.toBeNull();
    expect(result.current.activeLog?.endTime).toBeNull();
  });

  it('Given running timer, When Space key is pressed outside inputs, Then it stops the timer via app state integration', () => {
    const { result } = renderHook(() => {
      const state = useOxyAppState();
      useGlobalShortcuts({ onToggleTimer: state.handleToggleTimer });
      return state;
    }, { wrapper: Wrapper });

    const event1 = new KeyboardEvent('keydown', { code: 'Space', bubbles: true });
    Object.defineProperty(event1, 'target', { value: document.createElement('div') });

    act(() => {
      window.dispatchEvent(event1);
    });
    expect(result.current.activeLog).not.toBeNull();

    const event2 = new KeyboardEvent('keydown', { code: 'Space', bubbles: true });
    Object.defineProperty(event2, 'target', { value: document.createElement('div') });

    act(() => {
      window.dispatchEvent(event2);
    });

    expect(result.current.activeLog).toBeNull();
  });

  it('Given stopped timer, When Space key is pressed inside input, Then timer does not start', () => {
    const { result } = renderHook(() => {
      const state = useOxyAppState();
      useGlobalShortcuts({ onToggleTimer: state.handleToggleTimer });
      return state;
    }, { wrapper: Wrapper });

    expect(result.current.activeLog).toBeNull();

    const event = new KeyboardEvent('keydown', { code: 'Space', bubbles: true });
    Object.defineProperty(event, 'target', { value: document.createElement('input') });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(result.current.activeLog).toBeNull();
  });

  it('Given stopped timer, When Ctrl+Space keys are pressed inside input, Then it starts the timer', () => {
    const { result } = renderHook(() => {
      const state = useOxyAppState();
      useGlobalShortcuts({ onToggleTimer: state.handleToggleTimer });
      return state;
    }, { wrapper: Wrapper });

    expect(result.current.activeLog).toBeNull();

    const event = new KeyboardEvent('keydown', { code: 'Space', ctrlKey: true, bubbles: true });
    Object.defineProperty(event, 'target', { value: document.createElement('input') });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(result.current.activeLog).not.toBeNull();
  });
});
