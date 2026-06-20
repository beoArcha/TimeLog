import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTimeLogData } from '../../../src/hooks/useTimeLogData';
import { setupLocalStorageMock } from '../../shared/test-helpers';
import { STORAGE_KEYS } from '../../../src/common/constants';

describe('Integration Tests: useTimeLogData Storage Lifecycle', () => {
  const pushToApi = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setupLocalStorageMock();
  });

  it('Given empty storage, When application starts, Then default state is created', () => {
    localStorage.removeItem(STORAGE_KEYS.STATE_DB);

    const { result } = renderHook(() => useTimeLogData(pushToApi));

    expect(result.current.projects).toHaveLength(3);
    expect(result.current.tasks).toHaveLength(7);
    expect(result.current.logs).toHaveLength(3);
    expect(result.current.isInitialized).toBe(true);

    const saved = localStorage.getItem(STORAGE_KEYS.STATE_DB);
    expect(saved).toBeDefined();
    expect(JSON.parse(saved!).projects).toHaveLength(3);
  });

  it('Given existing projects, When application starts, Then state is restored', () => {
    const existingState = {
      projects: [{ id: 'p_custom', name: 'My Custom Project', color: 'teal', createdAt: '2026-06-20', archived: false }],
      tasks: [{ id: 't_custom', projectId: 'p_custom', parentTaskId: null, name: 'My Custom Task', createdAt: '2026-06-20', completed: false }],
      logs: [],
      activeLog: null,
      holidays: [],
      patches: []
    };
    localStorage.setItem(STORAGE_KEYS.STATE_DB, JSON.stringify(existingState));

    const { result } = renderHook(() => useTimeLogData(pushToApi));

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0].name).toBe('My Custom Project');
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.isInitialized).toBe(true);
  });

  it('Given corrupted storage, When application starts, Then fallback state is created', () => {
    localStorage.setItem(STORAGE_KEYS.STATE_DB, '{corrupted-json-data...');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useTimeLogData(pushToApi));

    expect(result.current.projects).toHaveLength(3);
    expect(result.current.isInitialized).toBe(true);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('Given active timer, When application reloads, Then timer is restored', () => {
    const activeTimeLog = { id: 'log_active', taskId: '102', projectId: '1', startTime: '2026-06-20T12:00:00Z', endTime: null };
    const existingState = {
      projects: [{ id: '1', name: 'Proj 1', color: 'violet', createdAt: '2026-06-20' }],
      tasks: [{ id: '102', projectId: '1', parentTaskId: null, name: 'Task 2', createdAt: '2026-06-20', completed: false }],
      logs: [activeTimeLog],
      activeLog: activeTimeLog,
      holidays: [],
      patches: []
    };
    localStorage.setItem(STORAGE_KEYS.STATE_DB, JSON.stringify(existingState));

    const { result } = renderHook(() => useTimeLogData(pushToApi));

    expect(result.current.activeLog).not.toBeNull();
    expect(result.current.activeLog?.id).toBe('log_active');
    expect(result.current.activeLog?.endTime).toBeNull();
  });
});
