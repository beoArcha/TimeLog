import { describe, it, expect } from 'vitest';
import {
  localDateAt,
  offsetMsAt,
  resolveLocal,
  wallMsFromFields,
} from '@common/engine/range/zonedTime';

const HOUR_MS = 3_600_000;
const instant = (iso: string) => Date.parse(iso);
const wall = (iso: string) => Date.parse(`${iso}Z`);

describe('wallMsFromFields', () => {
  it('should encode the fields as UTC milliseconds when they form a real date', () => {
    // Arrange
    const expected = Date.parse('2026-03-05T10:20:30Z');

    // Act
    const result = wallMsFromFields(2026, 3, 5, 10, 20, 30);

    // Assert
    expect(result).toBe(expected);
  });

  it('should return null when the day does not exist in the month', () => {
    // Arrange
    const [year, month, day] = [2026, 2, 30];

    // Act
    const result = wallMsFromFields(year, month, day);

    // Assert
    expect(result).toBeNull();
  });

  it('should return null when the hour is 24', () => {
    // Arrange
    const hour = 24;

    // Act
    const result = wallMsFromFields(2026, 3, 5, hour);

    // Assert
    expect(result).toBeNull();
  });

  it('should keep years below 100 as written when encoding', () => {
    // Arrange
    const year = 50;

    // Act
    const result = wallMsFromFields(year, 1, 1);

    // Assert
    expect(new Date(result as number).getUTCFullYear()).toBe(50);
  });
});

describe('offsetMsAt', () => {
  it.each([
    ['Europe/Warsaw', '2026-07-01T00:00:00Z', 2 * HOUR_MS],
    ['Europe/Warsaw', '2026-01-01T00:00:00Z', HOUR_MS],
    ['America/New_York', '2026-01-01T00:00:00Z', -5 * HOUR_MS],
    ['Asia/Kolkata', '2026-01-01T00:00:00Z', 5.5 * HOUR_MS],
    ['UTC', '2026-01-01T00:00:00Z', 0],
  ])('should report the %s offset at %s', (timeZone, iso, expected) => {
    // Arrange
    const at = instant(iso);

    // Act
    const result = offsetMsAt(at, timeZone);

    // Assert
    expect(result).toBe(expected);
  });

  it('should ignore sub-second precision of the instant', () => {
    // Arrange
    const at = instant('2026-07-01T00:00:00Z') + 999;

    // Act
    const result = offsetMsAt(at, 'Europe/Warsaw');

    // Assert
    expect(result).toBe(2 * HOUR_MS);
  });
});

describe('localDateAt', () => {
  it('should return the local calendar day when UTC is already on the next day', () => {
    // Arrange
    const at = instant('2026-11-11T23:30:00Z');

    // Act
    const result = localDateAt(at, 'Europe/Warsaw');

    // Assert
    expect(result).toEqual({ year: 2026, month: 11, day: 12 });
  });

  it('should return the previous local day when the zone is behind UTC', () => {
    // Arrange
    const at = instant('2026-11-12T02:00:00Z');

    // Act
    const result = localDateAt(at, 'America/New_York');

    // Assert
    expect(result).toEqual({ year: 2026, month: 11, day: 11 });
  });
});

describe('resolveLocal', () => {
  it('should return the single matching instant when the local time is unambiguous', () => {
    // Arrange
    const local = wall('2026-11-02T08:00:00');

    // Act
    const result = resolveLocal(local, 'Europe/Warsaw');

    // Assert
    expect(result).toBe(instant('2026-11-02T07:00:00Z'));
  });

  it('should pick the earlier instant when the local time occurs twice', () => {
    // Arrange
    const local = wall('2026-10-25T02:30:00');

    // Act
    const result = resolveLocal(local, 'Europe/Warsaw');

    // Assert
    expect(result).toBe(instant('2026-10-25T00:30:00Z'));
  });

  it('should pick the first existing minute when the local time falls in a gap', () => {
    // Arrange
    const local = wall('2026-03-29T02:30:00');

    // Act
    const result = resolveLocal(local, 'Europe/Warsaw');

    // Assert
    expect(result).toBe(instant('2026-03-29T01:00:00Z'));
  });

  it('should skip a nonexistent midnight when the gap starts at 00:00', () => {
    // Arrange
    const local = wall('2026-09-06T00:00:00');

    // Act
    const result = resolveLocal(local, 'America/Santiago');

    // Assert
    expect(result).toBe(instant('2026-09-06T04:00:00Z'));
  });

  it('should keep the seconds of the requested time when skipping a gap', () => {
    // Arrange
    const local = wall('2026-03-29T02:30:15');

    // Act
    const result = resolveLocal(local, 'Europe/Warsaw');

    // Assert
    expect(result).toBe(instant('2026-03-29T01:00:15Z'));
  });
});
