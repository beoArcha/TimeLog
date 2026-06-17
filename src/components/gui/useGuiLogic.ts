import { useState, useMemo } from 'react';
import { GuiCommonProps } from './GuiCommonProps';

export function useGuiLogic(props: GuiCommonProps) {
  const { projects, tasks, logs } = props;

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);
  
  // Holidays form state
  const [newHolidayDate, setNewHolidayDate] = useState('2026-06-15');
  const [newHolidayType, setNewHolidayType] = useState<'holiday' | 'leave'>('leave');
  const [newHolidayName, setNewHolidayName] = useState('');

  // Report filters state
  const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [reportSort, setReportSort] = useState<'date' | 'duration'>('duration');
  
  // Forms state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('violet');
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedParentTaskId, setSelectedParentTaskId] = useState<string>(''); // For subtasks
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [showSubtaskFormForId, setShowSubtaskFormForId] = useState<string | null>(null);

  // Edit rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Inspector state
  const [showDbInspector, setShowDbInspector] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  
  const projectTasks = useMemo(() => {
    if (!selectedProject) return [];
    return tasks.filter(t => t.projectId === selectedProject.id);
  }, [tasks, selectedProject]);

  const rootTasks = useMemo(() => {
    return projectTasks.filter(t => t.parentTaskId === null);
  }, [projectTasks]);

  return {
    ...props,
    // State
    selectedProjectId, setSelectedProjectId,
    newHolidayDate, setNewHolidayDate,
    newHolidayType, setNewHolidayType,
    newHolidayName, setNewHolidayName,
    reportPeriod, setReportPeriod,
    reportSort, setReportSort,
    newProjectName, setNewProjectName,
    newProjectColor, setNewProjectColor,
    newTaskName, setNewTaskName,
    selectedParentTaskId, setSelectedParentTaskId,
    newSubtaskName, setNewSubtaskName,
    showSubtaskFormForId, setShowSubtaskFormForId,
    editingId, setEditingId,
    editName, setEditName,
    showDbInspector, setShowDbInspector,

    // Derived
    selectedProject,
    projectTasks,
    rootTasks,
  };
}

export type GuiState = ReturnType<typeof useGuiLogic>;

