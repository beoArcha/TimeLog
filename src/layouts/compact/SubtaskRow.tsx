import React from 'react';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { Play, Square } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { TranslationDictionary } from '@common/i18n/types';
import { Locale } from '@/src/bindings/Locale';
import { Button } from '@components/ui/button';

interface SubtaskRowProps {
  key?: React.Key;
  subtask: Task;
  activeLog: TimeLog | null;
  locale: Locale;
  customTranslations?: Partial<TranslationDictionary>;
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
        `${translate(locale, 'timer', 'StoppedSubtask', customTranslations)}${subtask.name}`,
      );
    } else {
      onStartTimer(subtask.id);
      showToast(
        `${translate(locale, 'timer', 'StartedSubtask', customTranslations)}${subtask.name}`,
      );
    }
  };

  const timerTitle = isSubActive
    ? translate(locale, 'timer', 'StopMeasurement', customTranslations)
    : translate(locale, 'timer', 'StartMeasurement', customTranslations);

  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span
        className={`text-[11px] truncate flex-1 ${subtask.completed ? 'line-through text-muted-foreground' : 'text-foreground'
          }`}
      >
        ↳ {subtask.name}
      </span>

      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleClick}
        title={timerTitle}
        aria-label={timerTitle}
        className={`p-1 rounded-md transition-all cursor-pointer ${isSubActive
            ? 'bg-rose-500/25 text-rose-500'
            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
          }`}
      >
        {isSubActive ? (
          <Square className="w-2.5 h-2.5 fill-rose-500" />
        ) : (
          <Play className="w-2.5 h-2.5 fill-emerald-500" />
        )}
      </Button>
    </div>
  );
}
