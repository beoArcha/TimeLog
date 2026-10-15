import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  DataContext,
  useData,
  useProjects,
  useTasks,
  useTimer,
  useHolidays,
  usePatches,
  useDataLifecycleState,
} from '@common/hooks/DataContext';

describe('Unit Tests: DataContext & Domain Slice Hooks', () => {
  const mockDataState = {
    projects: [{ id: 'p1', name: 'Project 1', color: 'blue', createdAt: '2026-01-01', archived: false }],
    setProjects: vi.fn(),
    handleAddProject: vi.fn(),
    handleToggleProjectArchive: vi.fn(),
    handleUpdateProject: vi.fn(),
    handleRenameProject: vi.fn(),
    tasks: [{ id: 't1', projectId: 'p1', parentTaskId: null, name: 'Task 1', createdAt: '2026-01-01', completed: false }],
    setTasks: vi.fn(),
    selectedTaskId: 't1',
    setSelectedTaskId: vi.fn(),
    handleAddTask: vi.fn(),
    handleUpdateTask: vi.fn(),
    handleRenameTask: vi.fn(),
    handleDeleteTask: vi.fn(),
    handleToggleTaskComplete: vi.fn(),
    logs: [{ id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-01-01T10:00:00Z', endTime: null }],
    setLogs: vi.fn(),
    activeLog: { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-01-01T10:00:00Z', endTime: null },
    setActiveLog: vi.fn(),
    handleStartTimer: vi.fn(),
    handleStopTimer: vi.fn(),
    handleEditTimeLog: vi.fn(),
    holidays: [{ id: 'h1', date: '2026-01-01', type: 'holiday' as const, name: 'New Year' }],
    setHolidays: vi.fn(),
    handleAddHoliday: vi.fn(),
    handleDeleteHoliday: vi.fn(),
    patches: [{ id: 'patch1', projectId: 'p1', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T11:00:00Z', patchNote: 'Import' }],
    setPatches: vi.fn(),
    isInitialized: true,
    setIsInitialized: vi.fn(),
    isLoading: false,
    repositoryError: null,
    engineState: 'connected' as const,
    setEngineState: vi.fn(),
    handleResetLocalStorage: vi.fn(),
    handleRestoreState: vi.fn(),
    computedMetrics: null,
    refreshComputedMetrics: vi.fn(),
  };

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <DataContext.Provider value={mockDataState as any}>{children}</DataContext.Provider>
  );

  it('should throw exception when useData is used outside of DataProvider', () => {
    expect(() => renderHook(() => useData())).toThrow('useData must be used within DataProvider');
  });

  it('should provide project domain slice via useProjects', () => {
    const { result } = renderHook(() => useProjects(), { wrapper });
    expect(result.current.projects).toEqual(mockDataState.projects);
    expect(result.current.handleAddProject).toBe(mockDataState.handleAddProject);
  });

  it('should provide task domain slice via useTasks', () => {
    const { result } = renderHook(() => useTasks(), { wrapper });
    expect(result.current.tasks).toEqual(mockDataState.tasks);
    expect(result.current.selectedTaskId).toBe('t1');
  });

  it('should provide timer domain slice via useTimer', () => {
    const { result } = renderHook(() => useTimer(), { wrapper });
    expect(result.current.logs).toEqual(mockDataState.logs);
    expect(result.current.activeLog).toEqual(mockDataState.activeLog);
    expect(result.current.handleStartTimer).toBe(mockDataState.handleStartTimer);
  });

  it('should provide holidays domain slice via useHolidays', () => {
    const { result } = renderHook(() => useHolidays(), { wrapper });
    expect(result.current.holidays).toEqual(mockDataState.holidays);
    expect(result.current.handleAddHoliday).toBe(mockDataState.handleAddHoliday);
  });

  it('should provide patches domain slice via usePatches', () => {
    const { result } = renderHook(() => usePatches(), { wrapper });
    expect(result.current.patches).toEqual(mockDataState.patches);
    expect(result.current.setPatches).toBe(mockDataState.setPatches);
  });

  it('should provide lifecycle state slice via useDataLifecycleState', () => {
    const { result } = renderHook(() => useDataLifecycleState(), { wrapper });
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.engineState).toBe('connected');
  });
});
