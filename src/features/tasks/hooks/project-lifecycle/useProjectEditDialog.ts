import { useState, useCallback } from 'react';
import { Project } from '@bindings/Project';
import type { EditProjectSavePayload } from '@layouts/parts/EditProjectDialog';

export interface UseProjectEditDialogProps {
  onUpdateProject?: (
    id: string,
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null
  ) => void;
}

export function useProjectEditDialog({ onUpdateProject }: UseProjectEditDialogProps) {
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

  return {
    editingProject,
    setEditingProject,
    openEditProject,
    closeEditProject,
    handleSaveEditedProject,
  };
}
