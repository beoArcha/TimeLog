import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { Project } from '@bindings/Project';
import { translate, LocaleType, TranslationDictionary } from '@common/i18n/i18n';
import { DynamicKey } from '@common/i18n/keys/DynamicKey';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  activeProj: Project | undefined;
  rootTasks: Task[];
  allTasks: Task[];
  activeLog: TimeLog | null;
  resolvedTheme: string | undefined;
  locale: LocaleType;
  customTranslations: Partial<TranslationDictionary> | undefined;
  onStartTimer: (taskId: string) => void;
  onStopTimer: () => void;
  showToast: (msg: string) => void;
}

export function TaskList({
  activeProj,
  rootTasks,
  allTasks,
  activeLog,
  resolvedTheme,
  locale,
  customTranslations,
  onStartTimer,
  onStopTimer,
  showToast,
}: TaskListProps) {
  if (!activeProj) {
    return (
      <p className="text-xs italic text-slate-400 text-center py-4">
        {translate(locale, DynamicKey.NoProjects, customTranslations)}
      </p>
    );
  }

  if (rootTasks.length === 0) {
    return (
      <p className="text-xs italic text-slate-400 text-center py-4">
        {translate(locale, DynamicKey.NoTasksInProfile, customTranslations)}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {rootTasks.map((task) => {
        const subtasks = allTasks.filter((t) => t.parentTaskId === task.id);

        return (
          <TaskCard
            key={task.id}
            task={task}
            subtasks={subtasks}
            activeLog={activeLog}
            resolvedTheme={resolvedTheme}
            locale={locale}
            customTranslations={customTranslations}
            onStartTimer={onStartTimer}
            onStopTimer={onStopTimer}
            showToast={showToast}
          />
        );
      })}
    </div>
  );
}
