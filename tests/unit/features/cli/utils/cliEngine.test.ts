import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCliCommand } from '@features/cli/utils/cliEngine';
import { CliEngineContext } from '@features/cli/utils/commands';
import { EngineRouter } from '@common/engine/EngineRouter';
import { IEngine } from '@common/engine/IEngine';

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

  const mockGetRangeMetrics = vi.fn().mockResolvedValue({
    totalSeconds: 3600,
    projectElapsed: { p1: 3600 },
    taskElapsed: { t1: 3600 },
    clampedLogs: [
      {
        id: 'l1',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-06-15T08:00:00Z',
        endTime: '2026-06-15T09:00:00Z',
        originalDurationSeconds: 3600,
        clampedDurationSeconds: 3600,
        isMultiDaySegment: false,
        clampedStartTime: '2026-06-15T08:00:00Z',
        clampedEndTime: '2026-06-15T09:00:00Z'
      }
    ]
  });

  const mockGetProjectElapsed = vi.fn().mockResolvedValue(3600);
  const mockGetTaskElapsed = vi.fn().mockResolvedValue(3600);

  beforeEach(() => {
    vi.clearAllMocks();

    const mockEngine: IEngine = {
      timer: {
        startTimer: vi.fn(),
        stopTimer: vi.fn(),
        resumeTimer: vi.fn(),
        switchTimer: vi.fn(),
        getActiveLogs: vi.fn().mockResolvedValue([])
      },
      metrics: {
        getComputedMetrics: vi.fn().mockResolvedValue({ projects: {}, tasks: {}, totalElapsedToday: 0 }),
        getTaskElapsed: mockGetTaskElapsed,
        getProjectElapsed: mockGetProjectElapsed,
        getElapsedRange: vi.fn().mockResolvedValue(3600),
        getRangeMetrics: mockGetRangeMetrics,
        getProjectStatistics: vi.fn().mockResolvedValue({})
      },
      timeLogs: {
        editTimeLog: vi.fn()
      },
      validation: {
        validateProjectName: vi.fn(),
        validateTaskName: vi.fn(),
        validateTaskHierarchy: vi.fn()
      }
    };
    EngineRouter.getInstance().setImplementationForTesting(mockEngine);

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

  it('should return empty lines if command is empty or whitespace', async () => {
    // Arrange
    const emptyCmd = '';
    const spaceCmd = '   ';

    // Act
    const emptyResult = await executeCliCommand(emptyCmd, mockContext);
    const spaceResult = await executeCliCommand(spaceCmd, mockContext);

    // Assert
    expect(emptyResult).toEqual([]);
    expect(spaceResult).toEqual([]);
  });

  it('should execute help and oxyhelp commands', async () => {
    // Arrange
    const cmd1 = 'help';
    const cmd2 = 'oxyhelp';

    // Act
    const resHelp = await executeCliCommand(cmd1, mockContext);
    const resOxyHelp = await executeCliCommand(cmd2, mockContext);

    // Assert
    expect(resHelp.length).toBeGreaterThan(2);
    expect(resHelp[0].type).toBe('input');
    expect(resHelp[1].type).toBe('info');
    expect(resHelp.some(l => l.text.includes('switch'))).toBe(true);

    expect(resOxyHelp.length).toBeGreaterThan(2);
    expect(resOxyHelp[1].type).toBe('info');
  });

  it('should return clear token for clear command', async () => {
    // Arrange
    const cmd = 'clear';

    // Act
    const res = await executeCliCommand(cmd, mockContext);

    // Assert
    expect(res).toEqual([{ text: '__CLEAR__', type: 'info' }]);
  });

  it('should return error output with localized guidance for unknown commands', async () => {
    // Arrange
    const cmd = 'unknowncmd';

    // Act
    const res = await executeCliCommand(cmd, mockContext);

    // Assert
    expect(res.some(line => line.type === 'error' && line.text.includes('unknowncmd'))).toBe(true);
  });

  it('should parse double and single quoted arguments correctly', async () => {
    // Arrange
    const cmd = 'addproject "My Special Project"';

    // Act
    await executeCliCommand(cmd, mockContext);

    // Assert
    expect(onAddProjectMock).toHaveBeenCalledWith('My Special Project', 'indigo');
  });

  it('should dispatch projects and projlist commands', async () => {
    // Arrange
    const cmd1 = 'projects';
    const cmd2 = 'projlist';

    // Act
    const res1 = await executeCliCommand(cmd1, mockContext);
    const res2 = await executeCliCommand(cmd2, mockContext);

    // Assert
    expect(res1.some(l => l.text.includes('Project One'))).toBe(true);
    expect(res2.some(l => l.text.includes('Project One'))).toBe(true);
  });

  it('should dispatch tasks command for a given project', async () => {
    // Arrange
    const cmd = 'tasks p1';

    // Act
    const res = await executeCliCommand(cmd, mockContext);

    // Assert
    expect(res.some(l => l.text.includes('Task One'))).toBe(true);
  });

  it('should dispatch addtask command and invoke onAddTask', async () => {
    // Arrange
    const cmd = 'addtask p1 "New Task"';

    // Act
    await executeCliCommand(cmd, mockContext);

    // Assert
    expect(onAddTaskMock).toHaveBeenCalledWith('p1', 'New Task', null);
  });

  it('should dispatch addsubtask command and invoke onAddTask with parent id', async () => {
    // Arrange
    const cmd = 'addsubtask t1 "New Subtask"';

    // Act
    await executeCliCommand(cmd, mockContext);

    // Assert
    expect(onAddTaskMock).toHaveBeenCalledWith('p1', 'New Subtask', 't1');
  });

  it('should dispatch start command and invoke onStartTimer', async () => {
    // Arrange
    const cmd = 'start t1';

    // Act
    await executeCliCommand(cmd, mockContext);

    // Assert
    expect(onStartTimerMock).toHaveBeenCalledWith('t1');
  });

  it('should dispatch switch command by ID and switch active timer', async () => {
    // Arrange
    const cmd = 'switch t1';

    // Act
    const res = await executeCliCommand(cmd, mockContext);

    // Assert
    expect(onStopTimerMock).toHaveBeenCalled();
    expect(setSelectedTaskIdMock).toHaveBeenCalledWith('t1');
    expect(onStartTimerMock).toHaveBeenCalledWith('t1');
    expect(res.some(l => l.type === 'success' && l.text.includes('Task One'))).toBe(true);
  });

  it('should dispatch switch command by name', async () => {
    // Arrange
    const cmd = 'switch "Task One"';

    // Act
    const res = await executeCliCommand(cmd, mockContext);

    // Assert
    expect(onStopTimerMock).toHaveBeenCalled();
    expect(onStartTimerMock).toHaveBeenCalledWith('t1');
    expect(res.some(l => l.type === 'success')).toBe(true);
  });

  it('should return error when switch targets nonexistent task', async () => {
    // Arrange
    const cmd = 'switch nonexistent_task';

    // Act
    const res = await executeCliCommand(cmd, mockContext);

    // Assert
    expect(res.some(l => l.type === 'error' && l.text.includes('nonexistent_task'))).toBe(true);
    expect(onStartTimerMock).not.toHaveBeenCalled();
  });

  it('should dispatch stop command and invoke onStopTimer', async () => {
    // Arrange
    const cmd = 'stop';

    // Act
    await executeCliCommand(cmd, mockContext);

    // Assert
    expect(onStopTimerMock).toHaveBeenCalled();
  });

  it('should dispatch status command', async () => {
    // Arrange
    const cmd = 'status';

    // Act
    const res = await executeCliCommand(cmd, mockContext);

    // Assert
    expect(res.length).toBeGreaterThan(1);
    expect(res.some(l => l.text.includes('Task One'))).toBe(true);
  });

  it('should dispatch complete command and invoke onToggleTaskComplete', async () => {
    // Arrange
    const cmd = 'complete t1';

    // Act
    await executeCliCommand(cmd, mockContext);

    // Assert
    expect(onToggleTaskCompleteMock).toHaveBeenCalledWith('t1');
  });

  it('should dispatch logs command and list recent records', async () => {
    // Arrange
    const cmd = 'logs';

    // Act
    const res = await executeCliCommand(cmd, mockContext);

    // Assert
    expect(res.length).toBeGreaterThan(1);
  });

  it('should dispatch holidays and holiday commands', async () => {
    // Arrange
    const cmd1 = 'holidays';
    const cmd2 = 'holiday';

    // Act
    const res1 = await executeCliCommand(cmd1, mockContext);
    const res2 = await executeCliCommand(cmd2, mockContext);

    // Assert
    expect(res1.length).toBeGreaterThan(1);
    expect(res2.length).toBeGreaterThan(1);
  });

  it('should dispatch report command with given period delegating to metrics engine', async () => {
    // Arrange
    const cmd = 'report today';

    // Act
    const res = await executeCliCommand(cmd, mockContext);

    // Assert
    expect(mockGetRangeMetrics).toHaveBeenCalled();
    expect(res.length).toBeGreaterThan(1);
    expect(res.some(l => l.text.includes('REPORT'))).toBe(true);
  });

  it('should dispatch time command for task inquiry delegating to metrics engine', async () => {
    // Arrange
    const cmd = 'time task t1 today';

    // Act
    const res = await executeCliCommand(cmd, mockContext);

    // Assert
    expect(mockGetRangeMetrics).toHaveBeenCalled();
    expect(res.length).toBeGreaterThan(1);
    expect(res.some(l => l.type === 'success')).toBe(true);
  });

  it('should dispatch renameproject command and invoke onRenameProject', async () => {
    // Arrange
    const cmd = 'renameproject p1 "New Project Name"';

    // Act
    const res = await executeCliCommand(cmd, mockContext);

    // Assert
    expect(onRenameProjectMock).toHaveBeenCalledWith('p1', 'New Project Name');
    expect(res.some(l => l.type === 'success')).toBe(true);
  });

  it('should dispatch renametask command and invoke onRenameTask', async () => {
    // Arrange
    const cmd = 'renametask t1 "New Task Name"';

    // Act
    const res = await executeCliCommand(cmd, mockContext);

    // Assert
    expect(onRenameTaskMock).toHaveBeenCalledWith('t1', 'New Task Name');
    expect(res.some(l => l.type === 'success')).toBe(true);
  });

  it('should handle sandbox on and off commands', async () => {
    // Arrange
    const onToggleSandboxMock = vi.fn();
    const contextWithSandbox: CliEngineContext = {
      ...mockContext,
      onToggleSandbox: onToggleSandboxMock,
    };

    // Act
    const onRes = await executeCliCommand('sandbox on', contextWithSandbox);

    // Assert
    expect(onToggleSandboxMock).toHaveBeenCalledWith(true);
    expect(onRes.some(l => l.type === 'success' && l.text.includes('SANDBOX'))).toBe(true);

    // Act
    const offRes = await executeCliCommand('sandbox off', contextWithSandbox);

    // Assert
    expect(onToggleSandboxMock).toHaveBeenCalledWith(false);
    expect(offRes.some(l => l.type === 'info' && l.text.includes('SANDBOX'))).toBe(true);
  });

  it('should handle sandbox status and reset commands', async () => {
    // Arrange
    const context: CliEngineContext = {
      ...mockContext,
      isSandbox: true,
    };

    // Act
    const statusRes = await executeCliCommand('sandbox status', context);

    // Assert
    expect(statusRes.some(l => l.text.includes('ACTIVE'))).toBe(true);

    // Act
    const resetRes = await executeCliCommand('sandbox reset', context);

    // Assert
    expect(resetRes.some(l => l.type === 'success' && l.text.includes('SANDBOX'))).toBe(true);
  });
});
