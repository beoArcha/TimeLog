import { Task } from '@bindings/Task';
import { Plus, Play, Square } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { useTimerSafe } from '@common/hooks/DataContext';
import { useTaskEditing } from '../../context/TaskEditingContext';
import { formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { Button } from '@components/ui/button';

export interface TaskMetricsProps {
  rootTask: Task;
  rootDuration: number;
  isCurrentRunning: boolean;
  isAnyRunning: boolean;
  isCondensed: boolean;
  showSubtaskFormForId?: string | null;
  setShowSubtaskFormForId?: (id: string | null) => void;
  onStartTimer?: (id: string) => void;
  onStopTimer?: (projectId?: string) => void;
}

export function TaskMetrics({
  rootTask,
  rootDuration,
  isCurrentRunning,
  isAnyRunning,
  isCondensed,
  showSubtaskFormForId: propShowSubtaskFormForId,
  setShowSubtaskFormForId: propSetShowSubtaskFormForId,
  onStartTimer: propOnStartTimer,
  onStopTimer: propOnStopTimer,
}: TaskMetricsProps) {
  const { t: tTask } = useTranslation('task');
  const { t: tTimer } = useTranslation('timer');

  const timer = useTimerSafe();
  const editing = useTaskEditing();

  const onStartTimer = propOnStartTimer ?? timer?.handleStartTimer ?? (() => {});
  const onStopTimer = propOnStopTimer ?? timer?.handleStopTimer;
  const showSubtaskFormForId = propShowSubtaskFormForId ?? editing?.showSubtaskFormForId ?? null;
  const setShowSubtaskFormForId =
    propSetShowSubtaskFormForId ??
    editing?.setShowSubtaskFormForId ??
    (() => {});


  return (
    <div
      className={`flex items-center gap-3 ${isCondensed
        ? 'w-full justify-between pt-3 border-t border-border'
        : ''
        }`}
    >
      <span
        className={`text-xs font-mono font-extrabold px-3 py-1.5 rounded-full border transition-all ${isAnyRunning
          ? 'bg-orange-500/20 border-orange-500/30 text-orange-600 dark:text-orange-300 shadow-md scale-105 animate-pulse'
          : 'bg-muted border-border text-foreground'
          }`}
      >
        {tTask('CounterLabel')}: {formatSeconds(rootDuration)}
      </span>

      <div className="flex items-center gap-2 shrink-0">
        {isCurrentRunning ? (
          <Button
            id={`stop-btn-${rootTask.id}`}
            variant="destructive"
            size="icon-xs"
            onClick={() => onStopTimer ? onStopTimer(rootTask.projectId) : onStartTimer(rootTask.id)}
            className="rounded-xl p-2 transition-all transform hover:scale-105 cursor-pointer"
            title={tTimer('StopMeasurement')}
            aria-label={tTimer('StopMeasurement')}
          >
            <Square className="w-3.5 h-3.5 fill-white" />
          </Button>
        ) : (
          <Button
            id={`start-btn-${rootTask.id}`}
            variant="ghost"
            size="icon-xs"
            onClick={() => !rootTask.completed && onStartTimer(rootTask.id)}
            disabled={rootTask.completed}
            className={`rounded-xl p-2 transition-all transform hover:scale-105 cursor-pointer ${rootTask.completed
              ? 'bg-card/5 text-muted-foreground border border-transparent cursor-not-allowed opacity-50'
              : 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg'
              }`}
            title={tTimer('StartMeasurement')}
            aria-label={tTimer('StartMeasurement')}
          >
            <Play className="w-3.5 h-3.5 fill-white text-white" />
          </Button>
        )}

        <Button
          id={`show-subtask-form-btn-${rootTask.id}`}
          variant="outline"
          size="xs"
          onClick={() =>
            setShowSubtaskFormForId(showSubtaskFormForId === rootTask.id ? null : rootTask.id)
          }
          className="rounded-xl px-2.5 py-2 h-auto text-xs font-semibold flex items-center gap-1 transition-all border cursor-pointer shrink-0 bg-muted hover:bg-muted/80 text-foreground border-border"
          title={tTask('AddSubtask')}
          aria-label={tTask('AddSubtask')}
        >
          <Plus className="w-3.5 h-3.5 text-orange-500" />{' '}
          <span className={isCondensed ? 'hidden xs:inline' : ''}>
            {tTask('SubtaskLabel')}
          </span>
        </Button>
      </div>
    </div>
  );
}
