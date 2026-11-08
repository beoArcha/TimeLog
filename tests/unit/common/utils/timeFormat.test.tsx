// @vitest-environment jsdom
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import {
  isValidTimezone, resolveSystemTimezone, resolveEffectiveTimezone,
  getSupportedTimezones, formatDate, formatTime, formatDateTime,
  DEFAULT_TIMEZONE, FALLBACK_TIMEZONE,
} from '@common/utils/timeFormat';
import { useAppSettings } from '@common/hooks/useAppSettings';
import { PlatformCapabilitiesContext, type PlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { setupMatchMediaMock, setupLocalStorageMock } from '@tests/shared/mocks/browser-mocks';

const mockCaps: PlatformCapabilities = {
  dragRegionProps: {}, canInspectDatabase: true, supportedLayouts: ['full'],
  defaultLayout: 'full', supportsTray: true, supportsAlwaysOnTop: true,
  supportsAutoStart: true, isPwaInstallable: false, isDesktop: true,
};
const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PlatformCapabilitiesContext.Provider value={mockCaps}>{children}</PlatformCapabilitiesContext.Provider>
);

describe('Unit Tests: timeFormat & useAppSettings Timezone (AAA)', () => {
  const origResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
  afterEach(() => { Intl.DateTimeFormat.prototype.resolvedOptions = origResolvedOptions; });

  it('validates IANA timezones and resolves system/effective timezone with fallback', () => {
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('Invalid/Zone')).toBe(false);
    Intl.DateTimeFormat.prototype.resolvedOptions = () => ({ timeZone: 'Europe/Warsaw' }) as Intl.ResolvedDateTimeFormatOptions;
    expect(resolveEffectiveTimezone(DEFAULT_TIMEZONE)).toBe('Europe/Warsaw');
    Intl.DateTimeFormat.prototype.resolvedOptions = () => ({ timeZone: '' }) as Intl.ResolvedDateTimeFormatOptions;
    expect(resolveSystemTimezone()).toBe(FALLBACK_TIMEZONE);
    expect(resolveEffectiveTimezone('Bad/Zone')).toBe(FALLBACK_TIMEZONE);
  });

  it('provides supported timezones and formats dates accurately with timezone shift', () => {
    expect(getSupportedTimezones()).toContain('UTC');
    const iso = '2026-06-15T12:00:00.000Z';
    expect(formatDateTime(iso, 'UTC')).toContain('12:00:00');
    expect(formatTime(iso, 'Asia/Tokyo')).toBe('21:00:00');
    expect(formatDate(iso, 'UTC')).toContain('2026');
    expect(formatDateTime('invalid')).toBe('');
  });

  it('persists and resolves timezone in useAppSettings hook', () => {
    setupMatchMediaMock(false);
    setupLocalStorageMock();
    const { result } = renderHook(() => useAppSettings(), { wrapper });
    expect(result.current.timezone).toBe('System');
    act(() => { result.current.setTimezone('America/Chicago'); });
    expect(result.current.timezone).toBe('America/Chicago');
    expect(localStorage.getItem('oxytime_timezone')).toBe('America/Chicago');
  });
});
