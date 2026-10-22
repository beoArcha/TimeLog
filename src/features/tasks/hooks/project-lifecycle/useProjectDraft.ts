import { useState, useCallback } from 'react';

export interface UseProjectDraftProps {
  onAddProject?: (
    name: string,
    color: string,
    description?: string | null,
    icon?: string | null,
    tags?: string[] | null
  ) => void;
}

export function useProjectDraft({ onAddProject }: UseProjectDraftProps) {
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

  return {
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
  };
}
