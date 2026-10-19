import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import CliInterface from '@features/cli/CliInterface';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { LocaleProvider } from '@common/hooks/LocaleProvider';
import { EngineRouter } from '@common/engine/EngineRouter';
import { IEngine } from '@common/engine/IEngine';

beforeAll(() => {
  if (typeof Element !== 'undefined') {
    Element.prototype.scrollIntoView = vi.fn();
  }
});

describe('Integration Tests: CliInterface Component', () => {
  const mockProjects: Project[] = [
    { id: '1', name: 'Alpha', color: 'red', createdAt: '2026-06-12T00:00:00Z', archived: false, description: null, icon: null, tags: null },
    { id: '2', name: 'Beta', color: 'blue', createdAt: '2026-06-12T00:00:00Z', archived: false, description: null, icon: null, tags: null }
  ];

  const mockTasks: Task[] = [
    { id: '1', projectId: '1', parentTaskId: null, name: 'Task 1', createdAt: '2026-06-12T00:00:00Z', completed: false, status: null }
  ];

  const mockLogs: TimeLog[] = [
    { id: 'log_1', taskId: '1', projectId: '1', startTime: '2026-06-12T01:00:00Z', endTime: '2026-06-12T02:00:00Z', note: null }
  ];

  const mockEngine: IEngine = {
    timer: {
      startTimer: vi.fn(),
      stopTimer: vi.fn(),
      resumeTimer: vi.fn(),
      getActiveLogs: vi.fn().mockResolvedValue([])
    },
    metrics: {
      getComputedMetrics: vi.fn().mockResolvedValue({ projects: {}, tasks: {}, totalElapsedToday: 0 }),
      getTaskElapsed: vi.fn().mockResolvedValue(3600),
      getProjectElapsed: vi.fn().mockResolvedValue(3600),
      getElapsedRange: vi.fn().mockResolvedValue(3600),
      getRangeMetrics: vi.fn().mockResolvedValue({
        totalSeconds: 3600,
        projectElapsed: { '1': 3600 },
        taskElapsed: { '1': 3600 },
        clampedLogs: [
          {
            id: 'log_1',
            projectId: '1',
            taskId: '1',
            startTime: '2026-06-12T01:00:00Z',
            endTime: '2026-06-12T02:00:00Z',
            originalDurationSeconds: 3600,
            clampedDurationSeconds: 3600,
            isMultiDaySegment: false,
            clampedStartTime: '2026-06-12T01:00:00Z',
            clampedEndTime: '2026-06-12T02:00:00Z'
          }
        ]
      }),
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

  const defaultProps = {
    projects: mockProjects,
    tasks: mockTasks,
    logs: mockLogs,
    activeLog: null as TimeLog | null,
    handleAddProject: vi.fn(),
    handleAddTask: vi.fn(),
    handleToggleTaskComplete: vi.fn(),
    handleStartTimer: vi.fn(),
    handleStopTimer: vi.fn(),
    handleToggleProjectArchive: vi.fn(),
    nowIso: '2026-06-12T03:00:00Z',
    locale: 'en' as const,
    holidays: [],
    setHolidays: vi.fn(),
    selectedTaskId: null,
    setSelectedTaskId: vi.fn(),
  };

  const setup = (props = {}) => {
    const combinedProps = { ...defaultProps, ...props };
    const utils = render(
      <LocaleProvider>
        <MockProviders state={combinedProps}>
          <CliInterface />
        </MockProviders>
      </LocaleProvider>
    );
    const input = utils.container.querySelector('input') as HTMLInputElement;
    const form = utils.container.querySelector('form') as HTMLFormElement;
    if (!input) {
      throw new Error(`Input not found. HTML: ${utils.container.innerHTML}`);
    }
    return { ...utils, input, form, combinedProps };
  };

  const submitCommand = async (input: HTMLInputElement, form: HTMLFormElement, cmd: string) => {
    fireEvent.change(input, { target: { value: cmd } });
    fireEvent.submit(form);
  };

  it('Given initial render, When component mounts, Then it shows greeting lines', () => {
    // Given & When
    const { container } = setup();

    // Then
    expect(container.textContent).toContain('LogTime by OxyFlow CLI Engine');
  });

  it('Given idle state, When status command is executed, Then it reports idle', async () => {
    // Given
    const { container, input, form } = setup();

    // When
    await submitCommand(input, form, 'status');

    // Then
    await vi.waitFor(() => {
      expect(container.textContent).toContain('State: Idle. No active tracker running.');
    });
  });

  it('Given active running timer, When status command is executed, Then it reports active task', async () => {
    // Given
    const activeLog: TimeLog = { id: 'log_2', taskId: '1', projectId: '1', startTime: '2026-06-12T02:30:00Z', endTime: null, note: null };
    const { container, input, form } = setup({ activeLog, logs: [...mockLogs, activeLog] });

    // When
    await submitCommand(input, form, 'status');

    // Then
    await vi.waitFor(() => {
      expect(container.textContent).toContain('Task 1');
    });
  });

  it('Given projects in state, When projects command is executed, Then it renders project list', async () => {
    // Given
    const { container, input, form } = setup();

    // When
    await submitCommand(input, form, 'projects');

    // Then
    await vi.waitFor(() => {
      expect(container.textContent).toContain('Alpha');
      expect(container.textContent).toContain('Beta');
    });
  });

  it('Given project with tasks, When tasks command is executed, Then it lists tasks', async () => {
    // Given
    const { container, input, form } = setup();

    // When
    await submitCommand(input, form, 'tasks 1');

    // Then
    await vi.waitFor(() => {
      expect(container.textContent).toContain('Task 1');
    });
  });

  it('Given addproject command, When submitted, Then it calls handleAddProject', async () => {
    // Given
    const { input, form, combinedProps } = setup();

    // When
    await submitCommand(input, form, 'addproject "New Project"');

    // Then
    await vi.waitFor(() => {
      expect(combinedProps.handleAddProject).toHaveBeenCalledWith('New Project', expect.any(String));
    });
  });

  it('Given addtask command, When submitted, Then it calls handleAddTask', async () => {
    // Given
    const { input, form, combinedProps } = setup();

    // When
    await submitCommand(input, form, 'addtask 1 "New Task 2"');

    // Then
    await vi.waitFor(() => {
      expect(combinedProps.handleAddTask).toHaveBeenCalledWith('1', 'New Task 2', null);
    });
  });

  it('Given start command with task id, When submitted, Then it calls handleStartTimer', async () => {
    // Given
    const { input, form, combinedProps } = setup();

    // When
    await submitCommand(input, form, 'start 1');

    // Then
    await vi.waitFor(() => {
      expect(combinedProps.handleStartTimer).toHaveBeenCalledWith('1');
    });
  });

  it('Given active running timer, When stop command is executed, Then it calls handleStopTimer', async () => {
    // Given
    const activeLog: TimeLog = { id: 'log_2', taskId: '1', projectId: '1', startTime: '2026-06-12T02:30:00Z', endTime: null, note: null };
    const { input, form, combinedProps } = setup({ activeLog });

    // When
    await submitCommand(input, form, 'stop');

    // Then
    await vi.waitFor(() => {
      expect(combinedProps.handleStopTimer).toHaveBeenCalled();
    });
  });

  it('Given task id, When complete command is executed, Then it calls handleToggleTaskComplete', async () => {
    // Given
    const { input, form, combinedProps } = setup();

    // When
    await submitCommand(input, form, 'complete 1');

    // Then
    await vi.waitFor(() => {
      expect(combinedProps.handleToggleTaskComplete).toHaveBeenCalledWith('1');
    });
  });

  it('Given existing history, When clear command is submitted, Then it clears terminal history', async () => {
    // Given
    const { container, input, form } = setup();

    // When
    await submitCommand(input, form, 'clear');

    // Then
    await vi.waitFor(() => {
      expect(container.textContent).not.toContain('LogTime by OxyFlow CLI Engine [Version');
    });
  });

  it('Given time logs, When logs command is executed, Then it displays log entries', async () => {
    // Given
    const { container, input, form } = setup();

    // When
    await submitCommand(input, form, 'logs');

    // Then
    await vi.waitFor(() => {
      expect(container.textContent).toContain('og_1');
    });
  });

  it('Given help command, When executed, Then it lists commands including switch', async () => {
    // Given
    const { container, input, form } = setup();

    // When
    await submitCommand(input, form, 'help');

    // Then
    await vi.waitFor(() => {
      expect(container.textContent).toContain('addproject');
      expect(container.textContent).toContain('switch');
    });
  });

  it('Given missing arguments, When addsubtask is executed, Then it returns usage error', async () => {
    // Given
    const { container, input, form } = setup();

    // When
    await submitCommand(input, form, 'addsubtask');

    // Then
    await vi.waitFor(() => {
      expect(container.textContent).toContain('Usage: addsubtask <parent_task_id>');
    });
  });

  it('Given non-existent parent, When addsubtask is executed, Then it returns task not found error', async () => {
    // Given
    const { container, input, form } = setup();

    // When
    await submitCommand(input, form, 'addsubtask 999 "Child Task"');

    // Then
    await vi.waitFor(() => {
      expect(container.textContent).toContain('Task does not exist. 999');
    });
  });

  it('Given valid parent task, When addsubtask is executed, Then it calls handleAddTask and displays success', async () => {
    // Given
    const { container, input, form, combinedProps } = setup();

    // When
    await submitCommand(input, form, 'addsubtask 1 "Subtask 1.1"');

    // Then
    await vi.waitFor(() => {
      expect(combinedProps.handleAddTask).toHaveBeenCalledWith('1', 'Subtask 1.1', '1');
      expect(container.textContent).toContain('Success: Added subtask: Subtask 1.1');
    });
  });

  it('Given completed task ID, When start command is executed with ID, Then it returns task completed error', async () => {
    // Given
    const completedTask = { id: '1', projectId: '1', parentTaskId: null, name: 'Task 1', createdAt: '2026-06-12T00:00:00Z', completed: true, status: null };
    const { container, input, form } = setup({ tasks: [completedTask] });

    // When
    await submitCommand(input, form, 'start 1');

    // Then
    await vi.waitFor(() => {
      expect(container.textContent).toContain('is already marked as completed');
    });
  });

  it('Given active tracking sessions, When stop all command is executed, Then it terminates all timers', async () => {
    // Given
    const activeLog1 = { id: 'log_1', taskId: '1', projectId: '1', startTime: '2026-06-12T02:30:00Z', endTime: null, note: null };
    const { container, input, form, combinedProps } = setup({ activeLog: activeLog1, logs: [activeLog1] });

    // When
    await submitCommand(input, form, 'stop all');

    // Then
    await vi.waitFor(() => {
      expect(combinedProps.handleStopTimer).toHaveBeenCalled();
      expect(container.textContent).toContain('Stopped all (1) active tracking sessions');
    });
  });

  it('Given no active tracking session, When stop command is executed, Then it returns info message', async () => {
    // Given
    const { container, input, form } = setup({ activeLog: null });

    // When
    await submitCommand(input, form, 'stop');

    // Then
    await vi.waitFor(() => {
      expect(container.textContent).toContain('No active timer is currently running');
    });
  });

  it('Given holidays list, When holidays command is executed, Then it lists holidays', async () => {
    // Given
    const mockHolidays = [{ id: 'hol_1', date: '2026-12-25', type: 'holiday' as const, name: 'Christmas' }];
    const { container, input, form } = setup({ holidays: mockHolidays });

    // When
    await submitCommand(input, form, 'holidays');

    // Then
    await vi.waitFor(() => {
      expect(container.textContent).toContain('Christmas');
    });
  });

  it('Given time tracking logs, When report command is executed, Then it renders time summaries and graphs', async () => {
    // Given
    const log1 = { id: 'log_1', taskId: '1', projectId: '1', startTime: '2026-06-12T01:00:00Z', endTime: '2026-06-12T02:00:00Z', note: null };
    const { container, input, form } = setup({ logs: [log1] });

    // When
    await submitCommand(input, form, 'report today');

    // Then
    await vi.waitFor(() => {
      expect(container.textContent).toContain('TIME DURATION REPORT');
      expect(container.textContent).toContain('Alpha');
    });
  });

  it('Given time tracking logs, When time command is executed, Then it returns elapsed time for profile or task', async () => {
    // Given
    const log1 = { id: 'log_1', taskId: '1', projectId: '1', startTime: '2026-06-12T01:00:00Z', endTime: '2026-06-12T02:00:00Z', note: null };
    const { container, input, form } = setup({ logs: [log1] });

    // When
    await submitCommand(input, form, 'time profile 1');

    // Then
    await vi.waitFor(() => {
      expect(container.textContent).toContain('Time elapsed for PROFILE');
    });
  });

  it('Given unknown command, When executed, Then it returns error message with guidance', async () => {
    // Given
    const { container, input, form } = setup();

    // When
    await submitCommand(input, form, 'unknowncmd');

    // Then
    await vi.waitFor(() => {
      expect(container.textContent).toContain('Unknown command');
    });
  });
});
