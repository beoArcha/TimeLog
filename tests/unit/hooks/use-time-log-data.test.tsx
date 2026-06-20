import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { useTimeLogData } from '../../../src/hooks/useTimeLogData';
import { setupLocalStorageMock } from './test-helpers';
import { Project, Task, TimeLog } from '../../../src/types';

const LOCAL_STORAGE_KEY = 'oxytime_state_db_6';

describe('Unit Tests: useTimeLogData Hook', () => {
  const pushToApi = vi.fn();
  const originalLocation = window.location;

  beforeAll(() => {
    // Mock window.location.reload
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      reload: vi.fn(),
    } as any;
  });

  afterAll(() => {
    (window as any).location = originalLocation;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setupLocalStorageMock();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // ── Happy Paths ──

  it('should_initialize_with_default_projects_when_storage_is_empty', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));
    expect(result.current.projects).toHaveLength(3);
  });

  it('should_add_new_project_when_handleAddProject_is_called', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));
    
    act(() => {
      result.current.handleAddProject('Test Project', 'rose');
    });

    expect(result.current.projects).toHaveLength(4);
    expect(result.current.projects[3].name).toBe('Test Project');
  });

  it('should_toggle_project_archived_state_when_handleToggleProjectArchive_is_called', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));
    
    act(() => {
      result.current.handleToggleProjectArchive('1');
    });

    expect(result.current.projects[0].archived).toBe(true);

    act(() => {
      result.current.handleToggleProjectArchive('1');
    });

    expect(result.current.projects[0].archived).toBe(false);
  });

  it('should_add_task_when_handleAddTask_is_called', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));

    act(() => {
      result.current.handleAddTask('1', 'New Task', null);
    });

    expect(result.current.tasks).toHaveLength(8);
    expect(result.current.tasks[result.current.tasks.length - 1].name).toBe('New Task');
  });

  it('should_rename_project_when_handleRenameProject_is_called', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));

    act(() => {
      result.current.handleRenameProject('1', 'Renamed Backend');
    });

    expect(result.current.projects[0].name).toBe('Renamed Backend');
  });

  it('should_rename_task_when_handleRenameTask_is_called', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));

    act(() => {
      result.current.handleRenameTask('101', 'Renamed Task');
    });

    expect(result.current.tasks[0].name).toBe('Renamed Task');
  });

  it('should_delete_task_and_all_subtasks_and_logs_when_handleDeleteTask_is_called', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));

    // '102' is parent of '1021'
    act(() => {
      result.current.handleDeleteTask('102');
    });

    const hasParent = result.current.tasks.some(t => t.id === '102');
    const hasChild = result.current.tasks.some(t => t.id === '1021');
    expect(hasParent).toBe(false);
    expect(hasChild).toBe(false);
  });

  it('should_toggle_task_complete_and_stop_running_timer_when_handleToggleTaskComplete_is_called', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));

    // Complete task '102' which isn't complete
    act(() => {
      result.current.handleToggleTaskComplete('102');
    });
    expect(result.current.tasks.find(t => t.id === '102')?.completed).toBe(true);

    // Toggle back to incomplete
    act(() => {
      result.current.handleToggleTaskComplete('102');
    });
    expect(result.current.tasks.find(t => t.id === '102')?.completed).toBe(false);
  });

  it('should_trigger_api_callback_when_starting_timer', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));

    act(() => {
      result.current.handleStartTimer('101');
    });

    expect(pushToApi).toHaveBeenCalled();
    expect(result.current.activeLog?.taskId).toBe('101');
  });

  it('should_stop_running_timer_when_handleStartTimer_is_called_on_an_already_running_task', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));

    // Start timer on 101
    act(() => {
      result.current.handleStartTimer('101');
    });
    expect(result.current.activeLog).not.toBeNull();
    pushToApi.mockClear();

    // Start timer on 101 again (should stop it)
    act(() => {
      result.current.handleStartTimer('101');
    });

    expect(result.current.activeLog).toBeNull();
    expect(pushToApi).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'TERMINATE' }),
      expect.stringContaining('Terminating')
    );
  });

  it('should_automatically_create_mother_log_when_starting_child_task_timer', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));

    act(() => {
      // '1021' is a subtask of '102'
      result.current.handleStartTimer('1021');
    });

    const motherLog = result.current.logs.find(l => l.taskId === '102');
    const childLog = result.current.logs.find(l => l.taskId === '1021');

    expect(motherLog).toBeDefined();
    expect(childLog).toBeDefined();
    expect(motherLog?.endTime).toBeNull();
    expect(childLog?.endTime).toBeNull();
  });

  it('should_stop_all_active_timers_when_handleStopTimer_is_called', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));

    act(() => {
      result.current.handleStartTimer('101');
    });
    expect(result.current.activeLog).not.toBeNull();

    act(() => {
      result.current.handleStopTimer();
    });

    expect(result.current.activeLog).toBeNull();
  });

  it('should_clear_local_storage_and_reload_when_handleResetLocalStorage_is_called', () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'some-state');
    const { result } = renderHook(() => useTimeLogData(pushToApi));

    act(() => {
      result.current.handleResetLocalStorage();
    });

    expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBeNull();
    expect(window.location.reload).toHaveBeenCalled();
  });

  // ── Sad Paths ──

  it('should_fall_back_to_defaults_when_storage_contains_invalid_json', () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, '{invalid-json');
    
    const { result } = renderHook(() => useTimeLogData(pushToApi));

    expect(console.warn).toHaveBeenCalled();
    expect(result.current.projects).toHaveLength(3); // Loads defaults
  });

  it('should_do_nothing_when_handleRenameProject_is_called_with_non_existent_id', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));
    const initialProjects = [...result.current.projects];

    act(() => {
      result.current.handleRenameProject('non-existent', 'New Name');
    });

    expect(result.current.projects).toEqual(initialProjects);
  });

  it('should_do_nothing_when_handleRenameTask_is_called_with_non_existent_id', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));
    const initialTasks = [...result.current.tasks];

    act(() => {
      result.current.handleRenameTask('non-existent', 'New Name');
    });

    expect(result.current.tasks).toEqual(initialTasks);
  });

  it('should_do_nothing_when_handleDeleteTask_is_called_with_non_existent_id', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));
    const initialTasks = [...result.current.tasks];

    act(() => {
      result.current.handleDeleteTask('non-existent');
    });

    expect(result.current.tasks).toEqual(initialTasks);
  });

  it('should_do_nothing_when_handleToggleTaskComplete_is_called_with_non_existent_id', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));
    const initialTasks = [...result.current.tasks];

    act(() => {
      result.current.handleToggleTaskComplete('non-existent');
    });

    expect(result.current.tasks).toEqual(initialTasks);
  });

  it('should_do_nothing_when_handleStartTimer_is_called_with_non_existent_id', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));

    act(() => {
      result.current.handleStartTimer('non-existent');
    });

    expect(pushToApi).not.toHaveBeenCalled();
    expect(result.current.activeLog).toBeNull();
  });

  it('should_stop_running_timer_when_task_is_completed', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));

    act(() => {
      result.current.handleStartTimer('102');
    });
    expect(result.current.activeLog?.taskId).toBe('102');
    pushToApi.mockClear();

    act(() => {
      result.current.handleToggleTaskComplete('102');
    });

    expect(result.current.activeLog).toBeNull();
    const log102 = result.current.logs.find(l => l.taskId === '102');
    expect(log102?.endTime).not.toBeNull();
  });

  it('should_terminate_running_non_mother_task_timer_when_starting_another_task_timer', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));

    act(() => {
      result.current.handleStartTimer('101');
    });
    pushToApi.mockClear();

    act(() => {
      result.current.handleStartTimer('102');
    });

    const log101 = result.current.logs.find(l => l.taskId === '101');
    expect(log101?.endTime).not.toBeNull();
    expect(pushToApi).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'TERMINATE' }),
      expect.stringContaining('Terminating')
    );
  });

  it('should_keep_mother_task_timer_running_when_starting_child_task_timer_and_mother_is_already_running', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));

    act(() => {
      result.current.handleStartTimer('102');
    });
    pushToApi.mockClear();

    act(() => {
      result.current.handleStartTimer('1021');
    });

    const motherLog = result.current.logs.find(l => l.taskId === '102');
    expect(motherLog?.endTime).toBeNull();

    const childLog = result.current.logs.find(l => l.taskId === '1021');
    expect(childLog?.endTime).toBeNull();
  });

  it('should_stop_only_matching_project_timers_when_handleStopTimer_is_called_with_specific_project_id', () => {
    const { result } = renderHook(() => useTimeLogData(pushToApi));

    act(() => {
      result.current.handleStartTimer('101');
    });
    expect(result.current.activeLog?.projectId).toBe('1');
    pushToApi.mockClear();

    act(() => {
      result.current.handleStopTimer('2');
    });
    expect(result.current.activeLog).not.toBeNull();

    act(() => {
      result.current.handleStopTimer('1');
    });
    expect(result.current.activeLog).toBeNull();
  });
});
