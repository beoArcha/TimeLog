import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Project } from '@bindings/Project';

export interface UseProjectSelectionProps {
  projects: Project[];
  initialSelectedProjectId?: string | null;
  onSelectProjectId?: (id: string) => void;
}

export function useProjectSelection({
  projects,
  initialSelectedProjectId,
  onSelectProjectId,
}: UseProjectSelectionProps) {
  const effectiveInitialId =
    initialSelectedProjectId && initialSelectedProjectId.trim() !== ''
      ? initialSelectedProjectId
      : null;

  const [userSelectedProjectId, setUserSelectedProjectId] = useState<string | null>(null);

  const selectedProjectId = useMemo(() => {
    if (projects.length === 0) return null;

    if (userSelectedProjectId) {
      const activeUserProject = projects.find(
        (p) => p.id === userSelectedProjectId && !p.archived
      );
      if (activeUserProject) return activeUserProject.id;
    }

    if (effectiveInitialId) {
      const activeInitialProject = projects.find(
        (p) => p.id === effectiveInitialId && !p.archived
      );
      if (activeInitialProject) return activeInitialProject.id;
    }

    const fallback = projects.find((p) => !p.archived) ?? projects[0];
    return fallback ? fallback.id : null;
  }, [projects, userSelectedProjectId, effectiveInitialId]);

  const lastNotifiedRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== lastNotifiedRef.current) {
      lastNotifiedRef.current = selectedProjectId;
      onSelectProjectId?.(selectedProjectId);
    }
  }, [selectedProjectId, onSelectProjectId]);

  const setSelectedProjectId = useCallback((id: string | null) => {
    setUserSelectedProjectId(id);
  }, []);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  return {
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
  };
}
