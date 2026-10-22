import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjectReorder } from '@common/hooks/useProjectReorder';
import { aProject } from '@tests/shared/builders/entity-builders';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';

describe('useProjectReorder', () => {
  const p1 = aProject({ id: 'p1', name: 'Alpha' });
  const p2 = aProject({ id: 'p2', name: 'Beta' });
  const p3 = aProject({ id: 'p3', name: 'Gamma' });

  let mockGetProjectOrder: ReturnType<typeof vi.fn>;
  let mockSaveProjectOrder: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGetProjectOrder = vi.fn().mockResolvedValue([]);
    mockSaveProjectOrder = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(PersistenceRouter, 'getInstance').mockReturnValue({
      uiState: {
        getProjectOrder: mockGetProjectOrder,
        saveProjectOrder: mockSaveProjectOrder,
      },
    } as unknown as PersistenceRouter);
  });

  it('should return projects in default order when persisted order is empty', async () => {
    // Arrange
    const { result } = renderHook(() =>
      useProjectReorder({
        projects: [p1, p2, p3],
      })
    );

    // Act
    await waitFor(() => {
      expect(mockGetProjectOrder).toHaveBeenCalled();
    });

    // Assert
    expect(result.current.orderedProjects.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
    expect(result.current.isFirst('p1')).toBe(true);
    expect(result.current.isLast('p3')).toBe(true);
  });

  it('should apply persisted order when loaded from storage', async () => {
    // Arrange
    mockGetProjectOrder.mockResolvedValue(['p3', 'p1', 'p2']);

    // Act
    const { result } = renderHook(() =>
      useProjectReorder({
        projects: [p1, p2, p3],
      })
    );

    await waitFor(() => {
      expect(result.current.orderedProjects.map((p) => p.id)).toEqual(['p3', 'p1', 'p2']);
    });

    // Assert
    expect(result.current.isFirst('p3')).toBe(true);
    expect(result.current.isLast('p2')).toBe(true);
  });

  it('should append new projects at the end when not present in persisted order', async () => {
    // Arrange
    mockGetProjectOrder.mockResolvedValue(['p2']);

    // Act
    const { result } = renderHook(() =>
      useProjectReorder({
        projects: [p1, p2, p3],
      })
    );

    await waitFor(() => {
      expect(result.current.orderedProjects.map((p) => p.id)).toEqual(['p2', 'p1', 'p3']);
    });

    // Assert
    expect(result.current.orderedProjects[0].id).toBe('p2');
  });

  it('should move project up and save order when moveProject up is called', async () => {
    // Arrange
    const onOrderChange = vi.fn();
    const { result } = renderHook(() =>
      useProjectReorder({
        projects: [p1, p2, p3],
        onOrderChange,
      })
    );

    await waitFor(() => {
      expect(mockGetProjectOrder).toHaveBeenCalled();
    });

    // Act
    act(() => {
      result.current.moveProject('p2', 'up');
    });

    // Assert
    expect(result.current.orderedProjects.map((p) => p.id)).toEqual(['p2', 'p1', 'p3']);
    expect(mockSaveProjectOrder).toHaveBeenCalledWith(['p2', 'p1', 'p3']);
    expect(onOrderChange).toHaveBeenCalledWith(['p2', 'p1', 'p3']);
  });

  it('should move project down and save order when moveProject down is called', async () => {
    // Arrange
    const onOrderChange = vi.fn();
    const { result } = renderHook(() =>
      useProjectReorder({
        projects: [p1, p2, p3],
        onOrderChange,
      })
    );

    await waitFor(() => {
      expect(mockGetProjectOrder).toHaveBeenCalled();
    });

    // Act
    act(() => {
      result.current.moveProject('p1', 'down');
    });

    // Assert
    expect(result.current.orderedProjects.map((p) => p.id)).toEqual(['p2', 'p1', 'p3']);
    expect(mockSaveProjectOrder).toHaveBeenCalledWith(['p2', 'p1', 'p3']);
    expect(onOrderChange).toHaveBeenCalledWith(['p2', 'p1', 'p3']);
  });

  it('should not change order when moving first project up', async () => {
    // Arrange
    const { result } = renderHook(() =>
      useProjectReorder({
        projects: [p1, p2, p3],
      })
    );

    await waitFor(() => {
      expect(mockGetProjectOrder).toHaveBeenCalled();
    });

    // Act
    act(() => {
      result.current.moveProject('p1', 'up');
    });

    // Assert
    expect(result.current.orderedProjects.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
    expect(mockSaveProjectOrder).not.toHaveBeenCalled();
  });

  it('should not change order when moving last project down', async () => {
    // Arrange
    const { result } = renderHook(() =>
      useProjectReorder({
        projects: [p1, p2, p3],
      })
    );

    await waitFor(() => {
      expect(mockGetProjectOrder).toHaveBeenCalled();
    });

    // Act
    act(() => {
      result.current.moveProject('p3', 'down');
    });

    // Assert
    expect(result.current.orderedProjects.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
    expect(mockSaveProjectOrder).not.toHaveBeenCalled();
  });
});
