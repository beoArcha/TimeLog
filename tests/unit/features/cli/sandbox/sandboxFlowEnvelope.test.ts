import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SandboxEmulatorStore } from '@features/cli/sandbox/sandboxEmulatorStore';
import { SandboxCommandRouter } from '@features/cli/sandbox/sandboxCommandRouter';
import { buildEnvelope, SCHEMA_STATUS } from '@features/cli/sandbox/router/sandboxEnvelope';
import { TerminalOutput } from '@features/cli/utils/terminalOutput';
import { GENERATOR_VERSION } from '@common/engine/reports/constants';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';

const CAMEL_CASE_KEY = /^[a-z][a-zA-Z0-9]*$/;

function collectNonCamelCaseKeys(value: unknown, path = '$'): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectNonCamelCaseKeys(item, `${path}[${index}]`));
  }
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => [
    ...(CAMEL_CASE_KEY.test(key) ? [] : [`${path}.${key}`]),
    ...collectNonCamelCaseKeys(child, `${path}.${key}`),
  ]);
}

function runCommand(store: SandboxEmulatorStore, tokens: string[]): TerminalOutput {
  const output = new TerminalOutput();
  SandboxCommandRouter.route(tokens, store, output);
  return output;
}

function parseSingleEnvelope(output: TerminalOutput) {
  const lines = output.getLines();
  expect(lines).toHaveLength(1);
  expect(lines[0].text).not.toContain('\n');
  return JSON.parse(lines[0].text);
}

