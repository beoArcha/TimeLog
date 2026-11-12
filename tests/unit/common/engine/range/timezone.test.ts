import { describe, it, expect, vi, afterEach } from 'vitest';
import { isKnownTimeZone, resolveTimezone } from '@common/engine/range/timezone';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isKnownTimeZone', () => {
  it.each(['Europe/Warsaw', 'America/New_York', 'America/Port-au-Prince', 'UTC', 'Etc/GMT+5', 'US/Eastern'])(
    'should accept %s when it is spelled like the IANA database',
    (name) => {
      // Arrange
      const candidate = name;

      // Act
      const result = isKnownTimeZone(candidate);

      // Assert
      expect(result).toBe(true);
    },
  );

  it.each(['europe/warsaw', 'EUROPE/WARSAW', 'utc', 'us/eastern', 'Europe/warsaw'])(
    'should reject %s when only the letter case differs from a real name',
    (name) => {
      // Arrange
      const candidate = name;

      // Act
      const result = isKnownTimeZone(candidate);

      // Assert
      expect(result).toBe(false);
    },
  );

  it.each(['Mars/Olympus', '+01:00', '-05:00', '', 'Warsaw'])('should reject "%s" when it is not a zone name', (name) => {
    // Arrange
    const candidate = name;

    // Act
    const result = isKnownTimeZone(candidate);

    // Assert
    expect(result).toBe(false);
  });
});

describe('resolveTimezone', () => {
  it('should prefer the explicit zone when the setting is also present', () => {
    // Arrange
    const [explicit, setting] = ['America/New_York', 'Europe/Warsaw'];

    // Act
    const result = resolveTimezone(explicit, setting);

    // Assert
    expect(result).toBe('America/New_York');
  });

  it('should fall back to the setting when the explicit value is blank', () => {
    // Arrange
    const explicit = '   ';

    // Act
    const result = resolveTimezone(explicit, 'Asia/Tokyo');

    // Assert
    expect(result).toBe('Asia/Tokyo');
  });

  it('should echo the trimmed name when the input has surrounding whitespace', () => {
    // Arrange
    const explicit = '  Europe/Warsaw ';

    // Act
    const result = resolveTimezone(explicit);

    // Assert
    expect(result).toBe('Europe/Warsaw');
  });

  it('should throw DOM_INVALID_TIMEZONE when the explicit zone is invalid even if the setting is valid', () => {
    // Arrange
    const explicit = 'Mars/Olympus';

    // Act
    const act = () => resolveTimezone(explicit, 'Europe/Warsaw');

    // Assert
    expect(act).toThrow(expect.objectContaining({ code: 'DOM_INVALID_TIMEZONE' }));
  });

  it('should resolve to the detected OS zone when the setting is System in any letter case', () => {
    // Arrange
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      timeZone: 'Asia/Tokyo',
    } as Intl.ResolvedDateTimeFormatOptions);

    // Act
    const result = resolveTimezone(null, 'sYsTeM');

    // Assert
    expect(result).toBe('Asia/Tokyo');
  });

  it('should default to UTC when the OS zone cannot be detected', () => {
    // Arrange
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      timeZone: undefined,
    } as unknown as Intl.ResolvedDateTimeFormatOptions);

    // Act
    const result = resolveTimezone(undefined, null);

    // Assert
    expect(result).toBe('UTC');
  });
});
