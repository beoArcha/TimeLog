import { useState, useMemo, useCallback } from 'react';
import { Project } from '@bindings/Project';
import type { EditProjectSavePayload } from '@layouts/parts/EditProjectDialog';

export interface UseProjectLifecycleProps {
  projects: Project[];
  initialSelectedProjectId?: string | null;
  onAddProject?: (
    name: string,
    color: string,
    description?: string | null,
    icon?: string | null,
    tags?: string[] | null
  ) => void;
  onUpdateProject?: (
    id: string,
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null
  ) => void;
  onRenameProject?: (id: string, newName: string) => void;
  onToggleProjectArchive?: (id: string) => void;
}

/**
 * Manages project selection, new project drafts, dialog state, and inline renaming.
 */
export function useProjectLifecycle({
  projects,
  initialSelectedProjectId,
  onAddProject,
  onUpdateProject,
  onRenameProject,
  onToggleProjectArchive,
}: UseProjectLifecycleProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    () => initialSelectedProjectId ?? projects[0]?.id ?? null
  );

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  // Draft state for new project creation
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('violet');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectIcon, setNewProjectIcon] = useState('');
  const [newProjectTags, setNewProjectTags] = useState('');

  const resetNewProjectDraft = useCallback(() => {
    setNewProjectName('');
    setNewProjectColor('violet');
    setNewProjectDesc('');
    setNewProjectIcon('');
    setNewProjectTags('');
  }, []);

  const handleCreateProject = useCallback(() => {
    const trimmed = newProjectName.trim();
    if (!trimmed || !onAddProject) return;

    const tagsArr = newProjectTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onAddProject(
      trimmed,
      newProjectColor,
      newProjectDesc.trim() || null,
      newProjectIcon.trim() || null,
      tagsArr.length > 0 ? tagsArr : null
    );

    resetNewProjectDraft();
  }, [
    newProjectName,
    newProjectColor,
    newProjectDesc,
    newProjectIcon,
    newProjectTags,
    onAddProject,
    resetNewProjectDraft,
  ]);

  // Edit dialog state
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const openEditProject = useCallback((project: Project) => {
    setEditingProject(project);
  }, []);

  const closeEditProject = useCallback(() => {
    setEditingProject(null);
  }, []);

  const handleSaveEditedProject = useCallback(
    (payload: EditProjectSavePayload) => {
      onUpdateProject?.(
        payload.id,
        payload.name,
        payload.color,
        payload.description,
        payload.icon,
        payload.tags
      );
      setEditingProject(null);
    },
    [onUpdateProject]
  );

  // Inline name editing state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');

  const startEditingProject = useCallback((id: string, currentName: string) => {
    setEditingProjectId(id);
    setEditProjectName(currentName);
  }, []);

  const cancelEditingProject = useCallback(() => {
    setEditingProjectId(null);
    setEditProjectName('');
  }, []);

  const commitRenameProject = useCallback(
    (id: string) => {
      const trimmed = editProjectName.trim();
      if (trimmed && onRenameProject) {
        onRenameProject(id, trimmed);
      }
      cancelEditingProject();
    },
    [editProjectName, onRenameProject, cancelEditingProject]
  );

  const handleToggleArchive = useCallback(
    (id: string) => {
      onToggleProjectArchive?.(id);
    },
    [onToggleProjectArchive]
  );

  return {
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,

    // Creation draft
    newProjectName,
    setNewProjectName,
    newProjectColor,
    setNewProjectColor,
    newProjectDesc,
    setNewProjectDesc,
    newProjectIcon,
    setNewProjectIcon,
    newProjectTags,
    setNewProjectTags,
    resetNewProjectDraft,
    handleCreateProject,

    // Dialog state
    editingProject,
    setEditingProject,
    openEditProject,
    closeEditProject,
    handleSaveEditedProject,

    // Inline edit
    editingProjectId,
    setEditingProjectId,
    editProjectName,
    setEditProjectName,
    startEditingProject,
    cancelEditingProject,
    commitRenameProject,

    handleToggleArchive,
  };
}
