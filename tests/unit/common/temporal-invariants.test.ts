import { describe, it, expect } from 'vitest';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';
import {
  clampInterval,
  calculateRangeMetrics,
  computeAllMetrics,
  calculateTaskElapsed,
} from '@plugins/engine/elapsed';
import { validateTimeLog } from '@plugins/engine/validation';

describe('TemporalInvariants', () => {
  describe('Spring DST Shift (23h Day)', () => {
    it('should calculate exactly 7200 seconds across Spring DST jump when clocks advance', () => {
      // Arrange
      const project = aProject({ id: 'p_spring' });
      const task = aTask({ id: 't_spring', projectId: 'p_spring' });
      // Central European Summer Time transition: 2026-03-29 01:00 UTC (02:00 CET -> 03:00 CEST)
      const springLog = aTimeLog({
        id: 'log_spring',
        projectId: 'p_spring',
        taskId: 't_spring',
        startTime: '2026-03-29T01:30:00Z',
        endTime: '2026-03-29T03:30:00Z',
      });

      // Act
      const elapsedSeconds = calculateTaskElapsed('t_spring', [task], [springLog], '2026-03-29T04:00:00Z');
      const metrics = computeAllMetrics([task], [springLog], [project], '2026-03-29T04:00:00Z');
      const rangeResult = calculateRangeMetrics(
        { from: '2026-03-29T00:00:00Z', to: '2026-03-29T23:59:59Z' },
        [task],
        [springLog],
        '2026-03-29T04:00:00Z'
      );

      // Assert
      expect(elapsedSeconds).toBe(7200);
      expect(metrics.projects['p_spring']?.totalElapsedSeconds).toBe(7200);
      expect(metrics.tasks['t_spring']?.selfElapsedSeconds).toBe(7200);
      expect(rangeResult.totalSeconds).toBe(7200);
    });
  });

  describe('Autumn DST Shift (25h Day)', () => {
    it('should calculate exactly 7200 seconds across Autumn DST transition when clocks fall back', () => {
      // Arrange
      const project = aProject({ id: 'p_autumn' });
      const task = aTask({ id: 't_autumn', projectId: 'p_autumn' });
      // Central European Summer Time rollback: 2026-10-25 01:00 UTC (03:00 CEST -> 02:00 CET)
      const autumnLog = aTimeLog({
        id: 'log_autumn',
        projectId: 'p_autumn',
        taskId: 't_autumn',
        startTime: '2026-10-25T01:30:00Z',
        endTime: '2026-10-25T03:30:00Z',
      });

      // Act
      const elapsedSeconds = calculateTaskElapsed('t_autumn', [task], [autumnLog], '2026-10-25T04:00:00Z');
      const metrics = computeAllMetrics([task], [autumnLog], [project], '2026-10-25T04:00:00Z');
      const rangeResult = calculateRangeMetrics(
        { from: '2026-10-25T00:00:00Z', to: '2026-10-25T23:59:59Z' },
        [task],
        [autumnLog],
        '2026-10-25T04:00:00Z'
      );

      // Assert
      expect(elapsedSeconds).toBe(7200);
      expect(metrics.projects['p_autumn']?.totalElapsedSeconds).toBe(7200);
      expect(metrics.tasks['t_autumn']?.selfElapsedSeconds).toBe(7200);
      expect(rangeResult.totalSeconds).toBe(7200);
    });
  });

  describe('Multi-Day Clamping Conservation', () => {
    it('should conserve total duration across daily clamped segments when log spans multiple days', () => {
      // Arrange: 72 hours from Friday to Monday = 259,200 seconds
      const startTime = '2026-06-12T00:00:00Z';
      const endTime = '2026-06-15T00:00:00Z';
      const expectedTotalSeconds = 72 * 3600; // 259,200
      const input = {
        id: 'log_72h',
        projectId: 'p_multiday',
        taskId: 't_multiday',
        startTime,
        endTime,
        isPatch: false,
      };

      const day1Start = new Date('2026-06-12T00:00:00Z').getTime();
      const day1End = new Date('2026-06-13T00:00:00Z').getTime();

      const day2Start = new Date('2026-06-13T00:00:00Z').getTime();
      const day2End = new Date('2026-06-14T00:00:00Z').getTime();

      const day3Start = new Date('2026-06-14T00:00:00Z').getTime();
      const day3End = new Date('2026-06-15T00:00:00Z').getTime();

      // Act
      const clampedDay1 = clampInterval(input, day1Start, day1End, day3End);
      const clampedDay2 = clampInterval(input, day2Start, day2End, day3End);
      const clampedDay3 = clampInterval(input, day3Start, day3End, day3End);

      const sumOfSegments =
        (clampedDay1?.clampedDurationSeconds ?? 0) +
        (clampedDay2?.clampedDurationSeconds ?? 0) +
        (clampedDay3?.clampedDurationSeconds ?? 0);

      // Assert
      expect(clampedDay1?.clampedDurationSeconds).toBe(86400);
      expect(clampedDay2?.clampedDurationSeconds).toBe(86400);
      expect(clampedDay3?.clampedDurationSeconds).toBe(86400);
      expect(sumOfSegments).toBe(expectedTotalSeconds);

      expect(clampedDay1?.originalDurationSeconds).toBe(expectedTotalSeconds);
      expect(clampedDay2?.originalDurationSeconds).toBe(expectedTotalSeconds);
      expect(clampedDay3?.originalDurationSeconds).toBe(expectedTotalSeconds);

      expect(clampedDay1?.isMultiDaySegment).toBe(true);
      expect(clampedDay2?.isMultiDaySegment).toBe(true);
      expect(clampedDay3?.isMultiDaySegment).toBe(true);
    });
  });

  describe('Negative Interval Protection', () => {
    it('should return null when clampInterval encounters endTime before startTime', () => {
      // Arrange
      const invalidInput = {
        id: 'log_invalid',
        projectId: 'p_inv',
        taskId: 't_inv',
        startTime: '2026-06-15T15:00:00Z',
        endTime: '2026-06-15T14:00:00Z',
        isPatch: false,
      };

      // Act
      const result = clampInterval(invalidInput, -Infinity, Infinity, Date.now());

      // Assert
      expect(result).toBeNull();
    });

    it('should throw validation exception when validateTimeLog encounters negative interval', () => {
      // Arrange
      const nowMs = new Date('2026-06-15T18:00:00Z').getTime();
      const startTime = '2026-06-15T15:00:00Z';
      const endTime = '2026-06-15T14:00:00Z';

      // Act & Assert
      expect(() => {
        validateTimeLog('log_neg', startTime, endTime, [], nowMs);
      }).toThrow(/End time cannot be before start time/i);
    });

    it('should ignore negative interval logs during computeAllMetrics without corrupting aggregates', () => {
      // Arrange
      const project = aProject({ id: 'p_clean' });
      const task = aTask({ id: 't_clean', projectId: 'p_clean' });
      const validLog = aTimeLog({
        id: 'l_valid',
        projectId: 'p_clean',
        taskId: 't_clean',
        startTime: '2026-06-15T10:00:00Z',
        endTime: '2026-06-15T11:00:00Z',
      });
      const corruptedLog = aTimeLog({
        id: 'l_corrupt',
        projectId: 'p_clean',
        taskId: 't_clean',
        startTime: '2026-06-15T16:00:00Z',
        endTime: '2026-06-15T14:00:00Z',
      });

      // Act
      const metrics = computeAllMetrics([task], [validLog, corruptedLog], [project], '2026-06-15T17:00:00Z');

      // Assert
      expect(metrics.projects['p_clean']?.totalElapsedSeconds).toBe(3600);
      expect(metrics.tasks['t_clean']?.selfElapsedSeconds).toBe(3600);
    });
  });
});
