import { describe, it, expect } from 'vitest';
import { aPatchLog, aProject, aTask } from '@tests/shared/builders/entity-builders';
import { buildReportAt } from '@common/engine/reports';
import { Catalog } from '@common/engine/reports/catalog';
import { amountOutOfRange, businessViolation, BUSINESS_VIOLATION_CODE } from '@common/engine/reports/errors';

describe('report error messages', () => {
  it('should prefix a business violation with the Rust validation wording', () => {
    // Arrange
    const message = 'something broke';

    // Act
    const error = businessViolation(message);

    // Assert
    expect([error.message, error.code]).toEqual(['Validation error: something broke', BUSINESS_VIOLATION_CODE]);
  });

  it('should state the safe integer limit in the amount-out-of-range message', () => {
    // Arrange
    const limit = Number.MAX_SAFE_INTEGER;

    // Act
    const error = amountOutOfRange();

    // Assert
    expect(error.message).toBe(
      `Billing amount exceeds the largest integer JavaScript represents exactly (${limit} minor units)`
    );
  });

  it('should name the task where a hierarchy cycle was detected', () => {
    // Arrange
    const catalog = new Catalog([], [aTask({ id: 'a', parentTaskId: 'b' }), aTask({ id: 'b', parentTaskId: 'a' })]);

    // Act
    const act = () => catalog.chain('a');

    // Assert
    expect(act).toThrow("Validation error: task hierarchy contains a cycle at task 'a'");
  });
});

describe('buildReportAt failure order', () => {
  it('should report the unknown project that sorts first when several fail', () => {
    // Arrange
    const range = { from: '2026-06-15T00:00:00Z', to: '2026-06-16T00:00:00Z', timezone: 'UTC' };
    const patch = (id: string, projectId: string) =>
      aPatchLog({ id, projectId, taskId: undefined, startTime: '2026-06-15T10:00:00Z', endTime: '2026-06-15T11:00:00Z' });
    const snapshot = {
      projects: [aProject()],
      tasks: [],
      logs: [],
      patches: [patch('p-1', 'b-ghost'), patch('p-2', 'a-ghost')],
    };

    // Act
    const act = () =>
      buildReportAt(snapshot, { range: { preset: 'all' }, variant: 'summary', includePatches: true }, range, new Date());

    // Assert
    expect(act).toThrow("Project with id 'a-ghost' not found");
  });
});
