import { describe, it, expect } from 'vitest';
import parityVectors from '../../fixtures/range-metrics-parity-vectors.json';
import type { ElapsedRangeFilter } from '@bindings/ElapsedRangeFilter';
import { calculateRangeMetrics } from '@plugins/engine/metrics/rangeMetrics';
import { computeAllMetrics } from '@plugins/engine/metrics/computedMetrics';
import { aPatchLog, aProject, aTask, aTimeLog } from '../../shared/builders/entity-builders';

const BROWSER_RUNTIME = 'browser';

const runsInBrowser = ({ runtimes }: { runtimes?: string[] }) =>
  runtimes === undefined || runtimes.includes(BROWSER_RUNTIME);

const rangeVectors = parityVectors.rangeVectors.filter(runsInBrowser);
const computedVectors = parityVectors.computedVectors.filter(runsInBrowser);

describe('Given the shared range metrics parity fixture', () => {
  describe('When the browser engine calculates range metrics', () => {
    it.each(rangeVectors)('Then it should satisfy: $description', (vector) => {
      // Given
      const tasks = vector.tasks.map((task) => aTask(task));
      const logs = vector.logs.map((log) => aTimeLog(log));
      const patches = vector.patches.map((patch) => aPatchLog({ ...patch, taskId: patch.taskId, patchNote: 'Fixture patch' }));
      const filter: ElapsedRangeFilter = vector.filter;

      // When
      const result = calculateRangeMetrics(filter, tasks, logs, undefined, patches);

      // Then
      const intervals = result.clampedLogs
        .map(({ id, projectId, taskId, clampedDurationSeconds }) => ({
          id,
          projectId,
          taskId,
          clampedDurationSeconds,
        }))
        .sort((a, b) => a.id.localeCompare(b.id));
      expect({
        totalSeconds: result.totalSeconds,
        projectElapsed: result.projectElapsed,
        taskElapsed: result.taskElapsed,
        intervals,
      }).toEqual(vector.expected);
    });
  });

  describe('When the browser engine computes project totals', () => {
    it.each(computedVectors)('Then it should satisfy: $description', (vector) => {
      // Given
      const projects = vector.projects.map((id) => aProject({ id }));
      const tasks = vector.tasks.map((task) => aTask(task));
      const logs = vector.logs.map((log) => aTimeLog(log));

      // When
      const computed = computeAllMetrics(tasks, logs, projects, vector.now);

      // Then
      const totals = Object.fromEntries(
        vector.projects.map((id) => [id, computed.projects[id].totalElapsedSeconds])
      );
      expect(totals).toEqual(vector.expectedProjectTotals);
    });
  });
});
