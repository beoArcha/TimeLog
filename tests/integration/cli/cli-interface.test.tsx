import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import CliInterface from '../../../src/components/features/cli/CliInterface';
import { Project, Task, TimeLog } from '../../../src/types';
import { LocaleProvider } from '../../../src/providers/LocaleProvider';
import { OxyContext } from '../../../src/hooks/useOxyFlow';

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
});
