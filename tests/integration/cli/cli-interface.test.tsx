import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import CliInterface from '@features/cli/CliInterface';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { LocaleProvider } from '@common/providers/LocaleProvider';
import { OxyContext } from '@common/providers/OxyContext';

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe('Integration Tests: CliInterface Component', () => {
  const mockProjects: Project[] = [
    { id: '1', name: 'Alpha', color: 'red', createdAt: '2026-06-12T00:00:00Z' },
    { id: '2', name: 'Beta', color: 'blue', createdAt: '2026-06-12T00:00:00Z' }
  ];
  
  const mockTasks: Task[] = [
    { id: '1', projectId: '1', parentTaskId: null, name: 'Task 1', createdAt: '2026-06-12T00:00:00Z', completed: false }
  ];
  
  const mockLogs: TimeLog[] = [
    { id: 'log_1', taskId: '1', projectId: '1', startTime: '2026-06-12T01:00:00Z', endTime: '2026-06-12T02:00:00Z' }
  ];

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
         <OxyContext.Provider value={combinedProps as any}>
            <CliInterface />
         </OxyContext.Provider>
      </LocaleProvider>
    );
    const input = utils.container.querySelector('input') as HTMLInputElement;
    const form = utils.container.querySelector('form') as HTMLFormElement;
    if (!input) {
      throw new Error(`Input not found. HTML: ${utils.container.innerHTML}`);
    }
    return { ...utils, input, form, combinedProps };
  };

  it('should_render_correctly_and_show_initial_logs_when_rendered', () => {
    const { container } = setup();
    expect(container.textContent).toContain('LogTime by OxyFlow CLI Engine');
  });

  it('should_handle_status_command_when_submitted', () => {
    const { container, input, form } = setup();
    fireEvent.change(input, { target: { value: 'status' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('State: Idle. No active tracker running.');
  });

  it('should_handle_status_command_with_active_task_when_submitted', () => {
    const activeLog: TimeLog = { id: 'log_2', taskId: '1', projectId: '1', startTime: '2026-06-12T02:30:00Z', endTime: null };
    const { container, input, form } = setup({ activeLog, logs: [...mockLogs, activeLog] });
    fireEvent.change(input, { target: { value: 'status' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('Task 1');
  });

  it('should_handle_projects_command_when_submitted', () => {
    const { container, input, form } = setup();
    fireEvent.change(input, { target: { value: 'projects' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('Alpha');
    expect(container.textContent).toContain('Beta');
  });

  it('should_handle_tasks_command_when_submitted', () => {
    const { container, input, form } = setup();
    fireEvent.change(input, { target: { value: 'tasks 1' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('Task 1');
  });

  it('should_handle_addproject_command_when_submitted', () => {
    const { input, form, combinedProps } = setup();
    fireEvent.change(input, { target: { value: 'addproject "New Project"' } });
    fireEvent.submit(form);
    expect(combinedProps.handleAddProject).toHaveBeenCalledWith('New Project', expect.any(String));
  });

  it('should_handle_addtask_command_when_submitted', () => {
    const { input, form, combinedProps } = setup();
    fireEvent.change(input, { target: { value: 'addtask 1 "New Task 2"' } });
    fireEvent.submit(form);
    expect(combinedProps.handleAddTask).toHaveBeenCalledWith('1', 'New Task 2', null);
  });

  it('should_handle_start_command_when_submitted', () => {
    const { input, form, combinedProps } = setup();
    fireEvent.change(input, { target: { value: 'start 1' } });
    fireEvent.submit(form);
    expect(combinedProps.handleStartTimer).toHaveBeenCalledWith('1');
  });

  it('should_handle_stop_command_when_submitted', () => {
    const activeLog: TimeLog = { id: 'log_2', taskId: '1', projectId: '1', startTime: '2026-06-12T02:30:00Z', endTime: null };
    const { input, form, combinedProps } = setup({ activeLog });
    fireEvent.change(input, { target: { value: 'stop' } });
    fireEvent.submit(form);
    expect(combinedProps.handleStopTimer).toHaveBeenCalled();
  });

  it('should_handle_complete_command_when_submitted', () => {
    const { input, form, combinedProps } = setup();
    fireEvent.change(input, { target: { value: 'complete 1' } });
    fireEvent.submit(form);
    expect(combinedProps.handleToggleTaskComplete).toHaveBeenCalledWith('1');
  });

  it('should_clear_history_when_clear_command_is_submitted', () => {
    const { container, input, form } = setup();
    fireEvent.change(input, { target: { value: 'clear' } });
    fireEvent.submit(form);
    expect(container.textContent).not.toContain('LogTime by OxyFlow CLI Engine [Version');
  });

  it('should_handle_logs_command_when_submitted', () => {
    const { container, input, form } = setup();
    fireEvent.change(input, { target: { value: 'logs' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('og_1');
  });

  it('should_handle_help_command_when_submitted', () => {
    const { container, input, form } = setup();
    fireEvent.change(input, { target: { value: 'help' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('addproject');
    expect(container.textContent).toContain('addtask');
  });

  it('Given missing arguments, When addsubtask is executed, Then it returns usage error', () => {
    const { container, input, form } = setup();
    fireEvent.change(input, { target: { value: 'addsubtask' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('Usage: addsubtask <parent_task_id>');
  });

  it('Given non-existent parent, When addsubtask is executed, Then it returns task not found error', () => {
    const { container, input, form } = setup();
    fireEvent.change(input, { target: { value: 'addsubtask 999 "Child Task"' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('Task does not exist. 999');
  });

  it('Given valid parent task, When addsubtask is executed, Then it calls handleAddTask and displays success', () => {
    const { container, input, form, combinedProps } = setup();
    fireEvent.change(input, { target: { value: 'addsubtask 1 "Subtask 1.1"' } });
    fireEvent.submit(form);
    expect(combinedProps.handleAddTask).toHaveBeenCalledWith('1', 'Subtask 1.1', '1');
    expect(container.textContent).toContain('Success: Added subtask: Subtask 1.1');
  });

  it('Given no tasks exist, When start command is executed without task ID, Then it returns no selected task error', () => {
    const { container, input, form } = setup({ tasks: [], selectedTaskId: null });
    fireEvent.change(input, { target: { value: 'start' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('No task is currently selected');
  });

  it('Given selected task is completed, When start command is executed, Then it returns task completed error', () => {
    const completedTask = { id: '1', projectId: '1', parentTaskId: null, name: 'Task 1', createdAt: '2026-06-12T00:00:00Z', completed: true };
    const { container, input, form } = setup({ tasks: [completedTask], selectedTaskId: '1' });
    fireEvent.change(input, { target: { value: 'start' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('is already completed');
  });

  it('Given valid selected task, When start command is executed without ID, Then it starts the timer', () => {
    const { container, input, form, combinedProps } = setup({ selectedTaskId: '1' });
    fireEvent.change(input, { target: { value: 'start' } });
    fireEvent.submit(form);
    expect(combinedProps.handleStartTimer).toHaveBeenCalledWith('1');
    expect(container.textContent).toContain('Timer started for currently set task');
  });

  it('Given completed task ID, When start command is executed with ID, Then it returns task completed error', () => {
    const completedTask = { id: '1', projectId: '1', parentTaskId: null, name: 'Task 1', createdAt: '2026-06-12T00:00:00Z', completed: true };
    const { container, input, form } = setup({ tasks: [completedTask] });
    fireEvent.change(input, { target: { value: 'start 1' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('completed');
  });

  it('Given active tracking sessions, When stop all command is executed, Then it terminates all timers', () => {
    const activeLog1 = { id: 'log_1', taskId: '1', projectId: '1', startTime: '2026-06-12T02:30:00Z', endTime: null };
    const { container, input, form, combinedProps } = setup({ activeLog: activeLog1, logs: [activeLog1] });
    fireEvent.change(input, { target: { value: 'stop all' } });
    fireEvent.submit(form);
    expect(combinedProps.handleStopTimer).toHaveBeenCalled();
    expect(container.textContent).toContain('Stopped all (1) active tracking sessions');
  });

  it('Given no active tracking session, When stop command is executed, Then it returns info message', () => {
    const { container, input, form } = setup({ activeLog: null });
    fireEvent.change(input, { target: { value: 'stop' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('No active timer is currently running');
  });

  it('Given active logs, When logs command is executed with sorting and filtering, Then it displays correct table', () => {
    const log1 = { id: 'log_1', taskId: '1', projectId: '1', startTime: '2026-06-12T01:00:00Z', endTime: '2026-06-12T02:00:00Z' };
    const log2 = { id: 'log_2', taskId: '1', projectId: '2', startTime: '2026-06-12T02:00:00Z', endTime: null };
    const { container, input, form } = setup({ logs: [log1, log2] });

    // Test running filter
    fireEvent.change(input, { target: { value: 'logs running' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('RUNNING');
    expect(container.textContent).not.toContain('CAPTURED');

    // Test captured filter sorted by duration
    fireEvent.change(input, { target: { value: 'logs captured duration' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('CAPTURED');
  });

  it('Given holidays list, When holidays command is executed, Then it lists holidays or adds new holiday', () => {
    const mockHolidays = [{ id: 'hol_1', date: '2026-12-25', type: 'holiday' as const, name: 'Christmas' }];
    const { container, input, form, combinedProps } = setup({ holidays: mockHolidays });

    // List holidays
    fireEvent.change(input, { target: { value: 'holidays' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('Christmas');

    // Add holiday
    fireEvent.change(input, { target: { value: 'holidays add holiday 2026-01-01 NewYear' } });
    fireEvent.submit(form);
    expect(combinedProps.setHolidays).toHaveBeenCalled();
    expect(container.textContent).toContain('Saved holiday');
  });

  it('Given time tracking logs, When report command is executed, Then it renders time summaries and graphs', () => {
    const log1 = { id: 'log_1', taskId: '1', projectId: '1', startTime: '2026-06-12T01:00:00Z', endTime: '2026-06-12T02:00:00Z' };
    const { container, input, form } = setup({ logs: [log1] });

    fireEvent.change(input, { target: { value: 'report today' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('TIME DURATION REPORT');
    expect(container.textContent).toContain('Alpha');
  });

  it('Given time tracking logs, When time command is executed, Then it returns elapsed time for profile or task', () => {
    const log1 = { id: 'log_1', taskId: '1', projectId: '1', startTime: '2026-06-12T01:00:00Z', endTime: '2026-06-12T02:00:00Z' };
    const { container, input, form } = setup({ logs: [log1] });

    fireEvent.change(input, { target: { value: 'time profile 1' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('Time elapsed for PROFILE');
  });

  it('Given unknown command, When executed, Then it returns error message', () => {
    const { container, input, form } = setup();
    fireEvent.change(input, { target: { value: 'unknowncmd' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('Nieznane polecenie');
  });
});

