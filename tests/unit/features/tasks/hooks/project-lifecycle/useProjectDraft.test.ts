import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectDraft } from '@features/tasks/hooks/project-lifecycle/useProjectDraft';

describe('useProjectDraft', () => {
  it('should reset draft when resetNewProjectDraft is called', () => {
    // Arrange
    const { result } = renderHook(() => useProjectDraft({}));

    // Act
    act(() => {
      result.current.setNewProjectName('Draft');
      result.current.setNewProjectColor('indigo');
      result.current.resetNewProjectDraft();
    });

    // Assert
    expect(result.current.newProjectName).toBe('');
    expect(result.current.newProjectColor).toBe('violet');
  });

  it('should delegate creation and reset draft when handleCreateProject is invoked with valid name', () => {
    // Arrange
    const onAddProject = vi.fn();
    const { result } = renderHook(() => useProjectDraft({ onAddProject }));

    // Act
    act(() => {
      result.current.setNewProjectName('Project One');
      result.current.setNewProjectTags('tag1, tag2');
    });
    act(() => {
      result.current.handleCreateProject();
    });

    // Assert
    expect(onAddProject).toHaveBeenCalledWith(
      'Project One',
      'violet',
      null,
      null,
      ['tag1', 'tag2']
    );
    expect(result.current.newProjectName).toBe('');
  });
});
