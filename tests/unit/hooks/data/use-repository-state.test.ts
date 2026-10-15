import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useRepositoryState } from '@common/hooks/data/useRepositoryState';

describe('Unit Tests: useRepositoryState Hook', () => {
  it('should initialize with empty default arrays and null activeLog', () => {
    const { result } = renderHook(() => useRepositoryState());
    expect(result.current.projects).toEqual([]);
    expect(result.current.tasks).toEqual([]);
    expect(result.current.logs).toEqual([]);
    expect(result.current.activeLog).toBeNull();
  });

  it('should sync state atomically when partial updates are provided', () => {
    const { result } = renderHook(() => useRepositoryState());

    act(() => {
      result.current.syncRepositoryState({
        projects: [{ id: 'p1', name: 'Project 1', color: 'blue' } as any],
        tasks: [{ id: 't1', projectId: 'p1', name: 'Task 1' } as any],
      });
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.logs).toEqual([]);
    expect(result.current.activeLog).toBeNull();

    act(() => {
      result.current.syncRepositoryState({
        activeLog: { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-01-01' } as any,
      });
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.activeLog).not.toBeNull();
  });
});
