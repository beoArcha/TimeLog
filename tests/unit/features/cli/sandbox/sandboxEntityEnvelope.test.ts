import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SandboxEmulatorStore } from '@features/cli/sandbox/sandboxEmulatorStore';
import { SandboxCommandRouter } from '@features/cli/sandbox/sandboxCommandRouter';
import { TerminalOutput } from '@features/cli/utils/terminalOutput';
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

describe('Sandbox entity command envelopes', () => {
  let store: SandboxEmulatorStore;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-12T10:30:15.789Z'));
    SandboxEmulatorStore.resetInstanceForTesting();
    store = SandboxEmulatorStore.getInstance();
    store.seedForTesting({
      projects: [
        aProject({ id: 'p1', name: 'Alpha Project', color: 'indigo' }),
        aProject({ id: 'p2', name: 'Beta Project', color: 'emerald' }),
      ],
      tasks: [
        aTask({ id: 't1', projectId: 'p1', name: 'Alpha Task', completed: false }),
        aTask({ id: 't2', projectId: 'p1', name: 'Sub Task', parentTaskId: 't1', completed: false }),
        aTask({ id: 't3', projectId: 'p2', name: 'Beta Task', completed: false }),
      ],
      logs: [
        aTimeLog({
          id: 'l1',
          projectId: 'p1',
          taskId: 't1',
          startTime: '2026-06-15T09:00:00Z',
          endTime: '2026-06-15T10:00:00Z',
          note: 'Work session',
        }),
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('project entity commands', () => {
    it('should emit oxy.project.list envelope with items array when running project list --machine', () => {
      // Arrange
      const tokens = ['project', 'list', '--machine'];

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, tokens));

      // Assert
      expect(envelope.schema).toBe('oxy.project.list');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.items).toHaveLength(2);
      expect(envelope.data.items[0].id).toBe('p1');
    });

    it('should emit oxy.project.add envelope with created project when running project add --machine', () => {
      // Arrange
      const tokens = ['project', 'add', 'New Proj', '--color', 'teal', '--machine'];

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, tokens));

      // Assert
      expect(envelope.schema).toBe('oxy.project.add');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.name).toBe('New Proj');
      expect(envelope.data.color).toBe('teal');
    });

    it('should emit oxy.project.rename envelope with updated project when running project rename --machine', () => {
      // Arrange
      const tokens = ['project', 'rename', 'p1', 'Renamed Alpha', '--machine'];

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, tokens));

      // Assert
      expect(envelope.schema).toBe('oxy.project.rename');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.id).toBe('p1');
      expect(envelope.data.name).toBe('Renamed Alpha');
    });

    it('should emit oxy.project.archive envelope with id and action when running project archive --machine', () => {
      // Arrange
      const tokens = ['project', 'archive', 'p1', '--machine'];

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, tokens));

      // Assert
      expect(envelope.schema).toBe('oxy.project.archive');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data).toEqual({ id: 'p1', action: 'archived' });
    });
  });

  describe('task entity commands', () => {
    it('should emit oxy.task.list envelope with items array when running task list --machine', () => {
      // Arrange
      const tokens = ['task', 'list', '--machine'];

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, tokens));

      // Assert
      expect(envelope.schema).toBe('oxy.task.list');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.items).toHaveLength(3);
    });

    it('should emit oxy.task.add envelope with created task when running task add --machine', () => {
      // Arrange
      const tokens = ['task', 'add', 'New Task', '-p', 'p1', '--machine'];

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, tokens));

      // Assert
      expect(envelope.schema).toBe('oxy.task.add');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.name).toBe('New Task');
      expect(envelope.data.projectId).toBe('p1');
    });

    it('should emit oxy.task.done envelope with updated task when running task done --machine', () => {
      // Arrange
      const tokens = ['task', 'done', 't1', '--machine'];

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, tokens));

      // Assert
      expect(envelope.schema).toBe('oxy.task.done');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.id).toBe('t1');
      expect(envelope.data.completed).toBe(true);
    });

    it('should emit oxy.task.rename envelope with updated task when running task rename --machine', () => {
      // Arrange
      const tokens = ['task', 'rename', 't1', 'New Alpha Name', '--machine'];

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, tokens));

      // Assert
      expect(envelope.schema).toBe('oxy.task.rename');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.id).toBe('t1');
      expect(envelope.data.name).toBe('New Alpha Name');
    });

    it('should emit oxy.task.rate envelope with updated task when running task rate --machine', () => {
      // Arrange
      const tokens = ['task', 'rate', 't1', '75', '--machine'];

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, tokens));

      // Assert
      expect(envelope.schema).toBe('oxy.task.rate');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.id).toBe('t1');
      expect(envelope.data.hourlyRate).toBe('75');
    });



    it('should emit oxy.task.archive envelope with id and action when running task archive --machine', () => {
      // Arrange
      const tokens = ['task', 'archive', 't1', '--machine'];

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, tokens));

      // Assert
      expect(envelope.schema).toBe('oxy.task.archive');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data).toEqual({ id: 't1', action: 'archived' });
    });
  });

  describe('log entity commands', () => {
    it('should emit oxy.log.list envelope with items and totalMatched when running log list --machine', () => {
      // Arrange
      const tokens = ['log', 'list', '--from', '2026-06-01', '--to', '2026-06-30', '--machine'];

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, tokens));

      // Assert
      expect(envelope.schema).toBe('oxy.log.list');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.items).toHaveLength(1);
      expect(envelope.data.totalMatched).toBe(1);
    });

    it('should emit oxy.log.add envelope with created log when running log add --machine', () => {
      // Arrange
      const tokens = ['log', 'add', 't1', '1h', 'Added session', '--machine'];

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, tokens));

      // Assert
      expect(envelope.schema).toBe('oxy.log.add');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.taskId).toBe('t1');
      expect(envelope.data.note).toBe('Added session');
    });

    it('should emit oxy.log.remove envelope with id, action and entry when running log rm --machine', () => {
      // Arrange
      const tokens = ['log', 'rm', 'l1', '--machine'];

      // Act
      const envelope = parseSingleEnvelope(runCommand(store, tokens));

      // Assert
      expect(envelope.schema).toBe('oxy.log.remove');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.id).toBe('l1');
      expect(envelope.data.action).toBe('removed');
      expect(envelope.data.entry.id).toBe('l1');
    });
  });

  describe('envelope contract', () => {
    it('should use camelCase keys at every depth when running each migrated entity command', () => {
      // Arrange
      const scenarios: string[][] = [
        ['project', 'list', '--machine'],
        ['project', 'add', 'Contract Proj', '--machine'],
        ['project', 'rename', 'p1', 'Contract Renamed', '--machine'],
        ['project', 'archive', 'p1', '--machine'],
        ['task', 'list', '--machine'],
        ['task', 'add', 'Contract Task', '-p', 'p2', '--machine'],
        ['task', 'done', 't1', '--machine'],
        ['task', 'rename', 't1', 'Contract Task Renamed', '--machine'],
        ['task', 'rate', 't1', '100', '--machine'],
        ['task', 'archive', 't1', '--machine'],
        ['log', 'list', '--from', '2026-06-01', '--to', '2026-06-30', '--machine'],
        ['log', 'add', 't1', '30m', 'Note', '--machine'],
        ['log', 'rm', 'l1', '--machine'],
      ];

      // Act
      const envelopes = scenarios.map((tokens) => parseSingleEnvelope(runCommand(store, tokens)));

      // Assert
      for (const envelope of envelopes) {
        expect(envelope.schema).toMatch(/^oxy\.(project|task|log)\.[a-z]+$/);
        expect(Number.isInteger(envelope.schemaVersion)).toBe(true);
        expect(collectNonCamelCaseKeys(envelope)).toEqual([]);
      }
    });
  });
});
