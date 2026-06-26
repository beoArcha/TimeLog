import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGlobalShortcuts } from '@common/hooks/useGlobalShortcuts';
import { TEST_CONSTANTS } from '../../shared/test-constants';

describe('Unit Tests: useGlobalShortcuts Hook', () => {
  const onToggleTimer = vi.fn();

  beforeEach(() => {
    onToggleTimer.mockClear();
  });

  it('should_call_onToggleTimer_when_Space_is_pressed_outside_inputs', () => {
    renderHook(() => useGlobalShortcuts({ onToggleTimer }));

    const event = new KeyboardEvent(TEST_CONSTANTS.EVENT_KEYDOWN, { code: TEST_CONSTANTS.KEY_SPACE });
    Object.defineProperty(event, 'target', { value: document.createElement('div') });
    window.dispatchEvent(event);

    expect(onToggleTimer).toHaveBeenCalled();
  });

  it('should_not_call_onToggleTimer_when_Space_is_pressed_inside_input', () => {
    renderHook(() => useGlobalShortcuts({ onToggleTimer }));

    const event = new KeyboardEvent(TEST_CONSTANTS.EVENT_KEYDOWN, { code: TEST_CONSTANTS.KEY_SPACE });
    Object.defineProperty(event, 'target', { value: document.createElement(TEST_CONSTANTS.TAG_INPUT) });
    window.dispatchEvent(event);

    expect(onToggleTimer).not.toHaveBeenCalled();
  });

  it('should_call_onToggleTimer_when_Ctrl_Space_is_pressed_inside_input', () => {
    renderHook(() => useGlobalShortcuts({ onToggleTimer }));

    const event = new KeyboardEvent(TEST_CONSTANTS.EVENT_KEYDOWN, { code: TEST_CONSTANTS.KEY_SPACE, ctrlKey: true });
    Object.defineProperty(event, 'target', { value: document.createElement(TEST_CONSTANTS.TAG_INPUT) });
    window.dispatchEvent(event);

    expect(onToggleTimer).toHaveBeenCalled();
  });
});
