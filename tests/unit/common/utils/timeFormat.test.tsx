// @vitest-environment jsdom
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  isValidTimezone,
  resolveSystemTimezone,
  resolveEffectiveTimezone,
  getSupportedTimezones,
  formatDate,
  formatTime,
  formatDateTime,
  formatDateTimeInTimezone,
  parseDateTimeInTimezone,
  DEFAULT_TIMEZONE,
  FALLBACK_TIMEZONE,
  getSafeDateTimeFormat,
  clearDateTimeFormatCache,
} from '@common/utils/timeFormat';
import { ErrorHandler } from '@common/exceptions/ErrorHandler';
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

  describe('Intl.DateTimeFormat error handling, fallback resilience, and error propagation', () => {
    afterEach(() => {
      clearDateTimeFormatCache();
      vi.restoreAllMocks();
    });

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

    it('should log via ErrorHandler and propagate unexpected errors in isValidTimezone', () => {
      const unexpectedError = new TypeError('Intl runtime failure');
      const origDateTimeFormat = Intl.DateTimeFormat;
      const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle');

      // @ts-expect-error mocking constructor
      Intl.DateTimeFormat = function () {
        throw unexpectedError;
      };

      try {
        expect(() => isValidTimezone('UTC')).toThrow(unexpectedError);
        expect(errorHandlerSpy).toHaveBeenCalledWith(unexpectedError);
      } finally {
        Intl.DateTimeFormat = origDateTimeFormat;
      }
    });

    it('should log via ErrorHandler and propagate unexpected errors in resolveSystemTimezone', () => {
      const unexpectedError = new TypeError('Cannot resolve system options');
      const origResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
      const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle');

      Intl.DateTimeFormat.prototype.resolvedOptions = () => {
        throw unexpectedError;
      };

      try {
        expect(() => resolveSystemTimezone()).toThrow(unexpectedError);
        expect(errorHandlerSpy).toHaveBeenCalledWith(unexpectedError);
      } finally {
        Intl.DateTimeFormat.prototype.resolvedOptions = origResolvedOptions;
      }
    });

    it('should log via ErrorHandler and propagate unexpected errors in resolveEffectiveTimezone', () => {
      const unexpectedError = new Error('Unexpected resolution exception');
      const origResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
      const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle');

      Intl.DateTimeFormat.prototype.resolvedOptions = () => {
        throw unexpectedError;
      };

      try {
        expect(() => resolveEffectiveTimezone('System')).toThrow(unexpectedError);
        expect(errorHandlerSpy).toHaveBeenCalledWith(unexpectedError);
        expect(errorHandlerSpy).toHaveBeenCalledTimes(1);
      } finally {
        Intl.DateTimeFormat.prototype.resolvedOptions = origResolvedOptions;
      }
    });

    it('should log a nested timezone validation failure exactly once', () => {
      const unexpectedError = new TypeError('Intl timezone validation failure');
      const originalDateTimeFormat = Intl.DateTimeFormat;
      const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle');

      // @ts-expect-error mocking Intl constructor
      Intl.DateTimeFormat = function (...args: unknown[]) {
        if (args.length === 0) {
          return {
            resolvedOptions: () => ({ timeZone: 'Europe/Warsaw' }),
          };
        }
        throw unexpectedError;
      };

      try {
        expect(() => resolveEffectiveTimezone('System')).toThrow(unexpectedError);
        expect(errorHandlerSpy).toHaveBeenCalledWith(unexpectedError);
        expect(errorHandlerSpy).toHaveBeenCalledTimes(1);
      } finally {
        Intl.DateTimeFormat = originalDateTimeFormat;
      }
    });

    it('should log via ErrorHandler and propagate unexpected errors in getSupportedTimezones', () => {
      const origSupportedValuesOf = Intl.supportedValuesOf;
      const unexpectedError = new Error('Internal V8 failure');
      const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle');

      Intl.supportedValuesOf = () => {
        throw unexpectedError;
      };

      try {
        expect(() => getSupportedTimezones()).toThrow(unexpectedError);
        expect(errorHandlerSpy).toHaveBeenCalledWith(unexpectedError);
      } finally {
        Intl.supportedValuesOf = origSupportedValuesOf;
      }
    });

    it('should log via ErrorHandler and propagate unexpected errors in getSafeDateTimeFormat', () => {
      const unexpectedError = new TypeError('Invalid options prototype');
      const origDateTimeFormat = Intl.DateTimeFormat;
      const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle');

      // @ts-expect-error mocking constructor
      Intl.DateTimeFormat = function () {
        throw unexpectedError;
      };

      try {
        expect(() => getSafeDateTimeFormat('en', {})).toThrow(unexpectedError);
        expect(errorHandlerSpy).toHaveBeenCalledWith(unexpectedError);
      } finally {
        Intl.DateTimeFormat = origDateTimeFormat;
      }
    });

    it('should log via ErrorHandler and propagate unexpected errors in formatDateTime, formatDate, formatTime', () => {
      const iso = '2026-06-15T12:00:00.000Z';
      const unexpectedError = new Error('Unexpected format error');
      const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle');

      const desc = Object.getOwnPropertyDescriptor(Intl.DateTimeFormat.prototype, 'format');
      Object.defineProperty(Intl.DateTimeFormat.prototype, 'format', {
        configurable: true,
        get() {
          return () => {
            throw unexpectedError;
          };
        },
      });

      try {
        clearDateTimeFormatCache();
        expect(() => formatDateTime(iso, 'UTC')).toThrow(unexpectedError);
        expect(errorHandlerSpy).toHaveBeenCalledWith(unexpectedError);

        clearDateTimeFormatCache();
        expect(() => formatDate(iso, 'UTC')).toThrow(unexpectedError);
        expect(errorHandlerSpy).toHaveBeenCalledWith(unexpectedError);

        clearDateTimeFormatCache();
        expect(() => formatTime(iso, 'UTC')).toThrow(unexpectedError);
        expect(errorHandlerSpy).toHaveBeenCalledWith(unexpectedError);
      } finally {
        if (desc) {
          Object.defineProperty(Intl.DateTimeFormat.prototype, 'format', desc);
        }
        clearDateTimeFormatCache();
      }
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

describe('formatDateTimeInTimezone and parseDateTimeInTimezone', () => {
  it('should format UTC timestamp to localized input string across various timezones', () => {
    const utcIso = '2026-06-15T10:00:00.000Z';

    // Europe/Warsaw in June is CEST (UTC+2)
    expect(formatDateTimeInTimezone(utcIso, 'Europe/Warsaw')).toBe('2026-06-15 12:00:00');

    // America/New_York in June is EDT (UTC-4)
    expect(formatDateTimeInTimezone(utcIso, 'America/New_York')).toBe('2026-06-15 06:00:00');

    // Asia/Tokyo is UTC+9
    expect(formatDateTimeInTimezone(utcIso, 'Asia/Tokyo')).toBe('2026-06-15 19:00:00');

    // UTC
    expect(formatDateTimeInTimezone(utcIso, 'UTC')).toBe('2026-06-15 10:00:00');

    // Empty/invalid input
    expect(formatDateTimeInTimezone(null, 'UTC')).toBe('');
    expect(formatDateTimeInTimezone('', 'UTC')).toBe('');
    expect(formatDateTimeInTimezone('invalid', 'UTC')).toBe('');
  });

  it('should parse local date-time string in target timezone back to exact UTC Date', () => {
    // 12:00:00 in Europe/Warsaw (CEST, UTC+2) -> 10:00:00Z
    const d1 = parseDateTimeInTimezone('2026-06-15 12:00:00', 'Europe/Warsaw');
    expect(d1?.toISOString()).toBe('2026-06-15T10:00:00.000Z');

    // 06:00:00 in America/New_York (EDT, UTC-4) -> 10:00:00Z
    const d2 = parseDateTimeInTimezone('2026-06-15 06:00:00', 'America/New_York');
    expect(d2?.toISOString()).toBe('2026-06-15T10:00:00.000Z');

    // With T separator
    const d3 = parseDateTimeInTimezone('2026-06-15T19:00:00', 'Asia/Tokyo');
    expect(d3?.toISOString()).toBe('2026-06-15T10:00:00.000Z');

    // Without seconds (defaults to 00)
    const d4 = parseDateTimeInTimezone('2026-06-15 12:00', 'Europe/Warsaw');
    expect(d4?.toISOString()).toBe('2026-06-15T10:00:00.000Z');

    // Explicit UTC ISO string
    const d5 = parseDateTimeInTimezone('2026-06-15T10:00:00Z', 'Europe/Warsaw');
    expect(d5?.toISOString()).toBe('2026-06-15T10:00:00.000Z');
  });

  it('should return null for malformed or calendar-impossible date-time strings', () => {
    expect(parseDateTimeInTimezone('')).toBeNull();
    expect(parseDateTimeInTimezone('not-a-date')).toBeNull();
    expect(parseDateTimeInTimezone('2026-02-30 12:00:00')).toBeNull(); // Feb 30 does not exist
    expect(parseDateTimeInTimezone('2026-04-31 12:00:00')).toBeNull(); // April 31 does not exist
    expect(parseDateTimeInTimezone('2026-13-01 12:00:00')).toBeNull(); // Month 13
    expect(parseDateTimeInTimezone('2026-06-15 25:00:00')).toBeNull(); // Hour 25
    expect(parseDateTimeInTimezone('2026-06-15 12:60:00')).toBeNull(); // Minute 60
  });

  it('should round-trip cleanly between formatting and parsing across seasons and timezones', () => {
    const originalUtc = '2026-01-15T15:30:00.000Z'; // Winter
    const timezones = ['Europe/Warsaw', 'America/New_York', 'Asia/Tokyo', 'UTC'];

    for (const tz of timezones) {
      const formatted = formatDateTimeInTimezone(originalUtc, tz);
      const parsed = parseDateTimeInTimezone(formatted, tz);
      expect(parsed?.toISOString()).toBe(originalUtc);
    }
  });

  it('should reject non-existent local times during the spring DST transition', () => {
    // Warsaw skips 02:00–02:59 when clocks move forward on 2026-03-29.
    expect(parseDateTimeInTimezone('2026-03-29 01:59:59', 'Europe/Warsaw')?.toISOString())
      .toBe('2026-03-29T00:59:59.000Z');
    expect(parseDateTimeInTimezone('2026-03-29 02:00:00', 'Europe/Warsaw')).toBeNull();
    expect(parseDateTimeInTimezone('2026-03-29 02:30:00', 'Europe/Warsaw')).toBeNull();
    expect(parseDateTimeInTimezone('2026-03-29 02:59:59', 'Europe/Warsaw')).toBeNull();
    expect(parseDateTimeInTimezone('2026-03-29 03:00:00', 'Europe/Warsaw')?.toISOString())
      .toBe('2026-03-29T01:00:00.000Z');
  });

  it('should reject ambiguous local times during the autumn DST transition', () => {
    // Warsaw repeats 02:00–02:59 when clocks move backward on 2026-10-25.
    expect(parseDateTimeInTimezone('2026-10-25 01:59:59', 'Europe/Warsaw')?.toISOString())
      .toBe('2026-10-24T23:59:59.000Z');
    expect(parseDateTimeInTimezone('2026-10-25 02:00:00', 'Europe/Warsaw')).toBeNull();
    expect(parseDateTimeInTimezone('2026-10-25 02:30:00', 'Europe/Warsaw')).toBeNull();
    expect(parseDateTimeInTimezone('2026-10-25 02:59:59', 'Europe/Warsaw')).toBeNull();
    expect(parseDateTimeInTimezone('2026-10-25 03:00:00', 'Europe/Warsaw')?.toISOString())
      .toBe('2026-10-25T02:00:00.000Z');
  });

  it('should reject non-existent and ambiguous times in a non-European timezone', () => {
    // New York skips 02:00–02:59 on 2026-03-08 and repeats it on 2026-11-01.
    expect(parseDateTimeInTimezone('2026-03-08 02:30:00', 'America/New_York')).toBeNull();
    expect(parseDateTimeInTimezone('2026-11-01 01:30:00', 'America/New_York')).toBeNull();
  });

  it('should handle non-hour DST transitions without inventing a local time', () => {
    // Lord Howe Island advances clocks by 30 minutes, skipping 02:00–02:29.
    expect(parseDateTimeInTimezone('2026-10-04 02:15:00', 'Australia/Lord_Howe')).toBeNull();
    expect(parseDateTimeInTimezone('2026-10-04 02:30:00', 'Australia/Lord_Howe')?.toISOString())
      .toBe('2026-10-03T15:30:00.000Z');
  });

  it('should reject a completely skipped civil date', () => {
    // Samoa skipped 2011-12-30 when it moved across the international date line.
    expect(parseDateTimeInTimezone('2011-12-30 12:00:00', 'Pacific/Apia')).toBeNull();
  });

  it('should preserve exact instants when an explicit UTC offset disambiguates a repeated hour', () => {
    expect(parseDateTimeInTimezone('2026-10-25T02:30:00+02:00', 'Europe/Warsaw')?.toISOString())
      .toBe('2026-10-25T00:30:00.000Z');
    expect(parseDateTimeInTimezone('2026-10-25T02:30:00+01:00', 'Europe/Warsaw')?.toISOString())
      .toBe('2026-10-25T01:30:00.000Z');
    expect(parseDateTimeInTimezone('2026-10-25T00:30:00Z', 'Europe/Warsaw')?.toISOString())
      .toBe('2026-10-25T00:30:00.000Z');
  });

  it('should accept leap days and reject invalid leap-day dates', () => {
    expect(parseDateTimeInTimezone('2024-02-29 12:00:00', 'UTC')?.toISOString())
      .toBe('2024-02-29T12:00:00.000Z');
    expect(parseDateTimeInTimezone('2025-02-29 12:00:00', 'UTC')).toBeNull();
  });

  it('should preserve local dates across year and month boundaries', () => {
    expect(parseDateTimeInTimezone('2026-01-01 00:30:00', 'America/Los_Angeles')?.toISOString())
      .toBe('2026-01-01T08:30:00.000Z');
    expect(parseDateTimeInTimezone('2026-12-31 23:30:00', 'Asia/Tokyo')?.toISOString())
      .toBe('2026-12-31T14:30:00.000Z');
  });

});

