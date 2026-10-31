import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectEditDialog } from '@features/tasks/hooks/project-lifecycle/useProjectEditDialog';
import { aProject } from '@tests/shared/builders/entity-builders';

describe('useProjectEditDialog', () => {
  const p1 = aProject({ id: 'p1', name: 'Alpha' });

  it('should open and close edit dialog', () => {
    // Arrange
    const { result } = renderHook(() => useProjectEditDialog({}));

    // Act
    act(() => {
      result.current.openEditProject(p1);
    });

    // Assert
    expect(result.current.editingProject).toEqual(p1);

    // Act
    act(() => {
      result.current.closeEditProject();
    });

    // Assert
    expect(result.current.editingProject).toBeNull();
  });

  it('should delegate update and close dialog when handleSaveEditedProject is called', () => {
    // Arrange
    const onUpdateProject = vi.fn();
    const { result } = renderHook(() => useProjectEditDialog({ onUpdateProject }));

    // Act
    act(() => {
      result.current.openEditProject(p1);
      result.current.handleSaveEditedProject({
        id: 'p1',
        name: 'Alpha Updated',
        color: 'emerald',
        description: 'New Desc',
        icon: '🎯',
        tags: ['v2'],
      });
    });

    // Assert
    expect(onUpdateProject).toHaveBeenCalledWith(
      'p1',
      'Alpha Updated',
      'emerald',
      'New Desc',
      '🎯',
      ['v2'],
      undefined,
      undefined,
      undefined
    );
    expect(result.current.editingProject).toBeNull();
  });
});
