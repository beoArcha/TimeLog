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
