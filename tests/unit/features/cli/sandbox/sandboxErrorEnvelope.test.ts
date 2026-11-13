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

function errorLinesOf(output: TerminalOutput) {
  return output.getLines().filter((l) => l.type === 'error');
}

describe('buildErrorEnvelope', () => {
  it('should omit details and the user layer when no details are given', () => {
    // Arrange
    const nowMs = Date.parse('2026-11-12T10:30:15.000Z');

    // Act
    const parsed = JSON.parse(JSON.stringify(buildErrorEnvelope('DOM_ENTITY_NOT_FOUND', 'Task not found', 4, undefined, nowMs)));

    // Assert
    expect(parsed).toEqual({
      code: 'DOM_ENTITY_NOT_FOUND',
      category: 'entity',
      exit_code: 4,
      timestamp: '2026-11-12T10:30:15Z',
      technical: 'Task not found',
    });
  });

  it('should omit details when the candidate list is empty', () => {
    // Arrange
    const details = { candidates: [] };

    // Act
    const envelope = buildErrorEnvelope('DOM_ENTITY_AMBIGUOUS', 'Ambiguous target', 4, details);

    // Assert
    expect('details' in envelope).toBe(false);
  });

  it('should keep only the candidates when the details carry candidates', () => {
    // Arrange
    const candidates = [{ id: 't1', name: 'Alpha Task' }, { id: 't2', name: 'Beta Task' }];

    // Act
    const parsed = JSON.parse(JSON.stringify(buildErrorEnvelope('DOM_ENTITY_AMBIGUOUS', 'Ambiguous target', 4, { candidates })));

    // Assert
    expect(parsed.details).toEqual({ candidates });
  });

  it('should keep only the suggestion when the details carry a suggestion', () => {
    // Arrange
    const suggestion = { id: 't1', name: 'Alpha Task' };

    // Act
    const parsed = JSON.parse(JSON.stringify(buildErrorEnvelope('DOM_ENTITY_DID_YOU_MEAN', 'Did you mean', 4, { suggestion })));

    // Assert
    expect(parsed.details).toEqual({ suggestion });
  });

  it('should map the category from the code prefix when the code belongs to another domain', () => {
    // Arrange
    const code = 'ENG_TIMER_ACTIVE';

    // Act
    const envelope = buildErrorEnvelope(code, 'Timer already running', 5);

    // Assert
    expect(envelope.category).toBe('engine');
  });
});

describe('SandboxCommandRouter error envelope', () => {
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

  it('should emit the candidates when a task target is ambiguous under --json', () => {
    // Arrange
    store.seedForTesting({
      projects: [aProject({ id: 'p1', name: 'Project 1' })],
      tasks: [
        aTask({ id: 't1', projectId: 'p1', name: 'Duplicate Task' }),
        aTask({ id: 't2', projectId: 'p1', name: 'Duplicate Task' }),
      ],
      logs: [],
      activeLog: null,
    });

    // Act
    const errors = errorLinesOf(runCommand(store, ['task', 'done', 'Duplicate Task', '--json']));

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].errorCode).toBe('DOM_ENTITY_AMBIGUOUS');
    expect(errors[0].exitCode).toBe(4);
    expect(JSON.parse(errors[0].text)).toMatchObject({
      code: 'DOM_ENTITY_AMBIGUOUS',
      category: 'entity',
      exit_code: 4,
      details: {
        candidates: [
          { id: 't1', name: 'Duplicate Task' },
          { id: 't2', name: 'Duplicate Task' },
        ],
      },
    });
  });

  it('should emit an envelope without details when a task target is not found under --json', () => {
    // Arrange
    store.seedForTesting({
      projects: [aProject({ id: 'p1', name: 'Project 1' })],
      tasks: [aTask({ id: 't1', projectId: 'p1', name: 'Some Task' })],
      logs: [],
      activeLog: null,
    });

    // Act
    const errors = errorLinesOf(runCommand(store, ['task', 'done', 'Nonexistent Task', '--json']));

    // Assert
    expect(errors).toHaveLength(1);
    const envelope = JSON.parse(errors[0].text);
    expect(envelope.code).toBe('DOM_ENTITY_NOT_FOUND');
    expect(envelope.exit_code).toBe(4);
    expect('details' in envelope).toBe(false);
    expect('user' in envelope).toBe(false);
  });

  it('should emit the project candidates when the project filter of task list is ambiguous under --json', () => {
    // Arrange
    store.seedForTesting({
      projects: [
        aProject({ id: 'p1', name: 'Client App' }),
        aProject({ id: 'p2', name: 'Client App' }),
      ],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    // Act
    const errors = errorLinesOf(runCommand(store, ['task', 'list', '--project', 'Client App', '--json']));

    // Assert
    expect(errors).toHaveLength(1);
    expect(JSON.parse(errors[0].text).details.candidates).toEqual([
      { id: 'p1', name: 'Client App' },
      { id: 'p2', name: 'Client App' },
    ]);
  });

  it('should print plain text when a task target is ambiguous in human mode', () => {
    // Arrange
    store.seedForTesting({
      projects: [aProject({ id: 'p1', name: 'Project 1' })],
      tasks: [
        aTask({ id: 't1', projectId: 'p1', name: 'Duplicate Task' }),
        aTask({ id: 't2', projectId: 'p1', name: 'Duplicate Task' }),
      ],
      logs: [],
      activeLog: null,
    });

    // Act
    const errors = errorLinesOf(runCommand(store, ['task', 'done', 'Duplicate Task']));

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].errorCode).toBe('DOM_ENTITY_AMBIGUOUS');
    expect(() => JSON.parse(errors[0].text)).toThrow();
  });
});
