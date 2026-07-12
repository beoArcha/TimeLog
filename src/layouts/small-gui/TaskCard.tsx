import React from 'react';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { Play, Square } from 'lucide-react';
import { translate, LocaleType, TranslationDictionary } from '@common/i18n/i18n';
import { SmallGuiKey } from '@common/i18n/keys/SmallGuiKey';
import { SubtaskRow } from './SubtaskRow';

interface TaskCardProps {
  key?: React.Key;
  task: Task;
  subtasks: Task[];
  activeLog: TimeLog | null;
  resolvedTheme: string | undefined;
  locale: LocaleType;
  customTranslations: Partial<TranslationDictionary> | undefined;
  onStartTimer: (taskId: string) => void;
  onStopTimer: () => void;
  showToast: (msg: string) => void;
}

export function TaskCard({
  task,
  subtasks,
  activeLog,
  resolvedTheme,
  locale,
  customTranslations,
  onStartTimer,
  onStopTimer,
  showToast,
}: TaskCardProps) {
  const isRootActive = activeLog !== null && activeLog.taskId === task.id;

  const handleTimerClick = () => {
    if (isRootActive) {
      onStopTimer();
      showToast(
        `${translate(locale, SmallGuiKey.StoppedMeasurement, customTranslations)}${task.name}`,
      );
    } else {
      onStartTimer(task.id);
      showToast(
        `${translate(locale, SmallGuiKey.StartedMeasurement, customTranslations)}${task.name}`,
      );
    }
  };

  const timerTitle = isRootActive
    ? translate(locale, SmallGuiKey.StopMeasurement, customTranslations)
    : translate(locale, SmallGuiKey.StartMeasurement, customTranslations);

  return (
    <div
      className={`p-2 rounded-xl transition-colors border ${
        resolvedTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs font-semibold truncate flex-1 ${
            task.completed ? 'line-through text-slate-500' : ''
          }`}
        >
          {task.name}
        </span>

        <button
          onClick={handleTimerClick}
          className={`p-1.5 rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
            isRootActive
              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-450 border border-emerald-500/30'
          }`}
          title={timerTitle}
          aria-label={timerTitle}
        >
          {isRootActive ? (
            <Square className="w-3.5 h-3.5 fill-rose-500" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-emerald-500" />
          )}
        </button>
      </div>

      {subtasks.length > 0 && (
        <div className="flex flex-col gap-1.5 pl-3.5 mt-1.5 border-l border-white/10">
          {subtasks.map((sub) => (
            <SubtaskRow
              key={sub.id}
              subtask={sub}
              activeLog={activeLog}
              locale={locale}
              customTranslations={customTranslations}
              onStartTimer={onStartTimer}
              onStopTimer={onStopTimer}
              showToast={showToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}
