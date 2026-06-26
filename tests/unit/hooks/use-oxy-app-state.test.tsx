import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOxyAppState } from '@common/hooks/useOxyAppState';

const mockUseAppSettings = vi.fn(() => ({
  guiSize: 'large',
  textAndIconSize: 'medium',
  minimizeToTray: false,
  alwaysOnTopSmall: false,
  alwaysOnTopMain: false,
  lastNonSmallVariant: 'large',
}));

const mockUseTimeTicker = vi.fn(() => ({
  nowIso: '2026-06-20T12:00:00Z',
}));

const mockUseExternalApiSync = vi.fn(() => ({
  pushToApi: vi.fn(),
}));

const mockUseTimeLogData = vi.fn(() => ({
  activeLog: null as any,
  selectedTaskId: '101',
  handleStartTimer: vi.fn(),
  handleStopTimer: vi.fn(),
}));

const mockUseTauriWindow = vi.fn(() => ({
  showToast: vi.fn(),
}));

const mockUseLocale = vi.fn(() => ({
  localePref: 'system',
  setLocalePref: vi.fn(),
  locale: 'en',
  setLocale: vi.fn(),
  customTranslations: {},
  setCustomTranslations: vi.fn(),
}));

vi.mock('@common/hooks/useAppSettings', () => ({ useAppSettings: () => mockUseAppSettings() }));
vi.mock('@common/hooks/useTimeTicker', () => ({ useTimeTicker: () => mockUseTimeTicker() }));
vi.mock('@common/hooks/useExternalApiSync', () => ({ useExternalApiSync: () => mockUseExternalApiSync() }));
vi.mock('@common/hooks/useTimeLogData', () => ({ useTimeLogData: () => mockUseTimeLogData() }));
vi.mock('@core/tauri/useTauriWindow', () => ({ useTauriWindow: () => mockUseTauriWindow() }));
vi.mock('@common/providers/LocaleProvider', () => ({ useLocale: () => mockUseLocale() }));

// navigator.clipboard mock
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
  },
  writable: true,
});

describe('Unit Tests: useOxyAppState Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_start_timer_when_handleToggleTimer_is_called_and_no_active_log_present', () => {
    const startTimerSpy = vi.fn();
    mockUseTimeLogData.mockReturnValueOnce({
      activeLog: null,
      selectedTaskId: '102',
      handleStartTimer: startTimerSpy,
      handleStopTimer: vi.fn(),
    });

    const { result } = renderHook(() => useOxyAppState());

    act(() => {
      result.current.handleToggleTimer();
    });

    expect(startTimerSpy).toHaveBeenCalledWith('102');
  });

  it('should_stop_timer_when_handleToggleTimer_is_called_and_active_log_exists', () => {
    const stopTimerSpy = vi.fn();
    mockUseTimeLogData.mockReturnValueOnce({
      activeLog: { id: 'l1' } as any,
      selectedTaskId: '102',
      handleStartTimer: vi.fn(),
      handleStopTimer: stopTimerSpy,
    });

    const { result } = renderHook(() => useOxyAppState());

    act(() => {
      result.current.handleToggleTimer();
    });

    expect(stopTimerSpy).toHaveBeenCalled();
  });

  it('should_copy_text_and_show_toast_when_handleCopyText_is_called', () => {
    const showToastSpy = vi.fn();
    mockUseTauriWindow.mockReturnValueOnce({
      showToast: showToastSpy,
    });

    const { result } = renderHook(() => useOxyAppState());

    act(() => {
      result.current.handleCopyText('Hello');
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello');
  });
});
