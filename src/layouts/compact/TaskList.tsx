import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { Project } from '@bindings/Project';
import { translate } from '@common/i18n/translator';
import { TranslationDictionary } from '@common/i18n/types';
import { TaskCard } from './TaskCard';
import { Locale } from '@bindings/Locale';
import { Caption } from '@components/ui/typography';

interface TaskListProps {
  activeProj: Project | undefined;
  rootTasks: Task[];
  allTasks: Task[];
  activeLog: TimeLog | null;
  locale: Locale;
  customTranslations?: Partial<TranslationDictionary>;
  onStartTimer: (taskId: string) => void;
  onStopTimer: () => void;
  showToast: (msg: string) => void;
}

export function TaskList({
  activeProj,
  rootTasks,
  allTasks,
  activeLog,
  locale,
  customTranslations,
  onStartTimer,
  onStopTimer,
  showToast,
}: TaskListProps) {
  if (!activeProj) {
    return (
      <Caption variant="muted" className="italic text-center py-4 block">
        {translate(locale, 'project', 'NoProjects', customTranslations)}
      </Caption>
    );
  }

  if (rootTasks.length === 0) {
    return (
      <Caption variant="muted" className="italic text-center py-4 block">
        {translate(locale, 'task', 'NoTasksInProfile', customTranslations)}
      </Caption>
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
