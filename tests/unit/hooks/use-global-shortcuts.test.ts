import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGlobalShortcuts } from '@common/hooks/useGlobalShortcuts';
import { TEST_CONSTANTS } from '../../shared/test-constants';

describe('Unit Tests: useGlobalShortcuts Hook', () => {
  const onToggleTimer = vi.fn();
  const onSwitchTab = vi.fn();
  const onEscape = vi.fn();

  beforeEach(() => {
    onToggleTimer.mockClear();
    onSwitchTab.mockClear();
    onEscape.mockClear();
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

  it('should_call_onSwitchTab_with_index_0_when_Alt_Digit1_is_pressed', () => {
    renderHook(() => useGlobalShortcuts({ onToggleTimer, onSwitchTab }));

    const event = new KeyboardEvent(TEST_CONSTANTS.EVENT_KEYDOWN, { code: TEST_CONSTANTS.KEY_DIGIT1, altKey: true });
    Object.defineProperty(event, 'target', { value: document.createElement('div') });
    window.dispatchEvent(event);

    expect(onSwitchTab).toHaveBeenCalledWith(0);
  });

  it('should_call_onSwitchTab_with_index_3_when_Alt_Digit4_is_pressed', () => {
    renderHook(() => useGlobalShortcuts({ onToggleTimer, onSwitchTab }));

    const event = new KeyboardEvent(TEST_CONSTANTS.EVENT_KEYDOWN, { code: TEST_CONSTANTS.KEY_DIGIT4, altKey: true });
    Object.defineProperty(event, 'target', { value: document.createElement('div') });
    window.dispatchEvent(event);

    expect(onSwitchTab).toHaveBeenCalledWith(3);
  });

  it('should_call_onEscape_when_Escape_is_pressed_outside_inputs', () => {
    renderHook(() => useGlobalShortcuts({ onToggleTimer, onEscape }));

    const event = new KeyboardEvent(TEST_CONSTANTS.EVENT_KEYDOWN, { code: TEST_CONSTANTS.KEY_ESCAPE });
    Object.defineProperty(event, 'target', { value: document.createElement('div') });
    window.dispatchEvent(event);

    expect(onEscape).toHaveBeenCalled();
  });

  it('should_not_call_onEscape_when_Escape_is_pressed_inside_input', () => {
    renderHook(() => useGlobalShortcuts({ onToggleTimer, onEscape }));

    const event = new KeyboardEvent(TEST_CONSTANTS.EVENT_KEYDOWN, { code: TEST_CONSTANTS.KEY_ESCAPE });
    Object.defineProperty(event, 'target', { value: document.createElement(TEST_CONSTANTS.TAG_INPUT) });
    window.dispatchEvent(event);

    expect(onEscape).not.toHaveBeenCalled();
  });
});
