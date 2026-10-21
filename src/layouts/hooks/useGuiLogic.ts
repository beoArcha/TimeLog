import { useState, useMemo } from 'react';
import { LayoutCommonProps } from '../types/LayoutCommonProps';
import { ReportPeriodType } from '@features/reports/types';

export function useGuiLogic(props: LayoutCommonProps) {
  const { projects, tasks } = props;

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);

  const [reportPeriod, setReportPeriod] = useState<ReportPeriodType>('all');
  const [reportSort, setReportSort] = useState<'date' | 'duration'>('duration');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

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
    selectedProjectId,
    setSelectedProjectId,
    reportPeriod,
    setReportPeriod,
    reportSort,
    setReportSort,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    showDbInspector,
    setShowDbInspector,

    selectedProject,
    projectTasks,
    rootTasks,
  };
}

export type GuiBaseState = ReturnType<typeof useGuiLogic>;

export interface GuiStateExtensions {
  newProjectName?: string;
  setNewProjectName?: (val: string) => void;
  newProjectColor?: string;
  setNewProjectColor?: (val: string) => void;
  newTaskName?: string;
  setNewTaskName?: (val: string) => void;
  editingId?: string | null;
  setEditingId?: (id: string | null) => void;
  editName?: string;
  setEditName?: (name: string) => void;
  showSubtaskFormForId?: string | null;
  setShowSubtaskFormForId?: (id: string | null) => void;
  newSubtaskName?: string;
  setNewSubtaskName?: (name: string) => void;
}

export type GuiState = GuiBaseState & GuiStateExtensions;
