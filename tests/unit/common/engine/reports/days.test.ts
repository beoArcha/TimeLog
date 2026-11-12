import { describe, it, expect } from 'vitest';
import { aTask } from '@tests/shared/builders/entity-builders';
import { buildDays } from '@common/engine/reports/days';
import type { Bounds, MeasuredEntry } from '@common/engine/reports/entries';

const at = (iso: string) => Date.parse(iso);

function aMeasuredEntry(startIso: string, endIso: string): MeasuredEntry {
  const [inRangeStartMs, inRangeEndMs] = [at(startIso), at(endIso)];
  return {
    id: 'e1',
    projectId: 'p1',
    chain: [aTask()],
    start: startIso,
    end: endIso,
    date: startIso.slice(0, 10),
    inRangeStartMs,
    inRangeEndMs,
    isPatch: false,
    seconds: Math.floor((inRangeEndMs - inRangeStartMs) / 1000),
    originalSeconds: Math.floor((inRangeEndMs - inRangeStartMs) / 1000),
    clamped: false,
  };
}

const bounds = (timeZone: string, from?: string, to?: string): Bounds => ({
  timeZone,
  from: from === undefined ? undefined : at(from),
  to: to === undefined ? undefined : at(to),
  nowMs: at('2026-06-20T12:00:00Z'),
});

