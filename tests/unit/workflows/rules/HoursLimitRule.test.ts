import { describe, it, expect } from 'vitest';
import { HoursLimitRule } from '@plugins/workflows/rules/HoursLimitRule';
import { aWorkflowConfig, aTimeLog } from '@tests/shared/builders/entity-builders';
import { REASON_HOURS_LIMIT } from '@common/workflows/IWorkflow';

describe('HoursLimitRule', () => {
  const rule = new HoursLimitRule();

  it('should return null when autoStopHoursLimitEnabled is false', () => {
    // Arrange
    const config = aWorkflowConfig({
      autoStopHoursLimitEnabled: false,
      autoStopHoursLimit: 8,
    });
    const nowMs = new Date('2026-10-19T14:00:00.000Z').getTime();
    const activeLog = aTimeLog({
      startTime: new Date('2026-10-19T05:00:00.000Z').toISOString(),
      endTime: null,
    });

    // Act
    const result = rule.evaluate(config, [activeLog], nowMs);

    // Assert
    expect(result).toBeNull();
  });

  it('should return null when elapsed time is below hours limit minus warning lead time', () => {
    // Arrange
    const now = new Date('2026-10-19T14:00:00.000Z');
    const config = aWorkflowConfig({
      autoStopHoursLimitEnabled: true,
      autoStopHoursLimit: 4,
      warningNotificationEnabled: true,
    });
    // Started 2 hours ago
    const activeLog = aTimeLog({
      startTime: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      endTime: null,
    });

    // Act
    const result = rule.evaluate(config, [activeLog], now.getTime());

    // Assert
    expect(result).toBeNull();
  });

  it('should return warning result when elapsed time is within 15 minutes of hours limit', () => {
    // Arrange
    const now = new Date('2026-10-19T14:00:00.000Z');
    const config = aWorkflowConfig({
      autoStopHoursLimitEnabled: true,
      autoStopHoursLimit: 4,
      warningNotificationEnabled: true,
    });
    // Started 3h 50m ago (10m before 4h limit)
    const activeLog = aTimeLog({
      startTime: new Date(now.getTime() - (4 * 3600 - 600) * 1000).toISOString(),
      endTime: null,
    });

    // Act
    const result = rule.evaluate(config, [activeLog], now.getTime());

    // Assert
    expect(result).toEqual({
      stopped: false,
      warning: true,
    });
  });

  it('should return stopped result with REASON_HOURS_LIMIT when elapsed time meets or exceeds hours limit', () => {
    // Arrange
    const now = new Date('2026-10-19T14:00:00.000Z');
    const config = aWorkflowConfig({
      autoStopHoursLimitEnabled: true,
      autoStopHoursLimit: 4,
    });
    // Started 4h 5m ago
    const activeLog = aTimeLog({
      startTime: new Date(now.getTime() - (4 * 3600 + 300) * 1000).toISOString(),
      endTime: null,
    });

    // Act
    const result = rule.evaluate(config, [activeLog], now.getTime());

    // Assert
    expect(result).toEqual({
      stopped: true,
      reason: REASON_HOURS_LIMIT,
      warning: false,
    });
  });
});
