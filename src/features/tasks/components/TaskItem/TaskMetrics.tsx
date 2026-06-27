import { Task } from '@bindings/Task';
import { Locale } from '@bindings/Locale';
import { Plus, Play, Square } from 'lucide-react';
import { translate } from '@common/i18n/i18n';
import { GuiKey } from '@common/i18n/keys/GuiKey';
import { formatSeconds } from '@features/timelogs/timelogUtils';

interface TaskMetricsProps {
  rootTask: Task;
  rootDuration: number;
  isCurrentRunning: boolean;
  isAnyRunning: boolean;
  isCondensed: boolean;
  showSubtaskFormForId: string | null;
  theme: string;
  locale: Locale;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customTranslations: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sc: any;
  onStartTimer: (id: string) => void;
  setShowSubtaskFormForId: (id: string | null) => void;
}

export function TaskMetrics({
  rootTask,
  rootDuration,
  isCurrentRunning,
  isAnyRunning,
  isCondensed,
  showSubtaskFormForId,
  theme,
  locale,
  customTranslations,
  onStartTimer,
  setShowSubtaskFormForId,
}: TaskMetricsProps) {
  return (
    <div
      className={`flex items-center gap-3 ${isCondensed
          ? `w-full justify-between pt-3 border-t ${theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10'
          }`
          : ''
        }`}
    >
      <span
        className={`text-xs font-mono font-extrabold px-3 py-1.5 rounded-full border transition-all ${isAnyRunning
            ? 'bg-orange-500/20 border-orange-500/30 text-orange-600 dark:text-orange-300 shadow-md scale-105 animate-pulse'
            : theme === 'light'
              ? 'bg-[#EAE4DB] border-[#DFD7CB] text-[#5A4A42]'
              : 'bg-[#FCFAF8]/5 border-white/10 text-slate-200'
          }`}
      >
        {translate(locale, GuiKey.CounterLabel, customTranslations)}: {formatSeconds(rootDuration)}
      </span>

      <div className="flex items-center gap-2 shrink-0">
        {isCurrentRunning ? (
          <button
            id={`stop-btn-${rootTask.id}`}
            onClick={() => onStartTimer(rootTask.id)}
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl p-2 transition-all transform hover:scale-105 cursor-pointer"
            title={translate(locale, 'common.stopTimer', customTranslations)}
          >
            <Square className="w-3.5 h-3.5 fill-white" />
          </button>
        ) : (
          <button
            id={`start-btn-${rootTask.id}`}
            onClick={() => !rootTask.completed && onStartTimer(rootTask.id)}
            disabled={rootTask.completed}
            className={`rounded-xl p-2 transition-all transform hover:scale-105 cursor-pointer ${rootTask.completed
                ? 'bg-[#FCFAF8]/5 text-[#9B8C83] border border-transparent cursor-not-allowed opacity-50'
                : 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg'
              }`}
            title={translate(locale, 'common.startTimer', customTranslations)}
          >
            <Play className="w-3.5 h-3.5 fill-white text-white" />
          </button>
        )}

        <button
          id={`show-subtask-form-btn-${rootTask.id}`}
          onClick={() =>
            setShowSubtaskFormForId(showSubtaskFormForId === rootTask.id ? null : rootTask.id)
          }
          className={`rounded-xl px-2.5 py-2 text-[11px] font-semibold flex items-center gap-1 transition-all border cursor-pointer shrink-0 ${theme === 'light'
              ? 'bg-[#EAE4DB] hover:bg-[#DFD7CB] text-[#5A4A42] border-[#DFD7CB]'
              : 'bg-[#FCFAF8]/5 hover:bg-[#FCFAF8]/15 text-slate-200 hover:text-white border-white/10'
            }`}
          title={translate(locale, GuiKey.AddSubtask, customTranslations)}
        >
          <Plus className="w-3.5 h-3.5 text-orange-500" />{' '}
          <span className={isCondensed ? 'hidden xs:inline' : ''}>
            {translate(locale, GuiKey.SubtaskLabel, customTranslations)}
          </span>
        </button>
      </div>
    </div>
  );
}
