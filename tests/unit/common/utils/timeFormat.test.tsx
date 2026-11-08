// @vitest-environment jsdom
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import {
  isValidTimezone,
  resolveSystemTimezone,
  resolveEffectiveTimezone,
  getSupportedTimezones,
  formatDate,
  formatTime,
  formatDateTime,
  DEFAULT_TIMEZONE,
  FALLBACK_TIMEZONE,
} from '@common/utils/timeFormat';
import { useAppSettings } from '@common/hooks/useAppSettings';
import { PlatformCapabilitiesContext, type PlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { setupMatchMediaMock, setupLocalStorageMock } from '@tests/shared/mocks/browser-mocks';

const mockCaps: PlatformCapabilities = {
  dragRegionProps: {},
  canInspectDatabase: true,
  supportedLayouts: ['full'],
  defaultLayout: 'full',
  supportsTray: true,
  supportsAlwaysOnTop: true,
  supportsAutoStart: true,
  isPwaInstallable: false,
  isDesktop: true,
};

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PlatformCapabilitiesContext.Provider value={mockCaps}>
    {children}
  </PlatformCapabilitiesContext.Provider>
);

describe('timeFormat', () => {
  const origResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;

  afterEach(() => {
    Intl.DateTimeFormat.prototype.resolvedOptions = origResolvedOptions;
  });

  it('should return true when timezone is a valid IANA identifier', () => {
    // Arrange
    const tz = 'Europe/Warsaw';

    // Act
    const result = isValidTimezone(tz);

    // Assert
    expect(result).toBe(true);
  });

  it('should return false when timezone identifier is invalid', () => {
    // Arrange
    const tz = 'Invalid/Zone_Name';

    // Act
    const result = isValidTimezone(tz);

    // Assert
    expect(result).toBe(false);
  });

  it('should return false when timezone identifier is empty string', () => {
    // Arrange
    const tz = '';

    // Act
    const result = isValidTimezone(tz);

    // Assert
    expect(result).toBe(false);
  });

  it('should resolve system timezone when host provides a valid timezone', () => {
    // Arrange
    Intl.DateTimeFormat.prototype.resolvedOptions = () =>
      ({ timeZone: 'Europe/Warsaw' }) as Intl.ResolvedDateTimeFormatOptions;

    // Act
    const result = resolveSystemTimezone();

    // Assert
    expect(result).toBe('Europe/Warsaw');
  });

  it('should fallback to UTC when host system timezone is empty or invalid', () => {
    // Arrange
    Intl.DateTimeFormat.prototype.resolvedOptions = () =>
      ({ timeZone: '' }) as Intl.ResolvedDateTimeFormatOptions;

    // Act
    const result = resolveSystemTimezone();

    // Assert
    expect(result).toBe(FALLBACK_TIMEZONE);
  });

  it('should resolve host system timezone when preference is DEFAULT_TIMEZONE', () => {
    // Arrange
    Intl.DateTimeFormat.prototype.resolvedOptions = () =>
      ({ timeZone: 'Europe/Warsaw' }) as Intl.ResolvedDateTimeFormatOptions;

    // Act
    const result = resolveEffectiveTimezone(DEFAULT_TIMEZONE);

    // Assert
    expect(result).toBe('Europe/Warsaw');
  });

  it('should return configured timezone when preference is a valid timezone identifier', () => {
    // Arrange
    const preference = 'America/New_York';

    // Act
    const result = resolveEffectiveTimezone(preference);

    // Assert
    expect(result).toBe('America/New_York');
  });

  it('should fallback to system timezone when preference is an unrecognized timezone identifier', () => {
    // Arrange
    Intl.DateTimeFormat.prototype.resolvedOptions = () =>
      ({ timeZone: 'Europe/Warsaw' }) as Intl.ResolvedDateTimeFormatOptions;
    const invalidPreference = 'NonExistent/Zone';

    // Act
    const result = resolveEffectiveTimezone(invalidPreference);

    // Assert
    expect(result).toBe('Europe/Warsaw');
  });

  it('should include UTC in the list of supported timezones', () => {
    // Arrange / Act
    const timezones = getSupportedTimezones();

    // Assert
    expect(timezones).toContain('UTC');
  });

  it('should format date and time with target timezone offset', () => {
    // Arrange
    const iso = '2026-06-15T12:00:00.000Z';

    // Act
    const formatted = formatDateTime(iso, 'UTC');

    // Assert
    expect(formatted).toContain('12:00:00');
  });

  it('should format time shifted according to target timezone', () => {
    // Arrange
    const iso = '2026-06-15T12:00:00.000Z';

    // Act
    const formatted = formatTime(iso, 'Asia/Tokyo');

    // Assert
    expect(formatted).toBe('21:00:00');
  });

  it('should format date part correctly according to target timezone', () => {
    // Arrange
    const iso = '2026-06-15T12:00:00.000Z';

    // Act
    const formatted = formatDate(iso, 'UTC');

    // Assert
    expect(formatted).toContain('2026');
  });

  it('should return empty string when format input date is invalid', () => {
    // Arrange
    const invalidInput = 'not-a-valid-date';

    // Act
    const formatted = formatDateTime(invalidInput);

    // Assert
    expect(formatted).toBe('');
  });

  describe('Intl.DateTimeFormat error handling and fallback resilience', () => {
    it('should format safely and fall back to en when an invalid or malformed locale is provided', () => {
      // Arrange
      const iso = '2026-06-15T12:00:00.000Z';
      const malformedLocale = 'invalid-locale-@!#$%';

      // Act
      const formatted = formatDateTime(iso, 'UTC', malformedLocale);

      // Assert
      expect(formatted).not.toBe('');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('12:00:00');
    });

    it('should fall back to system timezone when an invalid timezone is provided to formatTime', () => {
      // Arrange
      const iso = '2026-06-15T12:00:00.000Z';
      const invalidTz = 'Mars/Base_Alpha';

      // Act
      const formatted = formatTime(iso, invalidTz);

      // Assert
      expect(formatted).not.toBe('');
      expect(formatted).toBe(formatTime(iso, resolveSystemTimezone()));
    });

    it('should return false for non-string or nullish timezone inputs in isValidTimezone', () => {
      // Assert
      expect(isValidTimezone(null as unknown as string)).toBe(false);
      expect(isValidTimezone(undefined as unknown as string)).toBe(false);
      expect(isValidTimezone(123 as unknown as string)).toBe(false);
    });
  });

  describe('Daylight Saving Time (DST) Transitions in Europe/Warsaw (CET/CEST)', () => {
    it('should correctly format standard winter time (CET, UTC+1)', () => {
      // Arrange - January 15: CET (UTC+1)
      const winterIso = '2026-01-15T12:00:00.000Z';

      // Act
      const formatted = formatTime(winterIso, 'Europe/Warsaw');

      // Assert: 12:00 UTC -> 13:00 CET
      expect(formatted).toBe('13:00:00');
    });

    it('should correctly format summer time (CEST, UTC+2)', () => {
      // Arrange - July 15: CEST (UTC+2)
      const summerIso = '2026-07-15T12:00:00.000Z';

      // Act
      const formatted = formatTime(summerIso, 'Europe/Warsaw');

      // Assert: 12:00 UTC -> 14:00 CEST
      expect(formatted).toBe('14:00:00');
    });

    it('should correctly handle spring DST switchover boundary (CET to CEST)', () => {
      // On Sunday, March 29, 2026:
      // At 01:00 UTC (02:00 CET), clocks jump to 03:00 CEST (UTC+2)
      const beforeSwitchUtc = '2026-03-29T00:59:00.000Z'; // 01:59:00 CET (UTC+1)
      const afterSwitchUtc = '2026-03-29T01:01:00.000Z';  // 03:01:00 CEST (UTC+2)

      // Act
      const formattedBefore = formatTime(beforeSwitchUtc, 'Europe/Warsaw');
      const formattedAfter = formatTime(afterSwitchUtc, 'Europe/Warsaw');

      // Assert
      expect(formattedBefore).toBe('01:59:00');
      expect(formattedAfter).toBe('03:01:00');
    });

    it('should correctly handle autumn DST switchover boundary (CEST to CET)', () => {
      // On Sunday, October 25, 2026:
      // At 01:00 UTC (03:00 CEST), clocks fall back to 02:00 CET (UTC+1)
      const beforeFallBackUtc = '2026-10-25T00:59:00.000Z'; // 02:59:00 CEST (UTC+2)
      const afterFallBackUtc = '2026-10-25T01:01:00.000Z';  // 02:01:00 CET (UTC+1)

      // Act
      const formattedBefore = formatTime(beforeFallBackUtc, 'Europe/Warsaw');
      const formattedAfter = formatTime(afterFallBackUtc, 'Europe/Warsaw');

      // Assert
      expect(formattedBefore).toBe('02:59:00');
      expect(formattedAfter).toBe('02:01:00');
    });
  });
});

describe('useAppSettings timezone persistence', () => {
  it('should initialize with system default timezone when storage is empty', () => {
    // Arrange
    setupMatchMediaMock(false);
    setupLocalStorageMock();

    // Act
    const { result } = renderHook(() => useAppSettings(), { wrapper });

    // Assert
    expect(result.current.timezone).toBe('System');
  });

  it('should persist and update timezone state when setTimezone is called', () => {
    // Arrange
    setupMatchMediaMock(false);
    setupLocalStorageMock();
    const { result } = renderHook(() => useAppSettings(), { wrapper });

    // Act
    act(() => {
      result.current.setTimezone('America/Chicago');
    });

    // Assert
    expect(result.current.timezone).toBe('America/Chicago');
    expect(localStorage.getItem('oxytime_timezone')).toBeNull();
  });
});
