import React, { useState, useMemo } from 'react';
import { ProgressBar } from '@components/ui/progress';
import { useTranslation } from '@common/i18n/translator';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { TimeLog } from '@bindings/TimeLog';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Heading, Caption, MonoText } from '@components/ui/typography';
import { SearchInput } from '@components/ui/search-input';
import { HStack } from '@components/ui/stack';
import { ConfirmDialog } from '@components/ConfirmDialog';
import { useDataSafe } from '@common/hooks/DataContext';
import { Pencil, Trash2 } from 'lucide-react';
import { ProjectChartItem } from '../types';
import ReportLogEditModal from './ReportLogEditModal';

export interface ReportLogListProps {
  filteredLogs: TimeLog[];
  projectChart: ProjectChartItem[];
  maxSec: number;
  displayLogs: Array<ClampedTimeLog | TimeLog>;
  projects: Project[];
  tasks: Task[];
  nowIso?: string;
  logs?: TimeLog[];
  activeTimerLogId?: string | null;
  onLogDeleted?: (logId: string) => void;
  onLogUpdated?: (logId: string) => void;
}

export default function ReportLogList({
  filteredLogs,
  projectChart,
  maxSec,
  displayLogs,
  projects,
  tasks,
  nowIso,
  logs,
  activeTimerLogId,
  onLogDeleted,
  onLogUpdated,
}: ReportLogListProps) {
  const { t } = useTranslation('report');
  const { t: tCommon } = useTranslation('common');
  const dataContext = useDataSafe();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingLog, setEditingLog] = useState<ClampedTimeLog | TimeLog | null>(null);
  const [deletingLog, setDeletingLog] = useState<ClampedTimeLog | TimeLog | null>(null);

  const allSourceLogs = logs ?? dataContext?.logs ?? [];
  const currentActiveId = activeTimerLogId ?? dataContext?.activeLog?.id ?? null;

  const searchedLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return displayLogs;

    return displayLogs.filter((log) => {
      const p = projects.find((x) => x.id === log.projectId);
      const tObj = tasks.find((x) => x.id === log.taskId);

      const taskName = (tObj?.name || '').toLowerCase();
      const projectName = (p?.name || '').toLowerCase();
      const note = (log.note || '').toLowerCase();

      return (
        taskName.includes(q) ||
        projectName.includes(q) ||
        note.includes(q)
      );
    });
  }, [displayLogs, searchQuery, projects, tasks]);

  const handleConfirmDelete = async () => {
    if (!deletingLog) return;
    const targetId = deletingLog.id;
    setDeletingLog(null);

    try {
      if (dataContext?.handleDeleteTimeLog) {
        await dataContext.handleDeleteTimeLog(targetId);
      } else if (dataContext?.refreshData) {
        await dataContext.refreshData();
      }
      onLogDeleted?.(targetId);
    } catch (err) {
      console.error('Failed to delete time log:', err);
    }
  };

  const getSourceLog = (target: ClampedTimeLog | TimeLog | null): TimeLog | null => {
    if (!target) return null;
    const found = allSourceLogs.find((l) => l.id === target.id);
    return found || (target as TimeLog);
  };

  if (filteredLogs.length === 0 && displayLogs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-xs font-mono">
        ⚠️ {t('NoDataSelectedRange')}
      </div>
    );
  }

  const activeEditingSourceLog = getSourceLog(editingLog);
  const editingTask = tasks.find((tObj) => tObj.id === activeEditingSourceLog?.taskId);
  const editingProject = projects.find((p) => p.id === activeEditingSourceLog?.projectId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Heading
          level={4}
          className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5"
        >
          📊 {t('GraphicalDistribution')}
        </Heading>
        <div className="flex flex-col gap-4">
          {projectChart.map((pc) => {
            const widthPct = Math.min(100, Math.max(5, (pc.seconds / maxSec) * 100));
            return (
              <div key={pc.id} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full bg-${pc.color}-500`} />
                    {pc.name}
                  </span>
                  <span className="font-mono text-orange-500">{formatSeconds(pc.seconds)}</span>
                </div>
                <ProgressBar value={widthPct} variant="orange" aria-label={pc.name} />
                {pc.tasks.length > 0 && (
                  <div className="flex flex-col gap-1 mt-1 pl-4 border-l-2 border-border/50">
                    {pc.tasks.map((tt) => (
                      <Caption key={tt.task?.id || Math.random()} className="flex justify-between items-center">
                        <span className="truncate">{tt.task?.name || 'N/A'}</span>
                        <span className="font-mono">{formatSeconds(tt.seconds)}</span>
                      </Caption>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <Heading level={4} className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase">
            📋 {t('PlainDump')} ({searchedLogs.length}
            {searchQuery.trim() ? ` / ${displayLogs.length}` : ''})
          </Heading>
          <div className="w-full sm:w-64">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder={t('SearchLogsPlaceholder')}
              data-testid="report-logs-search-input"
              className="h-8 text-xs bg-card"
            />
          </div>
        </div>

        {searchedLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs font-mono rounded-[1.5rem] border border-border bg-muted/20">
            🔍 {t('NoMatchingLogs')}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-border bg-muted/30 max-h-[250px] overflow-y-auto p-4 flex flex-col gap-2">
            {searchedLogs.map((log) => {
              const isClamped = 'clampedDurationSeconds' in log;
              const p = projects.find((x) => x.id === log.projectId);
              const tObj = tasks.find((x) => x.id === log.taskId);

              let durSeconds: number;
              let isMultiDay = false;
              let isPatch = false;
              let originalDurationSeconds = 0;
              let displayTime = log.startTime;

              if (isClamped) {
                const clamped = log as ClampedTimeLog;
                durSeconds = clamped.clampedDurationSeconds;
                isMultiDay = clamped.isMultiDaySegment;
                isPatch = Boolean(clamped.isPatch);
                originalDurationSeconds = clamped.originalDurationSeconds;
                displayTime = clamped.clampedStartTime || clamped.startTime;
              } else {
                const start = new Date(log.startTime).getTime();
                const fallbackEnd = nowIso ? new Date(nowIso).getTime() : start;
                const end = log.endTime ? new Date(log.endTime).getTime() : fallbackEnd;
                durSeconds = Math.max(0, Math.floor((end - start) / 1000));
              }

              const isActive = !log.endTime || log.endTime === null || log.id === currentActiveId;

              return (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5 py-1.5 border-b border-border/50 last:border-0 text-xs text-foreground"
                >
                  <div className="truncate flex items-center gap-1.5 flex-wrap">
                    <MonoText size="2xs" weight="bold" className="text-indigo-400 shrink-0">
                      [{new Date(displayTime).toLocaleTimeString()}]
                    </MonoText>
                    <strong className="text-foreground">"{tObj?.name || 'N/A'}"</strong>
                    <Caption as="span">({p?.name})</Caption>

                    {isMultiDay && (
                      <Badge
                        variant="outline"
                        size="xs"
                        className="font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shrink-0"
                      >
                        {t('MultiDaySegmentBadge')}: {formatSeconds(durSeconds)} / {formatSeconds(originalDurationSeconds)}
                      </Badge>
                    )}

                    {isPatch && (
                      <Badge
                        variant="outline"
                        size="xs"
                        className="font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 shrink-0"
                      >
                        {t('PatchBadge')}
                      </Badge>
                    )}
                  </div>

                  <HStack gap="xs" className="shrink-0 self-end sm:self-auto items-center">
                    <span className="font-mono text-orange-400 font-bold mr-2">
                      {formatSeconds(durSeconds)}
                    </span>

                    {!isPatch && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          disabled={isActive}
                          onClick={() => setEditingLog(log)}
                          data-testid={`edit-log-${log.id}`}
                          title={isActive ? t('ActiveTimerCannotModify') : t('EditLog')}
                          aria-label={isActive ? t('ActiveTimerCannotModify') : t('EditLog')}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          disabled={isActive}
                          onClick={() => setDeletingLog(log)}
                          data-testid={`delete-log-${log.id}`}
                          title={isActive ? t('ActiveTimerCannotModify') : t('DeleteLog')}
                          aria-label={isActive ? t('ActiveTimerCannotModify') : t('DeleteLog')}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </HStack>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReportLogEditModal
        isOpen={Boolean(editingLog)}
        onClose={() => setEditingLog(null)}
        log={activeEditingSourceLog}
        projectName={editingProject?.name}
        taskName={editingTask?.name}
        onSaveSuccess={onLogUpdated}
      />

      <ConfirmDialog
        open={Boolean(deletingLog)}
        onOpenChange={(open) => !open && setDeletingLog(null)}
        title={t('ConfirmDeleteLogTitle')}
        description={t('ConfirmDeleteLogDesc')}
        confirmLabel={tCommon('Delete')}
        cancelLabel={tCommon('Cancel')}
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingLog(null)}
      />
    </div>
  );
}
