import { useState, useMemo } from 'react';
import { GuiCommonProps } from '../types/GuiCommonProps';

export function useGuiLogic(props: GuiCommonProps) {
  const { projects, tasks } = props;

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);

  const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [reportSort, setReportSort] = useState<'date' | 'duration'>('duration');

  const [showDbInspector, setShowDbInspector] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const projectTasks = useMemo(() => {
    if (!selectedProject) return [];
    return tasks.filter(t => t.projectId === selectedProject.id);
  }, [tasks, selectedProject]);

  const rootTasks = useMemo(() => {
    return projectTasks.filter(t => !t.parentTaskId);
  }, [projectTasks]);

  return {
    ...props,
    selectedProjectId, setSelectedProjectId,
    reportPeriod, setReportPeriod,
    reportSort, setReportSort,
    showDbInspector, setShowDbInspector,

    selectedProject,
    projectTasks,
    rootTasks,
  };
}

export type GuiState = ReturnType<typeof useGuiLogic> & Record<string, any>;
