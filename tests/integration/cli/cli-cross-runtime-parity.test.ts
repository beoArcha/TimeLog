import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCliCommand, CliEngineContext } from '@features/cli/utils/cliEngine';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';
import { SandboxEmulatorStore } from '@features/cli/sandbox/sandboxEmulatorStore';

describe('Given CLI Cross-Runtime Parity Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SandboxEmulatorStore.resetInstanceForTesting();
  });

  const createTestContext = (overrides?: Partial<CliEngineContext>): CliEngineContext => {
    const defaultProject = aProject({ id: 'p1', name: 'Parity Project' });
    const defaultTask = aTask({ id: 't1', projectId: 'p1', name: 'Parity Task' });

    return {
      projects: [defaultProject],
      tasks: [defaultTask],
      logs: [],
      activeLog: null,
      holidays: [],
      setHolidays: vi.fn(),
      selectedTaskId: 't1',
      setSelectedTaskId: vi.fn(),
      locale: 'en',
      customTranslations: {},
      isSandbox: false,
      nowIso: '2026-06-15T10:00:00Z',
      onStartTimer: vi.fn(),
      onStopTimer: vi.fn(),
      onSwitchTask: vi.fn(),
      onAddProject: vi.fn(),
      onRenameProject: vi.fn(),
      onAddTask: vi.fn(),
      onRenameTask: vi.fn(),
      onToggleTaskComplete: vi.fn(),
      ...overrides,
    };
  };

  describe('When executing status command with no running timer', () => {
    it('Then it should return clean status indicating idle state', async () => {
      // Given
      const context = createTestContext({ activeLog: null });

      // When
      const output = await executeCliCommand('status', context);

      // Then
      expect(output.length).toBeGreaterThan(0);
      const text = output.map(l => l.text).join('\n');
      expect(text.toLowerCase()).toMatch(/status|no active|stopped|idle/i);
    });
  });

  describe('When executing status command with an active running timer', () => {
    it('Then it should output active task and project details', async () => {
      // Given
      const activeLog = aTimeLog({
        id: 'l1',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-06-15T09:30:00Z',
        endTime: undefined,
      });
      const context = createTestContext({ activeLog });

      // When
      const output = await executeCliCommand('status', context);

      // Then
      expect(output.length).toBeGreaterThan(0);
      const text = output.map(l => l.text).join('\n');
      expect(text).toContain('Parity Task');
    });
  });

  describe('When executing start command for a valid task', () => {
    it('Then it should invoke onStartTimer with target taskId', async () => {
      // Given
      const startSpy = vi.fn();
      const context = createTestContext({ onStartTimer: startSpy });

      // When
      const output = await executeCliCommand('start t1', context);

      // Then
      expect(startSpy).toHaveBeenCalledWith('t1');
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('When executing start command with unknown task ID', () => {
    it('Then it should report error line without invoking onStartTimer', async () => {
      // Given
      const startSpy = vi.fn();
      const context = createTestContext({ onStartTimer: startSpy });

      // When
      const output = await executeCliCommand('start non-existent-id-999', context);

      // Then
      expect(startSpy).not.toHaveBeenCalled();
      const hasError = output.some(l => l.type === 'error');
      expect(hasError).toBe(true);
    });
  });

  describe('When executing stop command', () => {
    it('Then it should invoke onStopTimer when a timer is active', async () => {
      // Given
      const stopSpy = vi.fn();
      const activeLog = aTimeLog({
        id: 'l1',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-06-15T09:30:00Z',
        endTime: undefined,
      });
      const context = createTestContext({ activeLog, onStopTimer: stopSpy });

      // When
      await executeCliCommand('stop', context);

      // Then
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('When executing unknown command', () => {
    it('Then it should return error line matching CLI contract behavior', async () => {
      // Given
      const context = createTestContext();

      // When
      const output = await executeCliCommand('unknown_cmd_abc', context);

      // Then
      const hasError = output.some(l => l.type === 'error');
      expect(hasError).toBe(true);
    });
  });
});
