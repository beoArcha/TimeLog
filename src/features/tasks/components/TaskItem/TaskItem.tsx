import React from 'react';
import { Task } from '@bindings/Task';
import { AnimatePresence } from 'motion/react';
import { useTaskItem } from './hooks/useTaskItem';
import { TaskHeader } from './TaskHeader';
import { TaskMetrics } from './TaskMetrics';
import { SubtaskForm } from './SubtaskForm';
import { SubtaskList } from './SubtaskList';

interface TaskItemProps {
  key?: React.Key;
  rootTask: Task;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any;
  isCondensed: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  th: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sc: any;
}

export default function TaskItem({ rootTask, state, isCondensed, th, sc }: TaskItemProps) {
  const {
    tasks,
    logs,
    nowIso,
    locale,
    customTranslations,
    theme,
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
    useTaskItem({ rootTask, tasks, logs, nowIso, projectTasks });

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
      className={`${sc.roundedMain} ${sc.paddingSection} border transition-all flex flex-col ${sc.gapMain} group/root relative overflow-hidden backdrop-blur-md ${
        isAnyRunning
          ? theme === 'light'
            ? 'bg-gradient-to-r from-orange-400/5 to-rose-500/5 border-orange-500/40 shadow-md text-[#2C2421]'
            : 'bg-gradient-to-r from-orange-500/10 to-rose-500/10 border-orange-500/40 shadow-xl text-white'
          : theme === 'light'
            ? 'bg-[#F4EFEA] border-[#DFD7CB]/80 hover:border-orange-500/25 hover:bg-[#EAE4DB] text-[#2C2421]'
            : 'bg-[#FCFAF8]/5 border-white/10 hover:border-orange-500/25 hover:bg-[#FCFAF8]/10 text-white'
      }`}
    >
      {isAnyRunning && (
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-rose-500" />
      )}

      <div
        className={`flex ${isCondensed ? `flex-col ${sc.gapMain}` : `items-center justify-between ${sc.gapMain}`} animate-fade-in pl-1`}
      >
        <TaskHeader
          rootTask={rootTask}
          isCurrentRunning={isCurrentRunning}
          isChildRunning={isChildRunning}
          runningSubtask={runningSubtask}
          editingId={editingId}
          editName={editName}
          theme={theme}
          locale={locale}
          customTranslations={customTranslations}
          th={th}
          sc={sc}
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
          theme={theme}
          locale={locale}
          customTranslations={customTranslations}
          sc={sc}
          onStartTimer={onStartTimer}
          setShowSubtaskFormForId={setShowSubtaskFormForId}
        />
      </div>

      <AnimatePresence>
        {showSubtaskFormForId === rootTask.id && (
          <SubtaskForm
            parentTaskId={rootTask.id}
            newSubtaskName={newSubtaskName}
            theme={theme}
            locale={locale}
            customTranslations={customTranslations}
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
        isCondensed={isCondensed}
        editingId={editingId}
        editName={editName}
        theme={theme}
        locale={locale}
        customTranslations={customTranslations}
        th={th}
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
