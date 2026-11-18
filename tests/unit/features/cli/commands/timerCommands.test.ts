import { describe, it, expect, vi } from 'vitest';
import { runSwitchCommand } from '@features/cli/commands/timerCommands';
import { TerminalOutput } from '@features/cli/utils/terminalOutput';
import type { CliEngineContext } from '@features/cli/types';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';

const buildContext = (overrides: Partial<CliEngineContext> = {}): CliEngineContext => ({
  projects: [aProject({ id: 'p1' })],
  tasks: [aTask({ id: 't2', projectId: 'p1', name: 'Second Task' })],
  logs: [],
  activeLog: null,
  nowIso: '2026-06-15T12:00:00Z',
  locale: 'en',
  customTranslations: {},
  holidays: [],
  setHolidays: vi.fn(),
  selectedTaskId: null,
  setSelectedTaskId: vi.fn(),
  onAddProject: vi.fn(),
  onRenameProject: vi.fn(),
  onAddTask: vi.fn(),
  onRenameTask: vi.fn(),
  onToggleTaskComplete: vi.fn(),
  onStartTimer: vi.fn(),
  onStopTimer: vi.fn(),
  ...overrides,
});

describe('runSwitchCommand', () => {
  it('should call onSwitchTask once with the resolved task id and skip stop and start when onSwitchTask exists', async () => {
    // Arrange
    const onSwitchTask = vi.fn().mockResolvedValue(undefined);
    const context = buildContext({ onSwitchTask });

    // Act
    await runSwitchCommand(['t2'], context, new TerminalOutput());

    // Assert
    expect(onSwitchTask).toHaveBeenCalledExactlyOnceWith('t2');
    expect(context.onStopTimer).not.toHaveBeenCalled();
    expect(context.onStartTimer).not.toHaveBeenCalled();
    expect(context.setSelectedTaskId).toHaveBeenCalledWith('t2');
  });

  it('should wait for onSwitchTask before reporting success', async () => {
    // Arrange
    let finishSwitch: () => void = () => {};
    const onSwitchTask = vi.fn(() => new Promise<void>((resolve) => { finishSwitch = resolve; }));
    const output = new TerminalOutput();

    // Act
    const pending = runSwitchCommand(['t2'], buildContext({ onSwitchTask }), output);
    await Promise.resolve();
    const linesWhilePending = output.getLines().length;
    finishSwitch();
    await pending;

    // Assert
    expect(linesWhilePending).toBe(0);
    expect(output.getLines().some((line) => line.type === 'success')).toBe(true);
  });

  it('should stop and then start sequentially when the context has no onSwitchTask', async () => {
    // Arrange
    const calls: string[] = [];
    const context = buildContext({
      onStopTimer: vi.fn(async () => { await Promise.resolve(); calls.push('stop'); }),
      onStartTimer: vi.fn(() => { calls.push('start'); }),
    });

    // Act
    await runSwitchCommand(['t2'], context, new TerminalOutput());

    // Assert
    expect(calls).toEqual(['stop', 'start']);
  });
});
