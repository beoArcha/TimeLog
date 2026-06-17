import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import CliInterface from '../src/components/CliInterface';
import { Project, Task, TimeLog } from '../src/types';
import { LocaleProvider } from '../src/providers/LocaleProvider';

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe('CliInterface Full Component Tests', () => {
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
    onAddProject: vi.fn(),
    onAddTask: vi.fn(),
    onToggleTaskComplete: vi.fn(),
    onStartTimer: vi.fn(),
    onStopTimer: vi.fn(),
    onToggleProjectArchive: vi.fn(),
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
         <CliInterface {...combinedProps} />
      </LocaleProvider>
    );
    const input = utils.container.querySelector('input') as HTMLInputElement;
    const form = utils.container.querySelector('form') as HTMLFormElement;
    if (!input) {
      throw new Error(`Input not found. HTML: ${utils.container.innerHTML}`);
    }
    return { ...utils, input, form, combinedProps };
  };

  it('renders correctly and shows initial logs', () => {
    const { container } = setup();
    expect(container.textContent).toContain('OxyFlow CLI Engine');
  });

  it('handles "status" command', () => {
    const { container, input, form } = setup();
    fireEvent.change(input, { target: { value: 'status' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('State: Idle. No active tracker running.');
  });

  it('handles "status" command with active task', () => {
    const activeLog: TimeLog = { id: 'log_2', taskId: '1', projectId: '1', startTime: '2026-06-12T02:30:00Z', endTime: null };
    const { container, input, form } = setup({ activeLog, logs: [...mockLogs, activeLog] });
    fireEvent.change(input, { target: { value: 'status' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('Task 1');
  });

  it('handles "projects" command', () => {
    const { container, input, form } = setup();
    fireEvent.change(input, { target: { value: 'projects' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('Alpha');
    expect(container.textContent).toContain('Beta');
  });

  it('handles "tasks" command', () => {
    const { container, input, form } = setup();
    fireEvent.change(input, { target: { value: 'tasks 1' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('Task 1');
  });

  it('handles "addproject" command', () => {
    const { input, form, combinedProps } = setup();
    fireEvent.change(input, { target: { value: 'addproject "New Project"' } });
    fireEvent.submit(form);
    expect(combinedProps.onAddProject).toHaveBeenCalledWith('New Project', expect.any(String));
  });

  it('handles "addtask" command', () => {
    const { input, form, combinedProps } = setup();
    fireEvent.change(input, { target: { value: 'addtask 1 "New Task 2"' } });
    fireEvent.submit(form);
    expect(combinedProps.onAddTask).toHaveBeenCalledWith('1', 'New Task 2', null);
  });

  it('handles "start" command', () => {
    const { input, form, combinedProps } = setup();
    fireEvent.change(input, { target: { value: 'start 1' } });
    fireEvent.submit(form);
    expect(combinedProps.onStartTimer).toHaveBeenCalledWith('1');
  });

  it('handles "stop" command', () => {
    const activeLog: TimeLog = { id: 'log_2', taskId: '1', projectId: '1', startTime: '2026-06-12T02:30:00Z', endTime: null };
    const { input, form, combinedProps } = setup({ activeLog });
    fireEvent.change(input, { target: { value: 'stop' } });
    fireEvent.submit(form);
    expect(combinedProps.onStopTimer).toHaveBeenCalled();
  });

  it('handles "complete" command', () => {
    const { input, form, combinedProps } = setup();
    fireEvent.change(input, { target: { value: 'complete 1' } });
    fireEvent.submit(form);
    expect(combinedProps.onToggleTaskComplete).toHaveBeenCalledWith('1');
  });

  it('handles "clear" command to reset history', () => {
    const { container, input, form } = setup();
    fireEvent.change(input, { target: { value: 'clear' } });
    fireEvent.submit(form);
    // After clear, the history length should be empty (or minimal)
    expect(container.textContent).not.toContain('OxyFlow CLI Engine [Version');
  });

  it('handles "logs" command', () => {
    const { container, input, form } = setup();
    fireEvent.change(input, { target: { value: 'logs' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('og_1');
  });

  it('handles "help" command', () => {
    const { container, input, form } = setup();
    fireEvent.change(input, { target: { value: 'help' } });
    fireEvent.submit(form);
    expect(container.textContent).toContain('addproject');
    expect(container.textContent).toContain('addtask');
  });
});
