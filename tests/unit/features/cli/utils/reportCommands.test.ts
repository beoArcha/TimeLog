import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  runLogsCommand,
  runReportCommand,
  runTimeCommand
} from '@features/cli/utils/reportCommands';
import { TerminalLine, CliEngineContext } from '@features/cli/types';
import { EngineRouter } from '@common/engine/EngineRouter';
import { IEngine } from '@common/engine/IEngine';
import { aProject, aTask, aTimeLog, aClampedTimeLog } from '@tests/shared/builders/entity-builders';

describe('Unit Tests: ReportCommands', () => {
  const mockGetRangeMetrics = vi.fn();
  const mockGetProjectElapsed = vi.fn();
  const mockGetTaskElapsed = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetRangeMetrics.mockResolvedValue({
      clampedLogs: [
        aClampedTimeLog({
          id: 'l1',
          taskId: 't1',
          projectId: 'p1',
          startTime: '2026-06-15T12:00:00Z',
          endTime: '2026-06-15T13:00:00Z',
          clampedDurationSeconds: 3600
        })
      ],
      projectElapsed: { p1: 3600 },
      taskElapsed: { t1: 3600 },
      totalElapsed: 3600,
      periodTotalElapsed: 3600
    });

    mockGetProjectElapsed.mockResolvedValue(3600);
    mockGetTaskElapsed.mockResolvedValue(3600);

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
  });

  const getMockContext = (): CliEngineContext => ({
    projects: [
      aProject({ id: 'p1', name: 'Project 1' })
    ],
    tasks: [
      aTask({ id: 't1', projectId: 'p1', name: 'Task 1' })
    ],
    logs: [
      aTimeLog({ id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T13:00:00Z' }),
      aTimeLog({ id: 'l2', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T14:00:00Z', endTime: null })
    ],
    activeLog: null,
    onAddProject: vi.fn(),
    onRenameProject: vi.fn(),
    onAddTask: vi.fn(),
    onRenameTask: vi.fn(),
    onToggleTaskComplete: vi.fn(),
    onStartTimer: vi.fn(),
    onStopTimer: vi.fn(),
    nowIso: '2026-06-15T15:00:00Z',
    locale: 'en',
    customTranslations: {},
    holidays: [],
    setHolidays: vi.fn(),
    selectedTaskId: null,
    setSelectedTaskId: vi.fn(),
  });

  it('runLogsCommand should list all logs', () => {
    // Arrange
    const outputs: TerminalLine[] = [];
    const context = getMockContext();

    // Act
    runLogsCommand([], context, outputs);

    // Assert
    expect(outputs.some(o => o.text.includes('l1') || o.text.includes('l2'))).toBe(true);
  });

  it('runLogsCommand should filter logs by running status', () => {
    // Arrange
    const outputs: TerminalLine[] = [];
    const context = getMockContext();

    // Act
    runLogsCommand(['running'], context, outputs);

    // Assert
    expect(outputs.some(o => o.text.includes('l2'))).toBe(true);
    expect(outputs.some(o => o.text.includes('l1'))).toBe(false);
  });

  it('runReportCommand should generate project duration report', async () => {
    // Arrange
    const outputs: TerminalLine[] = [];
    const context = getMockContext();

    // Act
    await runReportCommand(['today'], context, outputs);

    // Assert
    expect(mockGetRangeMetrics).toHaveBeenCalled();
    expect(outputs.some(o => o.text.includes('Project 1'))).toBe(true);
    expect(outputs.some(o => o.text.includes('█'))).toBe(true);
  });

  it('runTimeCommand should display project profile time', async () => {
    // Arrange
    const outputs: TerminalLine[] = [];
    const context = getMockContext();

    // Act
    await runTimeCommand(['profile', 'p1'], context, outputs);

    // Assert
    expect(mockGetProjectElapsed).toHaveBeenCalledWith('p1', context.nowIso);
    expect(outputs.some(o => o.text.includes('Project 1') || o.text.includes('p1'))).toBe(true);
  });

  it('runTimeCommand should display task elapsed time', async () => {
    // Arrange
    const outputs: TerminalLine[] = [];
    const context = getMockContext();

    // Act
    await runTimeCommand(['task', 't1'], context, outputs);

    // Assert
    expect(mockGetTaskElapsed).toHaveBeenCalledWith('t1', context.nowIso);
    expect(outputs.some(o => o.text.includes('Task 1') || o.text.includes('t1'))).toBe(true);
  });
});
