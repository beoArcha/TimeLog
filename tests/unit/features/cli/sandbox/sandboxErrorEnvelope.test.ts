import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SandboxEmulatorStore } from '@features/cli/sandbox/sandboxEmulatorStore';
import { SandboxCommandRouter } from '@features/cli/sandbox/sandboxCommandRouter';
import { buildErrorEnvelope } from '@features/cli/sandbox/router/sandboxEnvelope';
import { TerminalOutput } from '@features/cli/utils/terminalOutput';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';

function runCommand(store: SandboxEmulatorStore, tokens: string[]): TerminalOutput {
  const output = new TerminalOutput();
  SandboxCommandRouter.route(tokens, store, output);
  return output;
}

describe('Sandbox error envelopes with structured details', () => {
  let store: SandboxEmulatorStore;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-12T10:30:15.000Z'));
    SandboxEmulatorStore.resetInstanceForTesting();
    store = SandboxEmulatorStore.getInstance();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('buildErrorEnvelope', () => {
    it('omits details completely when details is empty or absent', () => {
      const envelope = buildErrorEnvelope('DOM_ENTITY_NOT_FOUND', 'Task not found', 4, null);
      const jsonStr = JSON.stringify(envelope);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.code).toBe('DOM_ENTITY_NOT_FOUND');
      expect(parsed.category).toBe('entity');
      expect(parsed.exit_code).toBe(4);
      expect(parsed.technical).toBe('Task not found');
      expect(parsed.details).toBeUndefined();
    });

    it('serializes candidates and omits suggestion, field, and value when only candidates are present', () => {
      const candidates = [{ id: 't1', name: 'Alpha Task' }, { id: 't2', name: 'Beta Task' }];
      const envelope = buildErrorEnvelope('DOM_ENTITY_AMBIGUOUS', 'Ambiguous target', 4, { candidates });
      const jsonStr = JSON.stringify(envelope);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.details).toBeDefined();
      expect(parsed.details.candidates).toEqual(candidates);
      expect('suggestion' in parsed.details).toBe(false);
      expect('field' in parsed.details).toBe(false);
      expect('value' in parsed.details).toBe(false);
    });

    it('serializes suggestion and omits candidates, field, and value when only suggestion is present', () => {
      const suggestion = { id: 't1', name: 'Alpha Task' };
      const envelope = buildErrorEnvelope('DOM_ENTITY_DID_YOU_MEAN', 'Did you mean', 4, { suggestion });
      const jsonStr = JSON.stringify(envelope);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.details).toBeDefined();
      expect(parsed.details.suggestion).toEqual(suggestion);
      expect('candidates' in parsed.details).toBe(false);
      expect('field' in parsed.details).toBe(false);
      expect('value' in parsed.details).toBe(false);
    });
  });

  describe('Sandbox router error emissions in machine mode', () => {
    it('emits error envelope with candidates when target is ambiguous under --json', () => {
      store.seedForTesting({
        projects: [aProject({ id: 'p1', name: 'Project 1' })],
        tasks: [
          aTask({ id: 't1', projectId: 'p1', name: 'Duplicate Task' }),
          aTask({ id: 't2', projectId: 'p1', name: 'Duplicate Task' }),
        ],
        logs: [],
        activeLog: null,
      });

      const output = runCommand(store, ['task', 'done', 'Duplicate Task', '--json']);
      const errorLines = output.getLines().filter((l) => l.type === 'error');

      expect(errorLines).toHaveLength(1);
      expect(errorLines[0].errorCode).toBe('DOM_ENTITY_AMBIGUOUS');
      expect(errorLines[0].exitCode).toBe(4);

      const envelope = JSON.parse(errorLines[0].text);
      expect(envelope.code).toBe('DOM_ENTITY_AMBIGUOUS');
      expect(envelope.exit_code).toBe(4);
      expect(envelope.category).toBe('entity');
      expect(envelope.details).toBeDefined();
      expect(envelope.details.candidates).toHaveLength(2);
      expect(envelope.details.candidates).toEqual([
        { id: 't1', name: 'Duplicate Task' },
        { id: 't2', name: 'Duplicate Task' },
      ]);
    });

    it('emits error envelope without details when target is not found under --json', () => {
      store.seedForTesting({
        projects: [aProject({ id: 'p1', name: 'Project 1' })],
        tasks: [aTask({ id: 't1', projectId: 'p1', name: 'Some Task' })],
        logs: [],
        activeLog: null,
      });

      const output = runCommand(store, ['task', 'done', 'Nonexistent Task', '--json']);
      const errorLines = output.getLines().filter((l) => l.type === 'error');

      expect(errorLines).toHaveLength(1);
      expect(errorLines[0].errorCode).toBe('DOM_ENTITY_NOT_FOUND');
      expect(errorLines[0].exitCode).toBe(4);

      const envelope = JSON.parse(errorLines[0].text);
      expect(envelope.code).toBe('DOM_ENTITY_NOT_FOUND');
      expect(envelope.exit_code).toBe(4);
      expect(envelope.details).toBeUndefined();
    });

    it('emits error envelope with candidates when project target is ambiguous in task list --json', () => {
      store.seedForTesting({
        projects: [
          aProject({ id: 'p1', name: 'Client App' }),
          aProject({ id: 'p2', name: 'Client App' }),
        ],
        tasks: [],
        logs: [],
        activeLog: null,
      });

      const output = runCommand(store, ['task', 'list', '--project', 'Client App', '--json']);
      const errorLines = output.getLines().filter((l) => l.type === 'error');

      expect(errorLines).toHaveLength(1);
      expect(errorLines[0].errorCode).toBe('DOM_ENTITY_AMBIGUOUS');
      const envelope = JSON.parse(errorLines[0].text);
      expect(envelope.details.candidates).toHaveLength(2);
    });
  });
});
