import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectSelection } from '@features/tasks/hooks/project-lifecycle/useProjectSelection';
import { aProject } from '@tests/shared/builders/entity-builders';

describe('useProjectSelection', () => {
  const p1 = aProject({ id: 'p1', name: 'Alpha' });
  const p2 = aProject({ id: 'p2', name: 'Beta' });

  it('should initialize with first project when available', () => {
    // Arrange
    const projects = [p1, p2];

    // Act
    const { result } = renderHook(() =>
      useProjectSelection({ projects })
    );

    // Assert
    expect(result.current.selectedProjectId).toBe('p1');
    expect(result.current.selectedProject?.name).toBe('Alpha');
  });

  it('should update selection and notify listener when setSelectedProjectId is called', () => {
    // Arrange
    const onSelectProjectId = vi.fn();
    const { result } = renderHook(() =>
      useProjectSelection({ projects: [p1, p2], onSelectProjectId })
    );

    // Act
    act(() => {
      result.current.setSelectedProjectId('p2');
    });

    // Assert
    expect(result.current.selectedProjectId).toBe('p2');
    expect(result.current.selectedProject?.name).toBe('Beta');
    expect(onSelectProjectId).toHaveBeenCalledWith('p2');
  });

  it('should fallback to active project when initial project is archived', () => {
    // Arrange
    const archivedP1 = aProject({ id: 'p1', name: 'Alpha', archived: true });
    const onSelectProjectId = vi.fn();

    // Act
    const { result } = renderHook(() =>
      useProjectSelection({
        projects: [archivedP1, p2],
        initialSelectedProjectId: 'p1',
        onSelectProjectId,
      })
    );

    // Assert
    expect(result.current.selectedProjectId).toBe('p2');
    expect(onSelectProjectId).toHaveBeenCalledWith('p2');
  });
});
