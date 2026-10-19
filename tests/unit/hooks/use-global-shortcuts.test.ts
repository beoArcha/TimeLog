import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGlobalShortcuts } from '@common/hooks/useGlobalShortcuts';
import { TEST_CONSTANTS } from '@tests/shared/test-constants';

describe('Unit Tests: useGlobalShortcuts Hook', () => {
  const onToggleTimer = vi.fn();
  const onSwitchTab = vi.fn();
  const onEscape = vi.fn();

  beforeEach(() => {
    onToggleTimer.mockClear();
    onSwitchTab.mockClear();
    onEscape.mockClear();
  });

  it('should call onToggleTimer when Space is pressed outside inputs', () => {
    // Arrange
    renderHook(() => useGlobalShortcuts({ onToggleTimer }));

    // Act
    const event = new KeyboardEvent(TEST_CONSTANTS.EVENT_KEYDOWN, { code: TEST_CONSTANTS.KEY_SPACE });
    Object.defineProperty(event, 'target', { value: document.createElement('div') });
    window.dispatchEvent(event);

    // Assert
    expect(onToggleTimer).toHaveBeenCalled();
  });

  it('should not call onToggleTimer when Space is pressed inside input', () => {
    // Arrange
    renderHook(() => useGlobalShortcuts({ onToggleTimer }));

    // Act
    const event = new KeyboardEvent(TEST_CONSTANTS.EVENT_KEYDOWN, { code: TEST_CONSTANTS.KEY_SPACE });
    Object.defineProperty(event, 'target', { value: document.createElement(TEST_CONSTANTS.TAG_INPUT) });
    window.dispatchEvent(event);

    // Assert
    expect(onToggleTimer).not.toHaveBeenCalled();
  });

  it('should call onToggleTimer when Ctrl Space is pressed inside input', () => {
    // Arrange
    renderHook(() => useGlobalShortcuts({ onToggleTimer }));

    // Act
    const event = new KeyboardEvent(TEST_CONSTANTS.EVENT_KEYDOWN, { code: TEST_CONSTANTS.KEY_SPACE, ctrlKey: true });
    Object.defineProperty(event, 'target', { value: document.createElement(TEST_CONSTANTS.TAG_INPUT) });
    window.dispatchEvent(event);

    // Assert
    expect(onToggleTimer).toHaveBeenCalled();
  });

  it('should call onSwitchTab with index 0 when Alt Digit1 is pressed', () => {
    // Arrange
    renderHook(() => useGlobalShortcuts({ onToggleTimer, onSwitchTab }));

    // Act
    const event = new KeyboardEvent(TEST_CONSTANTS.EVENT_KEYDOWN, { code: TEST_CONSTANTS.KEY_DIGIT1, altKey: true });
    Object.defineProperty(event, 'target', { value: document.createElement('div') });
    window.dispatchEvent(event);

    // Assert
    expect(onSwitchTab).toHaveBeenCalledWith(0);
  });

  it('should call onSwitchTab with index 3 when Alt Digit4 is pressed', () => {
    // Arrange
    renderHook(() => useGlobalShortcuts({ onToggleTimer, onSwitchTab }));

    // Act
    const event = new KeyboardEvent(TEST_CONSTANTS.EVENT_KEYDOWN, { code: TEST_CONSTANTS.KEY_DIGIT4, altKey: true });
    Object.defineProperty(event, 'target', { value: document.createElement('div') });
    window.dispatchEvent(event);

    // Assert
    expect(onSwitchTab).toHaveBeenCalledWith(3);
  });

  it('should call onEscape when Escape is pressed outside inputs', () => {
    // Arrange
    renderHook(() => useGlobalShortcuts({ onToggleTimer, onEscape }));

    // Act
    const event = new KeyboardEvent(TEST_CONSTANTS.EVENT_KEYDOWN, { code: TEST_CONSTANTS.KEY_ESCAPE });
    Object.defineProperty(event, 'target', { value: document.createElement('div') });
    window.dispatchEvent(event);

    // Assert
    expect(onEscape).toHaveBeenCalled();
  });

  it('should not call onEscape when Escape is pressed inside input', () => {
    // Arrange
    renderHook(() => useGlobalShortcuts({ onToggleTimer, onEscape }));

    // Act
    const event = new KeyboardEvent(TEST_CONSTANTS.EVENT_KEYDOWN, { code: TEST_CONSTANTS.KEY_ESCAPE });
    Object.defineProperty(event, 'target', { value: document.createElement(TEST_CONSTANTS.TAG_INPUT) });
    window.dispatchEvent(event);

    // Assert
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('should call onToggleCliDrawer when Ctrl Backquote is pressed', () => {
    // Arrange
    const onToggleCliDrawer = vi.fn();
    renderHook(() => useGlobalShortcuts({ onToggleTimer, onToggleCliDrawer }));

    // Act
    const event = new KeyboardEvent(TEST_CONSTANTS.EVENT_KEYDOWN, {
      code: 'Backquote',
      key: '`',
      ctrlKey: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'target', { value: document.createElement('div') });
    window.dispatchEvent(event);

    // Assert
    expect(onToggleCliDrawer).toHaveBeenCalled();
  });
});
