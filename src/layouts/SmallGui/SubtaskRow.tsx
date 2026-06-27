import React from 'react';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { Play, Square } from 'lucide-react';
import { translate, LocaleType, TranslationDictionary } from '@common/i18n/i18n';
import { SmallGuiKey } from '@common/i18n/keys/SmallGuiKey';

interface SubtaskRowProps {
  key?: React.Key;
  subtask: Task;
  activeLog: TimeLog | null;
  locale: LocaleType;
  customTranslations: Partial<TranslationDictionary> | undefined;
  onStartTimer: (taskId: string) => void;
  onStopTimer: () => void;
  showToast: (msg: string) => void;
}

export function SubtaskRow({
  subtask,
  activeLog,
  locale,
  customTranslations,
  onStartTimer,
  onStopTimer,
  showToast,
}: SubtaskRowProps) {
  const isSubActive = activeLog !== null && activeLog.taskId === subtask.id;

  const handleClick = () => {
    if (isSubActive) {
      onStopTimer();
      showToast(
        `${translate(locale, SmallGuiKey.StoppedSubtask, customTranslations)}${subtask.name}`,
      );
    } else {
      onStartTimer(subtask.id);
      showToast(
        `${translate(locale, SmallGuiKey.StartedSubtask, customTranslations)}${subtask.name}`,
      );
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span
        className={`text-[11px] truncate flex-1 ${
          subtask.completed ? 'line-through text-slate-500' : 'text-slate-300'
        }`}
      >
        ↳ {subtask.name}
      </span>

      <button
        onClick={handleClick}
        className={`p-1 rounded-md transition-all cursor-pointer ${
          isSubActive
            ? 'bg-rose-500/25 text-rose-550'
            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
        }`}
      >
        {isSubActive ? (
          <Square className="w-2.5 h-2.5 fill-rose-500" />
        ) : (
          <Play className="w-2.5 h-2.5 fill-emerald-500" />
        )}
      </button>
    </div>
  );
}
