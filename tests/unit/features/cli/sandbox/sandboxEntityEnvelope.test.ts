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
    it('project list --machine should emit oxy.project.list envelope with items array', () => {
      const envelope = parseSingleEnvelope(runCommand(store, ['project', 'list', '--machine']));
      expect(envelope.schema).toBe('oxy.project.list');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.items).toHaveLength(2);
      expect(envelope.data.items[0].id).toBe('p1');
    });

    it('project add --machine should emit oxy.project.add envelope with created project', () => {
      const envelope = parseSingleEnvelope(runCommand(store, ['project', 'add', 'New Proj', '--color', 'teal', '--machine']));
      expect(envelope.schema).toBe('oxy.project.add');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.name).toBe('New Proj');
      expect(envelope.data.color).toBe('teal');
    });

    it('project rename --machine should emit oxy.project.rename envelope with updated project', () => {
      const envelope = parseSingleEnvelope(runCommand(store, ['project', 'rename', 'p1', 'Renamed Alpha', '--machine']));
      expect(envelope.schema).toBe('oxy.project.rename');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.id).toBe('p1');
      expect(envelope.data.name).toBe('Renamed Alpha');
    });

    it('project archive --machine should emit oxy.project.archive envelope with id and action', () => {
      const envelope = parseSingleEnvelope(runCommand(store, ['project', 'archive', 'p1', '--machine']));
      expect(envelope.schema).toBe('oxy.project.archive');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data).toEqual({ id: 'p1', action: 'archived' });
    });
  });

  describe('task entity commands', () => {
    it('task list --machine should emit oxy.task.list envelope with items array', () => {
      const envelope = parseSingleEnvelope(runCommand(store, ['task', 'list', '--machine']));
      expect(envelope.schema).toBe('oxy.task.list');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.items).toHaveLength(3);
    });

    it('task add --machine should emit oxy.task.add envelope with created task', () => {
      const envelope = parseSingleEnvelope(runCommand(store, ['task', 'add', 'New Task', '-p', 'p1', '--machine']));
      expect(envelope.schema).toBe('oxy.task.add');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.name).toBe('New Task');
      expect(envelope.data.projectId).toBe('p1');
    });

    it('task done --machine should emit oxy.task.done envelope with updated task', () => {
      const envelope = parseSingleEnvelope(runCommand(store, ['task', 'done', 't1', '--machine']));
      expect(envelope.schema).toBe('oxy.task.done');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.id).toBe('t1');
      expect(envelope.data.completed).toBe(true);
    });

    it('task rename --machine should emit oxy.task.rename envelope with updated task', () => {
      const envelope = parseSingleEnvelope(runCommand(store, ['task', 'rename', 't1', 'New Alpha Name', '--machine']));
      expect(envelope.schema).toBe('oxy.task.rename');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.id).toBe('t1');
      expect(envelope.data.name).toBe('New Alpha Name');
    });

    it('task rate --machine should emit oxy.task.rate envelope with updated task', () => {
      const envelope = parseSingleEnvelope(runCommand(store, ['task', 'rate', 't1', '75', '--machine']));
      expect(envelope.schema).toBe('oxy.task.rate');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.id).toBe('t1');
      expect(envelope.data.hourlyRate).toBe('75');
    });

    it('task reparent --machine should emit oxy.task.reparent envelope with updated task', () => {
      const envelope = parseSingleEnvelope(runCommand(store, ['task', 'reparent', 't2', 'root', '--machine']));
      expect(envelope.schema).toBe('oxy.task.reparent');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.id).toBe('t2');
      expect(envelope.data.parentTaskId).toBeNull();
    });

    it('task move --machine should emit oxy.task.move envelope with updated task', () => {
      const envelope = parseSingleEnvelope(runCommand(store, ['task', 'move', 't1', 'p2', '--machine']));
      expect(envelope.schema).toBe('oxy.task.move');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.id).toBe('t1');
      expect(envelope.data.projectId).toBe('p2');
    });

    it('task archive --machine should emit oxy.task.archive envelope with id and action', () => {
      const envelope = parseSingleEnvelope(runCommand(store, ['task', 'archive', 't1', '--machine']));
      expect(envelope.schema).toBe('oxy.task.archive');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data).toEqual({ id: 't1', action: 'archived' });
    });
  });

  describe('log entity commands', () => {
    it('log list --machine should emit oxy.log.list envelope with items and totalMatched', () => {
      const envelope = parseSingleEnvelope(runCommand(store, ['log', 'list', '--from', '2026-06-01', '--to', '2026-06-30', '--machine']));
      expect(envelope.schema).toBe('oxy.log.list');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.items).toHaveLength(1);
      expect(envelope.data.totalMatched).toBe(1);
    });

    it('log add --machine should emit oxy.log.add envelope with created log', () => {
      const envelope = parseSingleEnvelope(runCommand(store, ['log', 'add', 't1', '1h', 'Added session', '--machine']));
      expect(envelope.schema).toBe('oxy.log.add');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.taskId).toBe('t1');
      expect(envelope.data.note).toBe('Added session');
    });

    it('log rm --machine should emit oxy.log.remove envelope with id, action and entry', () => {
      const envelope = parseSingleEnvelope(runCommand(store, ['log', 'rm', 'l1', '--machine']));
      expect(envelope.schema).toBe('oxy.log.remove');
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.data.id).toBe('l1');
      expect(envelope.data.action).toBe('removed');
      expect(envelope.data.entry.id).toBe('l1');
    });
  });

  describe('envelope contract', () => {
    it('should use camelCase keys at every depth for each migrated entity command', () => {
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
        ['task', 'reparent', 't2', 'none', '--machine'],
        ['task', 'move', 't1', 'p2', '--machine'],
        ['task', 'archive', 't1', '--machine'],
        ['log', 'list', '--from', '2026-06-01', '--to', '2026-06-30', '--machine'],
        ['log', 'add', 't1', '30m', 'Note', '--machine'],
        ['log', 'rm', 'l1', '--machine'],
      ];

      for (const tokens of scenarios) {
        const envelope = parseSingleEnvelope(runCommand(store, tokens));
        expect(envelope.schema).toMatch(/^oxy\.(project|task|log)\.[a-z]+$/);
        expect(Number.isInteger(envelope.schemaVersion)).toBe(true);
        expect(collectNonCamelCaseKeys(envelope)).toEqual([]);
      }
    });
  });
});