describe('Sandbox flow command envelopes', () => {
  let store: SandboxEmulatorStore;

  const seed = (activeTaskId: string | null) => {
    const activeLog = activeTaskId
      ? aTimeLog({ id: 'l_active', projectId: 'p1', taskId: activeTaskId, startTime: '2026-06-15T09:30:00Z', endTime: undefined })
      : null;
    store.seedForTesting({
      projects: [aProject({ id: 'p1', name: 'Parity Project' })],
      tasks: [aTask({ id: 't1', projectId: 'p1', name: 'Parity Task' }), aTask({ id: 't2', projectId: 'p1', name: 'Other Task' })],
      logs: activeLog ? [activeLog] : [],
      activeLog,
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-12T10:30:15.789Z'));
    SandboxEmulatorStore.resetInstanceForTesting();
    store = SandboxEmulatorStore.getInstance();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('buildEnvelope', () => {
    it('should carry schema, version, data and whole-second UTC meta when wrapping a payload', () => {
      // Arrange
      const data = { running: false };

      // Act
      const envelope = buildEnvelope(SCHEMA_STATUS, data);

      // Assert
      expect(envelope).toEqual({
        schema: 'oxy.status',
        schemaVersion: 1,
        data,
        meta: { generatedAt: '2026-11-12T10:30:15Z', generator: { name: 'oxy', version: GENERATOR_VERSION } },
      });
    });
  });

  describe('status --machine', () => {
    it('should emit an idle oxy.status envelope when no timer runs', () => {
      // Arrange
      seed(null);

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, ['status', '--machine']));

      // Assert
      expect(envelope.schema).toBe('oxy.status');
      expect(envelope.data).toEqual({ active: [], count: 0, running: false });
    });

    it('should list the running task when a timer is active', () => {
      // Arrange
      seed('t1');

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, ['status', '--json']));

      // Assert
      expect(envelope.data).toEqual({
        active: [
          {
            taskId: 't1',
            taskName: 'Parity Task',
            projectId: 'p1',
            projectName: 'Parity Project',
            start: '2026-06-15T09:30:00Z',
            elapsedSeconds: Math.floor((Date.parse('2026-11-12T10:30:15.789Z') - Date.parse('2026-06-15T09:30:00Z')) / 1000),
          },
        ],
        count: 1,
        running: true,
      });
    });

    it('should emit an entity error envelope when the running task no longer exists', () => {
      // Arrange
      seed('t_missing');

      // Act
      const lines = runCommand(store, ['status', '--json']).getLines();

      // Assert
      expect(lines).toHaveLength(1);
      expect(lines[0].type).toBe('error');
      expect(lines[0].exitCode).toBe(4);
      expect(JSON.parse(lines[0].text)).toMatchObject({
        code: 'DOM_ENTITY_NOT_FOUND',
        category: 'entity',
        exit_code: 4,
        technical: "Task 't_missing' not found.",
      });
    });
  });

  describe('today', () => {
    const seedMidnightCrossingLog = () => {
      store.seedForTesting({
        projects: [aProject({ id: 'p1', name: 'Parity Project' })],
        tasks: [aTask({ id: 't1', projectId: 'p1', name: 'Parity Task' })],
        logs: [aTimeLog({ id: 'l1', projectId: 'p1', taskId: 't1', startTime: '2026-11-11T23:00:00Z', endTime: '2026-11-12T01:00:00Z' })],
        activeLog: null,
      });
    };

    it('should emit an oxy.today envelope holding the report clamped to the day when a session crosses midnight', () => {
      // Arrange
      seedMidnightCrossingLog();

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, ['today', '--machine', '--tz', 'UTC']));

      // Assert
      expect(envelope.schema).toBe('oxy.today');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.schema).toBe('oxy.report');
      expect(envelope.data.range.preset).toBe('today');
      expect(envelope.data.totals.seconds).toBe(3600);
      expect(envelope.data.entries[0]).toMatchObject({ seconds: 3600, originalSeconds: 7200, clamped: true });
      expect(collectNonCamelCaseKeys(envelope)).toEqual([]);
    });

    it('should total only the part of a midnight-crossing session that falls today when printing for a person', () => {
      // Arrange
      seedMidnightCrossingLog();

      // Act
      const output = runCommand(store, ['today', '--tz', 'UTC']);

      // Assert
      const text = output.getLines().map((line) => line.text).join('\n');
      expect(text).toContain('[Parity Project] Parity Task');
      expect(text).toContain('(1 session(s))');
    });

    it('should emit an empty report envelope when nothing was tracked today', () => {
      // Arrange
      seed(null);

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, ['today', '--json']));

      // Assert
      expect(envelope.data.totals).toMatchObject({ seconds: 0, entryCount: 0 });
      expect(envelope.data.entries).toEqual([]);
    });
  });

  describe('start --machine', () => {
    it('should emit the opened time log id and the stopped task ids when another task was running', () => {
      // Arrange
      seed('t1');

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, ['start', 't2', '--machine']));

      // Assert
      expect(envelope.schema).toBe('oxy.start');
      expect(envelope.data).toEqual({
        action: 'started',
        taskId: 't2',
        timeLogId: store.getActiveLog()?.id,
        stoppedTaskIds: ['t1'],
      });
    });

    it('should accept the machine flag before the task operand', () => {
      // Arrange
      seed(null);

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, ['start', '--machine', 't1']));

      // Assert
      expect(envelope.data.taskId).toBe('t1');
    });

    it('should report alreadyRunning without a time log id when the task is already running', () => {
      // Arrange
      seed('t1');

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, ['start', 't1', '--machine']));

      // Assert
      expect(envelope.data).toEqual({ action: 'alreadyRunning', taskId: 't1', timeLogId: null, stoppedTaskIds: [] });
    });

    it('should emit an oxy.status envelope when started without a target while a timer runs', () => {
      // Arrange
      seed('t1');

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, ['start', '--machine']));

      // Assert
      expect(envelope.schema).toBe('oxy.status');
    });
  });

  describe('stop --machine', () => {
    it('should emit stopped with a count of one when a timer was running', () => {
      // Arrange
      seed('t1');

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, ['stop', '--machine']));

      // Assert
      expect(envelope.schema).toBe('oxy.stop');
      expect(envelope.data).toEqual({ action: 'stopped', stoppedCount: 1 });
    });

    it('should emit a noop envelope when stopping an idle timer with --if-running', () => {
      // Arrange
      seed(null);

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, ['stop', '--if-running', '--machine']));

      // Assert
      expect(envelope.data).toEqual({ action: 'noop', stoppedCount: 0 });
    });
  });

  describe('switch --machine', () => {
    it('should emit the new time log id when switching tasks', () => {
      // Arrange
      seed('t1');

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, ['switch', 't2', '--machine']));

      // Assert
      expect(envelope.schema).toBe('oxy.switch');
      expect(envelope.data).toEqual({ action: 'switched', taskId: 't2', timeLogId: store.getActiveLog()?.id });
    });
  });

  describe('envelope contract', () => {
    it('should use camelCase keys at every depth for each migrated command', () => {
      // Arrange
      const scenarios: Array<[string | null, string[]]> = [
        [null, ['status', '--machine']],
        [null, ['start', 't1', '--machine']],
        ['t1', ['start', 't1', '--machine']],
        ['t1', ['switch', 't2', '--machine']],
        ['t1', ['stop', '--machine']],
        [null, ['stop', '--if-running', '--machine']],
      ];

      for (const [activeTaskId, tokens] of scenarios) {
        seed(activeTaskId);

        // Act
        const envelope = parseSingleEnvelope(runCommand(store, tokens));

        // Assert
        expect(envelope.schema).toMatch(/^oxy\.[a-z]+$/);
        expect(Number.isInteger(envelope.schemaVersion)).toBe(true);
        expect(collectNonCamelCaseKeys(envelope)).toEqual([]);
      }
    });
  });

  describe('quiet mode', () => {
    it('should print only the new time log id when starting with -q', () => {
      // Arrange
      seed(null);

      // Act
      const output = runCommand(store, ['start', 't1', '-q']);

      // Assert
      const lines = output.getLines();
      expect(lines).toHaveLength(1);
      expect(lines[0].text).toBe(store.getActiveLog()?.id);
    });

    it('should print nothing when starting an already running task with -q', () => {
      // Arrange
      seed('t1');

      // Act
      const output = runCommand(store, ['start', 't1', '-q']);

      // Assert
      expect(output.getLines()).toHaveLength(0);
    });

    it('should print only the new time log id when switching with -q', () => {
      // Arrange
      seed('t1');

      // Act
      const output = runCommand(store, ['switch', 't2', '-q']);

      // Assert
      const lines = output.getLines();
      expect(lines).toHaveLength(1);
      expect(lines[0].text).toBe(store.getActiveLog()?.id);
    });
  });
});
