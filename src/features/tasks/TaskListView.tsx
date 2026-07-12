import React from 'react';
import { Folder } from 'lucide-react';
import { translate } from '@common/i18n/i18n';
import { getThemeStyles, getScaleStyles } from '@/src/layouts/parts/GuiStyles';
import TaskItem from './components/TaskItem/TaskItem';
import { EngineRouter } from '@common/engine/EngineRouter';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import ProjectHeaderCard from './components/ProjectHeaderCard';
import TaskEmptyState from './components/TaskEmptyState';

interface TaskListViewProps {
  state: any;
  isCondensed: boolean;
}

export default function TaskListView({ state, isCondensed }: TaskListViewProps) {
  const {
    tasks, logs, nowIso, locale, customTranslations, theme,
    selectedProject, rootTasks,
    newTaskName, setNewTaskName, onAddTask
  }: {
    tasks: Task[];
    logs: TimeLog[];
    nowIso: string;
    locale: any;
    customTranslations?: any;
    theme: string;
    selectedProject: Project | null;
    rootTasks: Task[];
    newTaskName: string;
    setNewTaskName: (name: string) => void;
    onAddTask: (projectId: string, name: string, parentId: string | null) => void;
  } = state;

  const [stats, setStats] = React.useState<ProjectStatistics | null>(null);

  React.useEffect(() => {
    if (!selectedProject?.id) {
      queueMicrotask(() => setStats(null));
      return;
    }
    const fetchStats = async () => {
      try {
        const data = await EngineRouter.getInstance().getProjectStatistics(selectedProject.id);
        setStats(data);
      } catch (err) {
        console.error("Failed to load project statistics:", err);
      }
    };
    fetchStats();
  }, [selectedProject?.id, tasks, logs]);

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
        tasks={tasks}
        logs={logs}
        nowIso={nowIso}
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
              state={state}
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
