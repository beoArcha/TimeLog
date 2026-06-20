import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGlobalShortcuts } from '../../../src/hooks/useGlobalShortcuts';

describe('Unit Tests: useGlobalShortcuts Hook', () => {
  const onToggleTimer = vi.fn();

  beforeEach(() => {
    onToggleTimer.mockClear();
  });

  it('should_call_onToggleTimer_when_Space_is_pressed_outside_inputs', () => {
    renderHook(() => useGlobalShortcuts({ onToggleTimer }));

    const event = new KeyboardEvent('keydown', { code: 'Space' });
    Object.defineProperty(event, 'target', { value: document.createElement('div') });
    window.dispatchEvent(event);

    expect(onToggleTimer).toHaveBeenCalled();
  });

  it('should_not_call_onToggleTimer_when_Space_is_pressed_inside_input', () => {
    renderHook(() => useGlobalShortcuts({ onToggleTimer }));

    const event = new KeyboardEvent('keydown', { code: 'Space' });
    Object.defineProperty(event, 'target', { value: document.createElement('input') });
    window.dispatchEvent(event);

    expect(onToggleTimer).not.toHaveBeenCalled();
  });

  it('should_call_onToggleTimer_when_Ctrl_Space_is_pressed_inside_input', () => {
    renderHook(() => useGlobalShortcuts({ onToggleTimer }));

    const event = new KeyboardEvent('keydown', { code: 'Space', ctrlKey: true });
    Object.defineProperty(event, 'target', { value: document.createElement('input') });
    window.dispatchEvent(event);

    expect(onToggleTimer).toHaveBeenCalled();
  });
});
