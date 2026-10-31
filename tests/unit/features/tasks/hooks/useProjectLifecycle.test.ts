import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectLifecycle } from '@features/tasks/hooks/useProjectLifecycle';
import { aProject } from '@tests/shared/builders/entity-builders';

describe('useProjectLifecycle', () => {
  const p1 = aProject({ id: 'p1', name: 'Alpha' });
  const p2 = aProject({ id: 'p2', name: 'Beta' });

  it('should initialize selected project with first project in list', () => {
    // Arrange
    const initialProjects = [p1, p2];

    // Act
    const { result } = renderHook(() =>
      useProjectLifecycle({
        projects: initialProjects,
      })
    );

    // Assert
    expect(result.current.selectedProjectId).toBe('p1');
    expect(result.current.selectedProject?.name).toBe('Alpha');
  });

  it('should update selected project and notify when setSelectedProjectId is called', () => {
    // Arrange
    const onSelectProjectId = vi.fn();
    const { result } = renderHook(() =>
      useProjectLifecycle({
        projects: [p1, p2],
        onSelectProjectId,
      })
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

  it('should automatically select first active project when projects load asynchronously', () => {
    // Arrange
    const onSelectProjectId = vi.fn();
    const { result, rerender } = renderHook(
      ({ projects }) =>
        useProjectLifecycle({
          projects,
          onSelectProjectId,
        }),
      { initialProps: { projects: [] as typeof p1[] } }
    );

    expect(result.current.selectedProjectId).toBeNull();

    // Act
    rerender({ projects: [p1, p2] });

    // Assert
    expect(result.current.selectedProjectId).toBe('p1');
    expect(onSelectProjectId).toHaveBeenCalledWith('p1');
  });

  it('should retain saved initial project when present and not archived', () => {
    // Arrange
    const onSelectProjectId = vi.fn();
    const { result, rerender } = renderHook(
      ({ projects }) =>
        useProjectLifecycle({
          projects,
          initialSelectedProjectId: 'p2',
          onSelectProjectId,
        }),
      { initialProps: { projects: [] as typeof p1[] } }
    );

    // Act
    rerender({ projects: [p1, p2] });

    // Assert
    expect(result.current.selectedProjectId).toBe('p2');
  });

  it('should fallback to first active project when initial project is archived', () => {
    // Arrange
    const archivedP1 = aProject({ id: 'p1', name: 'Alpha', archived: true });
    const onSelectProjectId = vi.fn();
    const { result } = renderHook(() =>
      useProjectLifecycle({
        projects: [archivedP1, p2],
        initialSelectedProjectId: 'p1',
        onSelectProjectId,
      })
    );

    // Act
    const selected = result.current.selectedProjectId;

    // Assert
    expect(selected).toBe('p2');
    expect(onSelectProjectId).toHaveBeenCalledWith('p2');
  });

  it('should create new project with tags and reset draft state when valid', () => {
    // Arrange
    const onAddProject = vi.fn();
    const { result } = renderHook(() =>
      useProjectLifecycle({
        projects: [p1],
        onAddProject,
      })
    );

    // Act
    act(() => {
      result.current.setNewProjectName('Gamma');
      result.current.setNewProjectColor('emerald');
      result.current.setNewProjectTags('dev, ui');
    });
    act(() => {
      result.current.handleCreateProject();
    });

    // Assert
    expect(onAddProject).toHaveBeenCalledWith(
      'Gamma',
      'emerald',
      null,
      null,
      ['dev', 'ui']
    );
    expect(result.current.newProjectName).toBe('');
  });

  it('should ignore creation when project name is empty or only whitespace', () => {
    // Arrange
    const onAddProject = vi.fn();
    const { result } = renderHook(() =>
      useProjectLifecycle({
        projects: [p1],
        onAddProject,
      })
    );

    // Act
    act(() => {
      result.current.setNewProjectName('   ');
      result.current.handleCreateProject();
    });

    // Assert
    expect(onAddProject).not.toHaveBeenCalled();
  });

  it('should manage edit dialog state and delegate save to onUpdateProject', () => {
    // Arrange
    const onUpdateProject = vi.fn();
    const { result } = renderHook(() =>
      useProjectLifecycle({
        projects: [p1],
        onUpdateProject,
      })
    );

    // Act - open dialog
    act(() => {
      result.current.openEditProject(p1);
    });

    // Assert dialog opened
    expect(result.current.editingProject?.id).toBe('p1');

    // Act - save payload
    act(() => {
      result.current.handleSaveEditedProject({
        id: 'p1',
        name: 'Alpha Updated',
        color: 'rose',
        description: 'New desc',
        icon: '🚀',
        tags: ['v2'],
      });
    });

    // Assert dialog closed and handler called
    expect(result.current.editingProject).toBeNull();
    expect(onUpdateProject).toHaveBeenCalledWith(
      'p1',
      'Alpha Updated',
      'rose',
      'New desc',
      '🚀',
      ['v2'],
      undefined,
      undefined,
      undefined
    );
  });

  it('should manage inline editing and commit rename when confirmed', () => {
    // Arrange
    const onRenameProject = vi.fn();
    const { result } = renderHook(() =>
      useProjectLifecycle({
        projects: [p1],
        onRenameProject,
      })
    );

    // Act - start inline edit
    act(() => {
      result.current.startEditingProject('p1', 'Alpha');
    });
    expect(result.current.editingProjectId).toBe('p1');
    expect(result.current.editProjectName).toBe('Alpha');

    // Act - update name and commit
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

  it('should delegate archive toggle to onToggleProjectArchive', () => {
    // Arrange
    const onToggleProjectArchive = vi.fn();
    const { result } = renderHook(() =>
      useProjectLifecycle({
        projects: [p1],
        onToggleProjectArchive,
      })
    );

    // Act
    act(() => {
      result.current.handleToggleArchive('p1');
    });

    // Assert
    expect(onToggleProjectArchive).toHaveBeenCalledWith('p1');
  });
});
