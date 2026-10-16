import React from 'react';
import { Folder } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import TaskItem, { TaskItemState } from './components/TaskItem/TaskItem';
import { Task } from '@bindings/Task';
import { Project } from '@bindings/Project';
import { TimeLog } from '@bindings/TimeLog';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import ProjectHeaderCard from './components/ProjectHeaderCard';
import TaskEmptyState from './components/TaskEmptyState';
import { useProjectStatistics } from './hooks/useProjectStatistics';
import { TaskEditingProvider } from './context/TaskEditingContext';

import { TaskStatus } from '@bindings/TaskStatus';

export interface TaskListViewState {
  tasks: Task[];
  logs: TimeLog[];
  nowIso?: string;
  selectedProject: Project | null;
  rootTasks: Task[];
  onAddTask: (projectId: string, name: string, parentId: string | null) => void;
  onToggleTaskComplete?: (taskId: string) => void;
  onRenameTask?: (taskId: string, newName: string) => void;
  onUpdateTask?: (
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: TaskStatus | null,
    completed: boolean | null
  ) => void;
  onDeleteTask?: (taskId: string) => void;
  onStartTimer?: (taskId: string) => void;
  onStopTimer?: (projectId?: string) => void;
  projectTasks?: Task[];
  metrics?: EngineComputedMetrics | null;
  newTaskName?: string;
  setNewTaskName?: (val: string) => void;
  editingId?: string | null;
  setEditingId?: (val: string | null) => void;
  editName?: string;
  setEditName?: (val: string) => void;
  showSubtaskFormForId?: string | null;
  setShowSubtaskFormForId?: (val: string | null) => void;
  newSubtaskName?: string;
  setNewSubtaskName?: (val: string) => void;
}

export interface TaskListViewProps {
  state: TaskListViewState;
  isCondensed: boolean;
}

export default function TaskListView({ state, isCondensed }: TaskListViewProps) {
  const {
    tasks, logs, nowIso,
    selectedProject, rootTasks, onAddTask
  } = state;

  const { t: tProject } = useTranslation('project');

  const [newTaskName, setNewTaskNameLocal] = React.useState(() => state.newTaskName ?? '');
  const [editingId, setEditingIdLocal] = React.useState<string | null>(() => state.editingId ?? null);
  const [editName, setEditNameLocal] = React.useState(() => state.editName ?? '');
  const [showSubtaskFormForId, setShowSubtaskFormForIdLocal] = React.useState<string | null>(() => state.showSubtaskFormForId ?? null);
  const [newSubtaskName, setNewSubtaskNameLocal] = React.useState(() => state.newSubtaskName ?? '');

  const setNewTaskName = React.useCallback((val: string) => {
    setNewTaskNameLocal(val);
    state.setNewTaskName?.(val);
  }, [state]);

  const setEditingId = React.useCallback((val: string | null | ((prev: string | null) => string | null)) => {
    setEditingIdLocal(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      state.setEditingId?.(next);
      return next;
    });
  }, [state]);

  const setEditName = React.useCallback((val: string | ((prev: string) => string)) => {
    setEditNameLocal(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      state.setEditName?.(next);
      return next;
    });
  }, [state]);

  const setShowSubtaskFormForId = React.useCallback((val: string | null | ((prev: string | null) => string | null)) => {
    setShowSubtaskFormForIdLocal(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      state.setShowSubtaskFormForId?.(next);
      return next;
    });
  }, [state]);

  const setNewSubtaskName = React.useCallback((val: string | ((prev: string) => string)) => {
    setNewSubtaskNameLocal(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      state.setNewSubtaskName?.(next);
      return next;
    });
  }, [state]);

  const { stats, loading, projectDurationSeconds } = useProjectStatistics({
    selectedProject,
    tasks,
    logs,
    nowIso,
    metrics: state.metrics,
  });

  const taskItemState: TaskItemState = React.useMemo(() => ({
    tasks,
    logs,
    nowIso,
    projectTasks: state.projectTasks ?? tasks,
    selectedProject,
    onToggleTaskComplete: state.onToggleTaskComplete ?? (() => {}),
    onRenameTask: state.onRenameTask ?? (() => {}),
    onUpdateTask: state.onUpdateTask,
    onDeleteTask: state.onDeleteTask ?? (() => {}),
    onStartTimer: state.onStartTimer ?? (() => {}),
    onStopTimer: state.onStopTimer ?? (() => {}),
    onAddTask,
    showSubtaskFormForId,
    setShowSubtaskFormForId,
    newSubtaskName,
    setNewSubtaskName,
    editingId,
    setEditingId,
    editName,
    setEditName,
    metrics: state.metrics,
  }), [
    tasks,
    logs,
    nowIso,
    state.projectTasks,
    selectedProject,
    state.onToggleTaskComplete,
    state.onRenameTask,
    state.onUpdateTask,
    state.onDeleteTask,
    state.onStartTimer,
    state.onStopTimer,
    onAddTask,
    showSubtaskFormForId,
    setShowSubtaskFormForId,
    newSubtaskName,
    setNewSubtaskName,
    editingId,
    setEditingId,
    editName,
    setEditName,
    state.metrics,
  ]);

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim() || !selectedProject?.id) return;
    onAddTask(selectedProject.id, newTaskName.trim(), null);
    setNewTaskName('');
  };

  if (!selectedProject) {
    return (
      <div className="border-2 border-dashed border-border rounded-main p-16 text-center transition-all flex-1 min-h-0 bg-muted/40 text-muted-foreground">
        <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-bold text-title text-foreground">{tProject('SelectProjectPlaceholder')}</h3>
        <p className="text-main mt-1 text-muted-foreground">Zaznacz projekt w bocznym menu po lewej stronie, aby zacząć zarządzać czasem.</p>
      </div>
    );
  }

  return (
    <div id="project-tasks-sheet" className={`backdrop-blur-md rounded-main ${isCondensed ? 'p-3 sm:p-4 gap-3' : 'padding-main gap-main'} border border-border bg-card shadow-2xl flex flex-col transition-all duration-300 ${isCondensed ? 'w-full' : 'flex-1 min-h-0'}`}>

      <ProjectHeaderCard
        selectedProject={selectedProject}
        projectDurationSeconds={projectDurationSeconds}
        isCondensed={isCondensed}
        stats={stats}
        loading={loading}
        newTaskName={newTaskName}
        setNewTaskName={setNewTaskName}
        onAddTaskSubmit={handleAddTaskSubmit}
      />

      <TaskEditingProvider>
        <div id="tasks-tree-container" className={`flex flex-col gap-main ${isCondensed ? 'overflow-visible' : 'overflow-y-auto flex-1 min-h-0'} pr-1`}>
          {rootTasks.length === 0 ? (
            <TaskEmptyState />
          ) : (
            rootTasks.map((rootTask: Task) => (
              <TaskItem
                key={rootTask.id}
                rootTask={rootTask}
                state={taskItemState}
                isCondensed={isCondensed}
              />
            ))
          )}
        </div>
      </TaskEditingProvider>
    </div>
  );
}

