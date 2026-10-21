import { describe, it, expect } from 'vitest';
import { DailyBoundaryRule } from '@plugins/workflows/rules/DailyBoundaryRule';
import { aWorkflowConfig, aTimeLog } from '@tests/shared/builders/entity-builders';
import { REASON_DAILY_BOUNDARY } from '@common/workflows/IWorkflow';

describe('DailyBoundaryRule', () => {
  const rule = new DailyBoundaryRule();

  it('should return null when autoStopDailyBoundaryEnabled is false', () => {
    // Arrange
    const config = aWorkflowConfig({
      autoStopDailyBoundaryEnabled: false,
      autoStopDailyBoundaryTime: '18:00',
    });
    const today = new Date();
    today.setHours(18, 30, 0, 0);

    const startTime = new Date(today);
    startTime.setHours(14, 0, 0, 0);
    const activeLog = aTimeLog({
      startTime: startTime.toISOString(),
      endTime: null,
    });

    // Act
    const result = rule.evaluate(config, [activeLog], today.getTime());

    // Assert
    expect(result).toBeNull();
  });

  it('should return null when daily boundary time string is invalid', () => {
    // Arrange
    const config = aWorkflowConfig({
      autoStopDailyBoundaryEnabled: true,
      autoStopDailyBoundaryTime: 'invalid-time',
    });
    const today = new Date();
    today.setHours(18, 30, 0, 0);

    const activeLog = aTimeLog({
      startTime: today.toISOString(),
      endTime: null,
    });

    // Act
    const result = rule.evaluate(config, [activeLog], today.getTime());

    // Assert
    expect(result).toBeNull();
  });

  it('should return stopped result with REASON_DAILY_BOUNDARY when timer started before boundary and current time is past boundary', () => {
    // Arrange
    const today = new Date();
    today.setHours(18, 30, 0, 0); // 18:30 current time

    const config = aWorkflowConfig({
      autoStopDailyBoundaryEnabled: true,
      autoStopDailyBoundaryTime: '18:00',
    });

    const startTime = new Date(today);
    startTime.setHours(14, 0, 0, 0); // started at 14:00 (before 18:00)
    const activeLog = aTimeLog({
      startTime: startTime.toISOString(),
      endTime: null,
    });

    // Act
    const result = rule.evaluate(config, [activeLog], today.getTime());

    // Assert
    expect(result).toEqual({
      stopped: true,
      reason: REASON_DAILY_BOUNDARY,
      warning: false,
    });
  });

  it('should return null when timer was started after the daily boundary', () => {
    // Arrange
    const today = new Date();
    today.setHours(18, 30, 0, 0); // 18:30 current time

    const config = aWorkflowConfig({
      autoStopDailyBoundaryEnabled: true,
      autoStopDailyBoundaryTime: '18:00',
    });

    const startTime = new Date(today);
    startTime.setHours(18, 15, 0, 0); // started at 18:15 (after 18:00)
    const activeLog = aTimeLog({
      startTime: startTime.toISOString(),
      endTime: null,
    });

    // Act
    const result = rule.evaluate(config, [activeLog], today.getTime());

    // Assert
    expect(result).toBeNull();
  });

  it('should return warning result when timer started before boundary and current time is within 15 minutes of boundary', () => {
    // Arrange
    const today = new Date();
    today.setHours(17, 50, 0, 0); // 17:50 (10 minutes before 18:00)

    const config = aWorkflowConfig({
      autoStopDailyBoundaryEnabled: true,
      autoStopDailyBoundaryTime: '18:00',
      warningNotificationEnabled: true,
    });

    const startTime = new Date(today);
    startTime.setHours(14, 0, 0, 0);
    const activeLog = aTimeLog({
      startTime: startTime.toISOString(),
      endTime: null,
    });

    // Act
    const result = rule.evaluate(config, [activeLog], today.getTime());

    // Assert
    expect(result).toEqual({
      stopped: false,
      warning: true,
    });
  });
});
