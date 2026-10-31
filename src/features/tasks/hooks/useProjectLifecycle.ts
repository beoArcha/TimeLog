import { useCallback } from 'react';
import { Project } from '@bindings/Project';
import { useProjectSelection } from './project-lifecycle/useProjectSelection';
import { useProjectDraft } from './project-lifecycle/useProjectDraft';
import { useProjectEditDialog } from './project-lifecycle/useProjectEditDialog';
import { useProjectInlineRename } from './project-lifecycle/useProjectInlineRename';

export interface UseProjectLifecycleProps {
  projects: Project[];
  initialSelectedProjectId?: string | null;
  onSelectProjectId?: (id: string) => void;
  onAddProject?: (
    name: string,
    color: string,
    description?: string | null,
    icon?: string | null,
    tags?: string[] | null,
    allowConcurrency?: boolean | null,
    hourlyRate?: string | null,
    currency?: string | null
  ) => void;
  onUpdateProject?: (
    id: string,
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null,
    allowConcurrency?: boolean | null,
    hourlyRate?: string | null,
    currency?: string | null
  ) => void;
  onRenameProject?: (id: string, newName: string) => void;
  onToggleProjectArchive?: (id: string) => void;
}

export function useProjectLifecycle(props: UseProjectLifecycleProps) {
  const selection = useProjectSelection({
    projects: props.projects,
    initialSelectedProjectId: props.initialSelectedProjectId,
    onSelectProjectId: props.onSelectProjectId,
  });

  const draft = useProjectDraft({
    onAddProject: props.onAddProject,
  });

  const dialog = useProjectEditDialog({
    onUpdateProject: props.onUpdateProject,
  });

  const inlineRename = useProjectInlineRename({
    onRenameProject: props.onRenameProject,
  });

  const { onToggleProjectArchive } = props;
  const handleToggleArchive = useCallback(
    (id: string) => {
      onToggleProjectArchive?.(id);
    },
    [onToggleProjectArchive]
  );

  return {
    ...selection,
    ...draft,
    ...dialog,
    ...inlineRename,
    handleToggleArchive,
  };
}
