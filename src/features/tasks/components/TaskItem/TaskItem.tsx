import React from 'react';
import { Task } from '@bindings/Task';
import { AnimatePresence } from 'motion/react';
import { useTaskItem } from './hooks/useTaskItem';
import { TaskHeader } from './TaskHeader';
import { TaskMetrics } from './TaskMetrics';
import { SubtaskForm } from './SubtaskForm';
import { SubtaskList } from './SubtaskList';
import { Project } from '@bindings/Project';
import { TimeLog } from '@bindings/TimeLog';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';

import { TaskStatus } from '@bindings/TaskStatus';

export interface TaskItemState {
  tasks: Task[];
  logs: TimeLog[];
  nowIso?: string;
  projectTasks: Task[];
  selectedProject: Project | null;
  onToggleTaskComplete: (taskId: string) => void;
  onRenameTask: (taskId: string, newName: string) => void;
  onUpdateTask?: (
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: TaskStatus | null,
    completed: boolean | null
  ) => void;
  onDeleteTask: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onAddTask: (projectId: string, name: string, parentId: string | null) => void;
  showSubtaskFormForId?: string | null;
  setShowSubtaskFormForId?: (val: string | null) => void;
  newSubtaskName?: string;
  setNewSubtaskName?: (val: string) => void;
  editingId?: string | null;
  setEditingId?: (val: string | null) => void;
  editName?: string;
  setEditName?: (val: string) => void;
  metrics?: EngineComputedMetrics | null;
}

export interface TaskItemProps {
  key?: React.Key;
  rootTask: Task;
  state: TaskItemState;
  isCondensed: boolean;
}

export default function TaskItem({ rootTask, state, isCondensed }: TaskItemProps) {
  const {
    tasks,
    logs,
    nowIso,
    projectTasks,
    selectedProject,
    onToggleTaskComplete,
    onRenameTask,
    onUpdateTask,
    onDeleteTask,
    onStartTimer,
    onAddTask,
    showSubtaskFormForId,
    setShowSubtaskFormForId,
    newSubtaskName,
    setNewSubtaskName,
    editingId,
    setEditingId,
    editName,
    setEditName,
  } = state;

  const { subTasks, rootDuration, runningSubtask, isCurrentRunning, isChildRunning, isAnyRunning } =
    useTaskItem({ rootTask, tasks, logs, nowIso, metrics: state.metrics, projectTasks });

  const handleAddSubtaskSubmit = (parentTaskId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskName.trim() || !selectedProject?.id) return;
    onAddTask(selectedProject.id, newSubtaskName.trim(), parentTaskId);
    setNewSubtaskName('');
    setShowSubtaskFormForId(null);
  };

  return (
    <div
      id={`root-task-card-${rootTask.id}`}
      className={`rounded-main padding-section border transition-all flex flex-col gap-section group/root relative overflow-hidden backdrop-blur-md ${isAnyRunning
          ? 'bg-primary/5 border-primary/40 shadow-md text-foreground'
          : 'bg-card border-border hover:border-primary/25 hover:bg-muted/50 text-foreground'
        }`}
    >
      {isAnyRunning && (
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-rose-500" />
      )}

      <div
        className={`flex ${isCondensed ? 'flex-col gap-section' : 'items-center justify-between gap-section'} animate-fade-in pl-1`}
      >
        <TaskHeader
          rootTask={rootTask}
          isCurrentRunning={isCurrentRunning}
          isChildRunning={isChildRunning}
          runningSubtask={runningSubtask}
          editingId={editingId}
          editName={editName}
          onToggleTaskComplete={onToggleTaskComplete}
          onRenameTask={onRenameTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          setEditingId={setEditingId}
          setEditName={setEditName}
        />

        <TaskMetrics
          rootTask={rootTask}
          rootDuration={rootDuration}
          isCurrentRunning={isCurrentRunning}
          isAnyRunning={isAnyRunning}
          isCondensed={isCondensed}
          showSubtaskFormForId={showSubtaskFormForId}
          onStartTimer={onStartTimer}
          setShowSubtaskFormForId={setShowSubtaskFormForId}
        />
      </div>

      <AnimatePresence>
        {showSubtaskFormForId === rootTask.id && (
          <SubtaskForm
            parentTaskId={rootTask.id}
            newSubtaskName={newSubtaskName}
            setNewSubtaskName={setNewSubtaskName}
            onSubmit={handleAddSubtaskSubmit}
          />
        )}
      </AnimatePresence>

      <SubtaskList
        subTasks={subTasks}
        tasks={tasks}
        logs={logs}
        nowIso={nowIso}
        metrics={state.metrics}
        isCondensed={isCondensed}
        editingId={editingId}
        editName={editName}
        onToggleTaskComplete={onToggleTaskComplete}
        onRenameTask={onRenameTask}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onStartTimer={onStartTimer}
        setEditingId={setEditingId}
        setEditName={setEditName}
      />
    </div>
  );
}