describe('buildDays', () => {
  it('should keep an entry inside one day on that day', () => {
    // Arrange
    const entry = aMeasuredEntry('2026-06-15T09:00:00Z', '2026-06-15T10:00:00Z');

    // Act
    const days = buildDays([entry], bounds('UTC'));

    // Assert
    expect(days).toEqual([{ date: '2026-06-15', seconds: 3600 }]);
  });

  it('should split an entry crossing midnight between the two days', () => {
    // Arrange
    const entry = aMeasuredEntry('2026-06-15T22:00:00Z', '2026-06-16T02:30:00Z');

    // Act
    const days = buildDays([entry], bounds('UTC'));

    // Assert
    expect(days).toEqual([
      { date: '2026-06-15', seconds: 7200 },
      { date: '2026-06-16', seconds: 9000 },
    ]);
  });

  it('should give every fully covered day a whole 24 hours', () => {
    // Arrange
    const entry = aMeasuredEntry('2026-06-15T23:00:00Z', '2026-06-18T01:00:00Z');

    // Act
    const days = buildDays([entry], bounds('UTC'));

    // Assert
    expect(days.map((day) => day.seconds)).toEqual([3600, 86_400, 86_400, 3600]);
  });

  it('should end an entry stopping exactly at midnight on its own day', () => {
    // Arrange
    const entry = aMeasuredEntry('2026-06-15T22:00:00Z', '2026-06-16T00:00:00Z');

    // Act
    const days = buildDays([entry], bounds('UTC'));

    // Assert
    expect(days).toEqual([{ date: '2026-06-15', seconds: 7200 }]);
  });

  it('should add up entries sharing a day', () => {
    // Arrange
    const first = aMeasuredEntry('2026-06-15T08:00:00Z', '2026-06-15T09:00:00Z');
    const second = aMeasuredEntry('2026-06-15T10:00:00Z', '2026-06-15T10:30:00Z');

    // Act
    const days = buildDays([first, second], bounds('UTC'));

    // Assert
    expect(days).toEqual([{ date: '2026-06-15', seconds: 5400 }]);
  });

  it('should list days in ascending order regardless of entry order', () => {
    // Arrange
    const later = aMeasuredEntry('2026-06-17T08:00:00Z', '2026-06-17T09:00:00Z');
    const earlier = aMeasuredEntry('2026-06-15T08:00:00Z', '2026-06-15T09:00:00Z');

    // Act
    const days = buildDays([later, earlier], bounds('UTC'));

    // Assert
    expect(days.map((day) => day.date)).toEqual(['2026-06-15', '2026-06-17']);
  });

  it('should split at local midnight rather than UTC midnight', () => {
    // Arrange: 22:30Z is 00:30 the next day in Warsaw (CEST)
    const entry = aMeasuredEntry('2026-06-15T21:30:00Z', '2026-06-15T22:30:00Z');

    // Act
    const days = buildDays([entry], bounds('Europe/Warsaw'));

    // Assert
    expect(days).toEqual([
      { date: '2026-06-15', seconds: 1800 },
      { date: '2026-06-16', seconds: 1800 },
    ]);
  });

  it('should count 23 hours for the spring-forward day', () => {
    // Arrange: Warsaw midnights are 2026-03-28T23:00Z and 2026-03-29T22:00Z
    const entry = aMeasuredEntry('2026-03-28T23:00:00Z', '2026-03-29T22:00:00Z');

    // Act
    const days = buildDays([entry], bounds('Europe/Warsaw'));

    // Assert
    expect(days).toEqual([{ date: '2026-03-29', seconds: 23 * 3600 }]);
  });

  it('should count 25 hours for the fall-back day', () => {
    // Arrange: Warsaw midnights are 2026-10-24T22:00Z and 2026-10-25T23:00Z
    const entry = aMeasuredEntry('2026-10-24T22:00:00Z', '2026-10-25T23:00:00Z');

    // Act
    const days = buildDays([entry], bounds('Europe/Warsaw'));

    // Assert
    expect(days).toEqual([{ date: '2026-10-25', seconds: 25 * 3600 }]);
  });

  it('should keep the segments summing to the entry seconds when instants carry fractions', () => {
    // Arrange: 0.9 s long, crossing midnight, so the whole-second total is 0
    const entry = aMeasuredEntry('2026-06-15T23:59:59.500Z', '2026-06-16T00:00:00.400Z');

    // Act
    const days = buildDays([entry], bounds('UTC'));

    // Assert
    expect(days.reduce((sum, day) => sum + day.seconds, 0)).toBe(0);
  });

  it('should hand the whole second to the day that completes it when a fraction straddles midnight', () => {
    // Arrange: 1.2 s long, 0.5 s before midnight and 0.7 s after
    const entry = aMeasuredEntry('2026-06-15T23:59:59.500Z', '2026-06-16T00:00:00.700Z');

    // Act
    const days = buildDays([entry], bounds('UTC'));

    // Assert
    expect(days).toEqual([
      { date: '2026-06-15', seconds: 0 },
      { date: '2026-06-16', seconds: 1 },
    ]);
  });

  describe('with both range bounds', () => {
    it('should list every day of the range including zero days', () => {
      // Arrange
      const entry = aMeasuredEntry('2026-06-16T08:00:00Z', '2026-06-16T09:00:00Z');

      // Act
      const days = buildDays([entry], bounds('UTC', '2026-06-15T00:00:00Z', '2026-06-18T00:00:00Z'));

      // Assert
      expect(days).toEqual([
        { date: '2026-06-15', seconds: 0 },
        { date: '2026-06-16', seconds: 3600 },
        { date: '2026-06-17', seconds: 0 },
      ]);
    });

    it('should not list the day starting exactly at the exclusive end', () => {
      // Arrange
      const [from, to] = ['2026-06-15T00:00:00Z', '2026-06-16T00:00:00Z'];

      // Act
      const days = buildDays([], bounds('UTC', from, to));

      // Assert
      expect(days).toEqual([{ date: '2026-06-15', seconds: 0 }]);
    });

    it('should list the final partial day when the end falls inside it', () => {
      // Arrange
      const [from, to] = ['2026-06-15T00:00:00Z', '2026-06-16T00:00:01Z'];

      // Act
      const days = buildDays([], bounds('UTC', from, to));

      // Assert
      expect(days.map((day) => day.date)).toEqual(['2026-06-15', '2026-06-16']);
    });

    it('should list a 23-hour local day once when the range spans the spring-forward day', () => {
      // Arrange
      const [from, to] = ['2026-03-28T23:00:00Z', '2026-03-30T22:00:00Z'];

      // Act
      const days = buildDays([], bounds('Europe/Warsaw', from, to));

      // Assert
      expect(days.map((day) => day.date)).toEqual(['2026-03-29', '2026-03-30']);
    });
  });

  describe('with an unbounded side', () => {
    it.each([
      ['no bounds', undefined, undefined],
      ['only a lower bound', '2026-06-14T00:00:00Z', undefined],
      ['only an upper bound', undefined, '2026-06-20T00:00:00Z'],
    ])('should list only days with time when the range has %s', (_label, from, to) => {
      // Arrange
      const entry = aMeasuredEntry('2026-06-16T08:00:00Z', '2026-06-16T09:00:00Z');

      // Act
      const days = buildDays([entry], bounds('UTC', from, to));

      // Assert
      expect(days).toEqual([{ date: '2026-06-16', seconds: 3600 }]);
    });
  });
});
