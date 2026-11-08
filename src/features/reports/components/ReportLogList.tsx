import React, { useState, useMemo } from 'react';
import { useTranslation } from '@common/i18n/translator';
import { TimeLog } from '@bindings/TimeLog';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { Locale } from '@bindings/Locale';
import { Heading } from '@components/ui/typography';
import { SearchInput } from '@components/ui/search-input';
import { ConfirmDialog } from '@components/ConfirmDialog';
import { useDebounce } from '@common/hooks/useDebounce';
import { ProjectChartItem } from '../types';
import { ReportLogEditModal } from '@components/ReportLogEditModal';
import ReportLogDistribution from './ReportLogDistribution';
import ReportLogRow from './ReportLogRow';
import { useAuditEdit } from '../hooks/useAuditEdit';

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
  locale?: Locale;
  timeZone?: string;
  debounceDelay?: number;
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
  locale: propLocale,
  timeZone,
  debounceDelay = 200,
}: ReportLogListProps) {
  const { t, locale: contextLocale } = useTranslation('report');
  const { t: tCommon } = useTranslation('common');
  const activeLocale = propLocale ?? contextLocale;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, debounceDelay);

  const {
    editingLog,
    deletingLog,
    deleteError,
    openEdit,
    closeEdit,
    openDelete,
    closeDelete,
    handleConfirmDelete,
    isLogActive,
    activeEditingSourceLog,
    editingProject,
    editingTask,
  } = useAuditEdit({
    logs,
    projects,
    tasks,
    activeTimerLogId,
    onLogDeleted,
    onLogUpdated,
  });

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const searchedLogs = useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();
    if (!q) return displayLogs;

    return displayLogs.filter((log) => {
      const p = projectMap.get(log.projectId);
      const tObj = taskMap.get(log.taskId);

      const taskName = (tObj?.name || '').toLowerCase();
      const projectName = (p?.name || '').toLowerCase();
      const note = (log.note || '').toLowerCase();

      return (
        taskName.includes(q) ||
        projectName.includes(q) ||
        note.includes(q)
      );
    });
  }, [displayLogs, debouncedSearchQuery, projectMap, taskMap]);

  if (filteredLogs.length === 0 && displayLogs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-xs font-mono">
        ⚠️ {t('NoDataSelectedRange')}
      </div>
    );
  }

  return (
    <div
      data-slot="report-log-list"
      data-testid="report-log-list"
      className="flex flex-col gap-6 print:break-inside-auto"
    >
      <ReportLogDistribution projectChart={projectChart} maxSec={maxSec} />

      <div data-slot="report-log-dump-section" className="flex flex-col gap-3 mt-4 print:break-inside-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 print:block">
          <Heading level={4} className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase">
            📋 {t('PlainDump')} ({searchedLogs.length}
            {debouncedSearchQuery.trim() ? ` / ${displayLogs.length}` : ''})
          </Heading>
          <div className="w-full sm:w-64 print:hidden">
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
          <div
            data-testid="report-log-list-scroll-container"
            className="rounded-[1.5rem] border border-border bg-muted/30 max-h-[250px] overflow-y-auto print:max-h-none print:overflow-visible print:h-auto p-4 flex flex-col gap-2"
          >
            {searchedLogs.map((log) => (
              <ReportLogRow
                key={log.id}
                log={log}
                project={projectMap.get(log.projectId)}
                task={taskMap.get(log.taskId)}
                isActive={isLogActive(log)}
                locale={activeLocale}
                timeZone={timeZone}
                nowIso={nowIso}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ))}
          </div>
        )}
      </div>

      <ReportLogEditModal
        isOpen={Boolean(editingLog)}
        onClose={closeEdit}
        log={activeEditingSourceLog}
        projectName={editingProject?.name}
        taskName={editingTask?.name}
        onSaveSuccess={onLogUpdated}
      />

      <ConfirmDialog
        open={Boolean(deletingLog)}
        onOpenChange={(open) => !open && closeDelete()}
        title={t('ConfirmDeleteLogTitle')}
        description={t('ConfirmDeleteLogDesc')}
        confirmLabel={tCommon('Delete')}
        cancelLabel={tCommon('Cancel')}
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={closeDelete}
        errorMessage={deleteError}
      />
    </div>
  );
}
