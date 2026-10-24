import { useState } from 'react';
import { LayoutCommonProps } from '../types/LayoutCommonProps';
import { ReportPeriodType } from '@features/reports/types';
import { useProjectLifecycle } from '@features/tasks/hooks/useProjectLifecycle';
import { useTaskLifecycle } from '@features/tasks/hooks/useTaskLifecycle';
import { useNavigationController } from './useNavigationController';

export interface GuiReportFilterState {
  reportPeriod: ReportPeriodType;
  setReportPeriod: (period: ReportPeriodType) => void;
  reportSort: 'date' | 'duration';
  setReportSort: (sort: 'date' | 'duration') => void;
  customFrom: string;
  setCustomFrom: (val: string) => void;
  customTo: string;
  setCustomTo: (val: string) => void;
}

/**
 * Composition facade coordinating specialized domain hooks:
 * - useProjectLifecycle: project selection, creation draft, edit modal
 * - useTaskLifecycle: task filtering, creation draft, subtasks, inline edit
 * - useNavigationController: active view and database inspector toggle
 */
export function useGuiLogic(props: LayoutCommonProps) {
  const projectLifecycle = useProjectLifecycle({
    projects: props.projects,
    initialSelectedProjectId: props.currentProjectId,
    onSelectProjectId: props.setCurrentProjectId,
    onAddProject: props.onAddProject,
    onUpdateProject: props.onUpdateProject,
    onRenameProject: props.onRenameProject,
    onToggleProjectArchive: props.onToggleProjectArchive,
  });

  const taskLifecycle = useTaskLifecycle({
    tasks: props.tasks,
    selectedProjectId: projectLifecycle.selectedProjectId,
    onAddTask: props.onAddTask,
    onUpdateTask: props.onUpdateTask,
    onRenameTask: props.onRenameTask,
    onToggleTaskComplete: props.onToggleTaskComplete,
    onDeleteTask: props.onDeleteTask,
    onStartTimer: props.onStartTimer,
    onStopTimer: props.onStopTimer,
  });

  const navigation = useNavigationController({
    activeLargeTab: props.activeLargeTab,
    initialTab: props.activeLargeTab,
  });

  // Report filter state
  const [reportPeriod, setReportPeriod] = useState<ReportPeriodType>('all');
  const [reportSort, setReportSort] = useState<'date' | 'duration'>('duration');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  return {
    ...props,

    // Project lifecycle & selection
    selectedProjectId: projectLifecycle.selectedProjectId,
    setSelectedProjectId: projectLifecycle.setSelectedProjectId,
    selectedProject: projectLifecycle.selectedProject,
    newProjectName: projectLifecycle.newProjectName,
    setNewProjectName: projectLifecycle.setNewProjectName,
    newProjectColor: projectLifecycle.newProjectColor,
    setNewProjectColor: projectLifecycle.setNewProjectColor,
    newProjectDesc: projectLifecycle.newProjectDesc,
    setNewProjectDesc: projectLifecycle.setNewProjectDesc,
    newProjectIcon: projectLifecycle.newProjectIcon,
    setNewProjectIcon: projectLifecycle.setNewProjectIcon,
    newProjectTags: projectLifecycle.newProjectTags,
    setNewProjectTags: projectLifecycle.setNewProjectTags,
    resetNewProjectDraft: projectLifecycle.resetNewProjectDraft,
    handleCreateProject: projectLifecycle.handleCreateProject,
    editingProject: projectLifecycle.editingProject,
    setEditingProject: projectLifecycle.setEditingProject,
    openEditProject: projectLifecycle.openEditProject,
    closeEditProject: projectLifecycle.closeEditProject,
    handleSaveEditedProject: projectLifecycle.handleSaveEditedProject,

    // Task lifecycle & filtering
    projectTasks: taskLifecycle.projectTasks,
    rootTasks: taskLifecycle.rootTasks,
    newTaskName: taskLifecycle.newTaskName,
    setNewTaskName: taskLifecycle.setNewTaskName,
    handleCreateTask: taskLifecycle.handleCreateTask,
    showSubtaskFormForId: taskLifecycle.showSubtaskFormForId,
    setShowSubtaskFormForId: taskLifecycle.setShowSubtaskFormForId,
    newSubtaskName: taskLifecycle.newSubtaskName,
    setNewSubtaskName: taskLifecycle.setNewSubtaskName,
    openSubtaskForm: taskLifecycle.openSubtaskForm,
    closeSubtaskForm: taskLifecycle.closeSubtaskForm,
    handleCreateSubtask: taskLifecycle.handleCreateSubtask,
    editingId: taskLifecycle.editingId,
    setEditingId: taskLifecycle.setEditingId,
    editName: taskLifecycle.editName,
    setEditName: taskLifecycle.setEditName,
    startEditingTask: taskLifecycle.startEditingTask,
    cancelEditingTask: taskLifecycle.cancelEditingTask,
    commitRenameTask: taskLifecycle.commitRenameTask,

    // Navigation & DB inspector
    showDbInspector: navigation.showDbInspector,
    setShowDbInspector: navigation.setShowDbInspector,

    // Report filters
    reportPeriod,
    setReportPeriod,
    reportSort,
    setReportSort,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
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

export type GuiLogicState = GuiState;
export type GuiLogicActions = {
  setSelectedProjectId: (id: string | null) => void;
  setReportPeriod: (period: ReportPeriodType) => void;
  setReportSort: (sort: 'date' | 'duration') => void;
  setShowDbInspector: (show: boolean) => void;
};
