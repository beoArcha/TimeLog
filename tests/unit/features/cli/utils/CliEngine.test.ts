import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCliCommand } from '@features/cli/utils/CliEngine';
import { CliEngineContext } from '@features/cli/utils/Commands';

describe('Unit Tests: CliEngine', () => {
  let mockContext: CliEngineContext;
  const onAddProjectMock = vi.fn();
  const onRenameProjectMock = vi.fn();
  const onAddTaskMock = vi.fn();
  const onRenameTaskMock = vi.fn();
  const onToggleTaskCompleteMock = vi.fn();
  const onStartTimerMock = vi.fn();
  const onStopTimerMock = vi.fn();
  const setHolidaysMock = vi.fn();
  const setSelectedTaskIdMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = {
      projects: [
        { id: 'p1', name: 'Project One', color: 'indigo', createdAt: '2026-06-15T00:00:00Z', archived: false, description: null, icon: null, tags: null }
      ],
      tasks: [
        { id: 't1', projectId: 'p1', name: 'Task One', completed: false, createdAt: '2026-06-15T00:00:00Z', status: null, parentTaskId: null }
      ],
      logs: [
        { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T08:00:00Z', endTime: '2026-06-15T09:00:00Z', note: null }
      ],
      activeLog: { id: 'l2', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T11:00:00Z', endTime: null, note: null },
      onAddProject: onAddProjectMock,
      onRenameProject: onRenameProjectMock,
      onAddTask: onAddTaskMock,
      onRenameTask: onRenameTaskMock,
      onToggleTaskComplete: onToggleTaskCompleteMock,
      onStartTimer: onStartTimerMock,
      onStopTimer: onStopTimerMock,
      nowIso: '2026-06-15T12:00:00Z',
      locale: 'en',
      customTranslations: {},
      holidays: [],
      setHolidays: setHolidaysMock,
      selectedTaskId: null,
      setSelectedTaskId: setSelectedTaskIdMock,
    };
  });

  it('should return empty lines if command is empty or whitespace', () => {
    expect(executeCliCommand('', mockContext)).toEqual([]);
    expect(executeCliCommand('   ', mockContext)).toEqual([]);
  });

  it('should execute help and oxyhelp commands', () => {
    const resHelp = executeCliCommand('help', mockContext);
    expect(resHelp.length).toBeGreaterThan(2);
    expect(resHelp[0].type).toBe('input');
    expect(resHelp[1].type).toBe('info');

    const resOxyHelp = executeCliCommand('oxyhelp', mockContext);
    expect(resOxyHelp.length).toBeGreaterThan(2);
    expect(resOxyHelp[1].type).toBe('info');
  });

  it('should return clear token for clear command', () => {
    const res = executeCliCommand('clear', mockContext);
    expect(res).toEqual([{ text: '__CLEAR__', type: 'info' }]);
  });

  it('should return error output for unknown commands', () => {
    const res = executeCliCommand('unknowncmd', mockContext);
    expect(res.some(line => line.type === 'error' && line.text.includes('unknowncmd'))).toBe(true);
  });

  it('should parse double and single quoted arguments correctly', () => {
    executeCliCommand('addproject "My Special Project"', mockContext);
    expect(onAddProjectMock).toHaveBeenCalledWith('My Special Project', 'indigo');
  });

  it('should dispatch projects and projlist commands', () => {
    const res1 = executeCliCommand('projects', mockContext);
    expect(res1.some(l => l.text.includes('Project One'))).toBe(true);

    const res2 = executeCliCommand('projlist', mockContext);
    expect(res2.some(l => l.text.includes('Project One'))).toBe(true);
  });

  it('should dispatch tasks command for a given project', () => {
    const res = executeCliCommand('tasks p1', mockContext);
    expect(res.some(l => l.text.includes('Task One'))).toBe(true);
  });

  it('should dispatch addtask command and invoke onAddTask', () => {
    executeCliCommand('addtask p1 "New Task"', mockContext);
    expect(onAddTaskMock).toHaveBeenCalledWith('p1', 'New Task', null);
  });

  it('should dispatch addsubtask command and invoke onAddTask with parent id', () => {
    executeCliCommand('addsubtask t1 "New Subtask"', mockContext);
    expect(onAddTaskMock).toHaveBeenCalledWith('p1', 'New Subtask', 't1');
  });

  it('should dispatch start command and invoke onStartTimer', () => {
    executeCliCommand('start t1', mockContext);
    expect(onStartTimerMock).toHaveBeenCalledWith('t1');
  });

  it('should dispatch stop command and invoke onStopTimer', () => {
    executeCliCommand('stop', mockContext);
    expect(onStopTimerMock).toHaveBeenCalled();
  });

  it('should dispatch status command', () => {
    const res = executeCliCommand('status', mockContext);
    expect(res.length).toBeGreaterThan(1);
  });

  it('should dispatch complete command and invoke onToggleTaskComplete', () => {
    executeCliCommand('complete t1', mockContext);
    expect(onToggleTaskCompleteMock).toHaveBeenCalledWith('t1');
  });

  it('should dispatch logs command and list recent records', () => {
    const res = executeCliCommand('logs', mockContext);
    expect(res.length).toBeGreaterThan(1);
  });

  it('should dispatch holidays and holiday commands', () => {
    const res1 = executeCliCommand('holidays', mockContext);
    expect(res1.length).toBeGreaterThan(1);

    const res2 = executeCliCommand('holiday', mockContext);
    expect(res2.length).toBeGreaterThan(1);
  });

  it('should dispatch report command with given period', () => {
    const res = executeCliCommand('report today', mockContext);
    expect(res.length).toBeGreaterThan(1);
  });

  it('should dispatch time command for task inquiry', () => {
    const res = executeCliCommand('time task t1 today', mockContext);
    expect(res.length).toBeGreaterThan(1);
  });

  it('should dispatch renameproject command and invoke onRenameProject', () => {
    // Arrange
    const cmd = 'renameproject p1 "New Project Name"';

    // Act
    const res = executeCliCommand(cmd, mockContext);

    // Assert
    expect(onRenameProjectMock).toHaveBeenCalledWith('p1', 'New Project Name');
    expect(res.some(l => l.type === 'success')).toBe(true);
  });

  it('should dispatch renametask command and invoke onRenameTask', () => {
    // Arrange
    const cmd = 'renametask t1 "New Task Name"';

    // Act
    const res = executeCliCommand(cmd, mockContext);

    // Assert
    expect(onRenameTaskMock).toHaveBeenCalledWith('t1', 'New Task Name');
    expect(res.some(l => l.type === 'success')).toBe(true);
  });
});

