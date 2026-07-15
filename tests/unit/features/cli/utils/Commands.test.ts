import { describe, it, expect, vi } from 'vitest';
import {
  runProjectsCommand,
  runTasksCommand,
  runAddProjectCommand,
  runAddTaskCommand,
  runAddSubtaskCommand,
  runStartCommand,
  runStopCommand,
  runStatusCommand,
  runHolidaysCommand,
  TerminalLine,
  CliEngineContext
} from '@features/cli/utils/Commands';

describe('Unit Tests: Commands', () => {
  const getMockContext = (): CliEngineContext => ({
    projects: [
      { id: 'p1', name: 'Project 1', color: 'indigo', createdAt: '2026-06-15T00:00:00Z', archived: false, description: null, icon: null, tags: null }
    ],
    tasks: [
      { id: 't1', projectId: 'p1', name: 'Task 1', completed: false, createdAt: '2026-06-15T00:00:00Z', status: null, parentTaskId: null },
      { id: 't2', projectId: 'p1', name: 'Subtask 1', completed: true, createdAt: '2026-06-15T01:00:00Z', status: null, parentTaskId: 't1' }
    ],
    logs: [
      { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T13:00:00Z', note: null, editHistory: null }
    ],
    activeLog: null,
    onAddProject: vi.fn(),
    onAddTask: vi.fn(),
    onToggleTaskComplete: vi.fn(),
    onStartTimer: vi.fn(),
    onStopTimer: vi.fn(),
    nowIso: '2026-06-15T14:00:00Z',
    locale: 'en',
    customTranslations: {},
    holidays: [],
    setHolidays: vi.fn(),
    selectedTaskId: null,
    setSelectedTaskId: vi.fn(),
  });

  it('runProjectsCommand should list projects', () => {
    const outputs: TerminalLine[] = [];
    runProjectsCommand(getMockContext(), outputs);
    expect(outputs.some(o => o.text.includes('Project 1'))).toBe(true);
  });

  it('runProjectsCommand should show error when no projects exist', () => {
    const context = getMockContext();
    context.projects = [];
    const outputs: TerminalLine[] = [];
    runProjectsCommand(context, outputs);
    expect(outputs[0].type).toBe('error');
  });

  it('runTasksCommand should list tasks for a project ID', () => {
    const outputs: TerminalLine[] = [];
    runTasksCommand(['p1'], getMockContext(), outputs);
    expect(outputs.some(o => o.text.includes('Task 1'))).toBe(true);
    expect(outputs.some(o => o.text.includes('Subtask 1'))).toBe(true);
  });

  it('runTasksCommand should handle invalid project ID', () => {
    const outputs: TerminalLine[] = [];
    runTasksCommand(['nonexistent'], getMockContext(), outputs);
    expect(outputs[0].type).toBe('error');
  });

  it('runAddProjectCommand should trigger callback and output success', () => {
    const context = getMockContext();
    const outputs: TerminalLine[] = [];
    runAddProjectCommand(['New Project'], context, outputs);
    expect(context.onAddProject).toHaveBeenCalledWith('New Project', 'indigo');
    expect(outputs[0].type).toBe('success');
  });

  it('runAddTaskCommand should trigger callback and output success', () => {
    const context = getMockContext();
    const outputs: TerminalLine[] = [];
    runAddTaskCommand(['p1', 'New Task'], context, outputs);
    expect(context.onAddTask).toHaveBeenCalledWith('p1', 'New Task', null);
    expect(outputs[0].type).toBe('success');
  });

  it('runAddSubtaskCommand should trigger callback and output success', () => {
    const context = getMockContext();
    const outputs: TerminalLine[] = [];
    runAddSubtaskCommand(['t1', 'New Subtask'], context, outputs);
    expect(context.onAddTask).toHaveBeenCalledWith('p1', 'New Subtask', 't1');
    expect(outputs[0].type).toBe('success');
  });

  it('runStartCommand should start timer on specify task', () => {
    const context = getMockContext();
    const outputs: TerminalLine[] = [];
    runStartCommand(['t1'], context, outputs);
    expect(context.onStartTimer).toHaveBeenCalledWith('t1');
    expect(context.setSelectedTaskId).toHaveBeenCalledWith('t1');
    expect(outputs[0].type).toBe('success');
  });

  it('runStopCommand should stop timer', () => {
    const context = getMockContext();
    context.activeLog = { id: 'l2', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T13:00:00Z', endTime: null, note: null, editHistory: null };
    const outputs: TerminalLine[] = [];
    runStopCommand([], context, outputs);
    expect(context.onStopTimer).toHaveBeenCalled();
    expect(outputs[0].type).toBe('success');
  });

  it('runStatusCommand should show active status or idle state', () => {
    const context = getMockContext();
    const outputs: TerminalLine[] = [];
    runStatusCommand(context, outputs);
    expect(outputs[0].text.includes('Idle') || outputs[0].text.includes('bezczynności')).toBe(true);

    const outputsActive: TerminalLine[] = [];
    context.activeLog = { id: 'l2', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T13:00:00Z', endTime: null, note: null, editHistory: null };
    runStatusCommand(context, outputsActive);
    expect(outputsActive.some(o => o.text.includes('Task 1'))).toBe(true);
  });

  it('runHolidaysCommand should list holidays or add a holiday', () => {
    const context = getMockContext();
    const outputsList: TerminalLine[] = [];
    runHolidaysCommand([], context, outputsList);
    expect(outputsList[0].text.includes('holidays and leaves table is empty') || outputsList[0].text.includes('NoHolidays')).toBe(true);

    const outputsAdd: TerminalLine[] = [];
    runHolidaysCommand(['add', 'holiday', '2026-07-20', 'Test Holiday'], context, outputsAdd);
    expect(context.setHolidays).toHaveBeenCalled();
    expect(outputsAdd[0].type).toBe('success');
  });
});
