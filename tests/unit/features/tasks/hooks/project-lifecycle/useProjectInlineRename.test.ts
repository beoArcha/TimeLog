import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectInlineRename } from '@features/tasks/hooks/project-lifecycle/useProjectInlineRename';

describe('useProjectInlineRename', () => {
  it('should start and cancel inline rename', () => {
    // Arrange
    const { result } = renderHook(() => useProjectInlineRename({}));

    // Act
    act(() => {
      result.current.startEditingProject('p1', 'Alpha');
    });

    // Assert
    expect(result.current.editingProjectId).toBe('p1');
    expect(result.current.editProjectName).toBe('Alpha');

    // Act
    act(() => {
      result.current.cancelEditingProject();
    });

    // Assert
    expect(result.current.editingProjectId).toBeNull();
    expect(result.current.editProjectName).toBe('');
  });

  it('should commit rename when confirmed with trimmed name', () => {
    // Arrange
    const onRenameProject = vi.fn();
    const { result } = renderHook(() => useProjectInlineRename({ onRenameProject }));

    // Act
    act(() => {
      result.current.startEditingProject('p1', 'Alpha');
    });
    act(() => {
      result.current.setEditProjectName('Alpha Renamed');
    });
    act(() => {
      result.current.commitRenameProject('p1');
    });

    // Assert
    expect(onRenameProject).toHaveBeenCalledWith('p1', 'Alpha Renamed');
    expect(result.current.editingProjectId).toBeNull();
  });
});
