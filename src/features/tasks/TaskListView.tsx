import React from 'react';
import { Folder } from 'lucide-react';
import { translate } from '@common/i18n/i18n';
import { getThemeStyles, getScaleStyles } from '@/src/layouts/parts/GuiStyles';
import TaskItem from './components/TaskItem/TaskItem';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import ProjectHeaderCard from './components/ProjectHeaderCard';
import TaskEmptyState from './components/TaskEmptyState';
import { useProjectStatistics } from './hooks/useProjectStatistics';

interface TaskListViewProps {
  state: any;
  isCondensed: boolean;
}

export default function TaskListView({ state, isCondensed }: TaskListViewProps) {
  const {
    tasks, logs, nowIso, locale, customTranslations, theme,
    selectedProject, rootTasks, onAddTask
  }: {
    tasks: Task[];
    logs: TimeLog[];
    nowIso: string;
    locale: any;
    customTranslations?: any;
    theme: string;
    selectedProject: Project | null;
    rootTasks: Task[];
    onAddTask: (projectId: string, name: string, parentId: string | null) => void;
  } = state;

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

  const { stats, projectDurationSeconds } = useProjectStatistics({
    selectedProject,
    tasks,
    logs,
    nowIso,
  });

  const taskItemState = React.useMemo(() => ({
    ...state,
    editingId, setEditingId,
    editName, setEditName,
    showSubtaskFormForId, setShowSubtaskFormForId,
    newSubtaskName, setNewSubtaskName
  }), [state, editingId, editName, showSubtaskFormForId, newSubtaskName]);

  const th = getThemeStyles(theme);
  const sc = getScaleStyles(state.textAndIconSize || 'medium');

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim() || !selectedProject?.id) return;
    onAddTask(selectedProject.id, newTaskName.trim(), null);
    setNewTaskName('');
  };

  if (!selectedProject) {
    return (
      <div className={`border-2 border-dashed ${sc.roundedMain} p-16 text-center transition-all flex-1 min-h-0 ${theme === 'light'
        ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#2C2421]'
        : 'bg-[#FCFAF8]/5 border-white/10'
        }`}>
        <Folder className="w-12 h-12 text-[#9B8C83] mx-auto mb-3" />
        <h3 className={`font-bold ${sc.textTitle} ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>{translate(locale, 'dynamic.selectProject', customTranslations)}</h3>
        <p className={`${sc.textMain} mt-1 ${theme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]'}`}>Zaznacz projekt w bocznym menu po lewej stronie, aby zacząć zarządzać czasem.</p>
      </div>
    );
  }

  return (
    <div id="project-tasks-sheet" className={`backdrop-blur-md ${sc.roundedMain} ${sc.paddingMain} border shadow-2xl flex flex-col ${sc.gapMain} transition-all duration-300 flex-1 min-h-0 ${theme === 'light'
      ? 'bg-[#FCFAF8] border-[#DFD7CB]'
      : theme === 'high-contrast'
        ? 'bg-black border-2 border-white'
        : 'bg-[#FCFAF8]/5 border-white/10'
      }`}>
      
      <ProjectHeaderCard
        selectedProject={selectedProject}
        projectDurationSeconds={projectDurationSeconds}
        isCondensed={isCondensed}
        theme={theme}
        locale={locale}
        customTranslations={customTranslations}
        sc={sc}
        stats={stats}
        newTaskName={newTaskName}
        setNewTaskName={setNewTaskName}
        onAddTaskSubmit={handleAddTaskSubmit}
      />

      {/* Tree Grid List of Tasks & Subtasks */}
      <div id="tasks-tree-container" className={`flex flex-col ${sc.gapMain} overflow-y-auto pr-1 flex-1 min-h-0`}>
        {rootTasks.length === 0 ? (
          <TaskEmptyState
            theme={theme}
            locale={locale}
            customTranslations={customTranslations}
          />
        ) : (
          rootTasks.map((rootTask: Task) => (
            <TaskItem
              key={rootTask.id}
              rootTask={rootTask}
              state={taskItemState}
              isCondensed={isCondensed}
              th={th}
              sc={sc}
            />
          ))
        )}
      </div>
    </div>
  );
}
