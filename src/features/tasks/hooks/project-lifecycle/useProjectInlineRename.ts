import { useState, useCallback } from 'react';

export interface UseProjectInlineRenameProps {
  onRenameProject?: (id: string, newName: string) => void;
}

export function useProjectInlineRename({ onRenameProject }: UseProjectInlineRenameProps) {
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

  return {
    editingProjectId,
    setEditingProjectId,
    editProjectName,
    setEditProjectName,
    startEditingProject,
    cancelEditingProject,
    commitRenameProject,
  };
}
