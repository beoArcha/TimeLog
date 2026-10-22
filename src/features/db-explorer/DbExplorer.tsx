import React, { useRef, useState, useMemo } from 'react';
import { Database, DownloadCloud, UploadCloud } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import DataTableViewer, { type TableOption } from './components/DataTableViewer';
import ProjectsTable from './components/ProjectsTable';
import TasksTable from './components/TasksTable';
import TimeLogsTable from './components/TimeLogsTable';
import HolidaysLeavesTable from './components/HolidaysLeavesTable';
import PatchLogsTable from './components/PatchLogsTable';
import { TableSkeleton } from '@components/ui/Skeletons';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import { useWindowShell } from '@common/contexts/WindowShellContext';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { HStack } from '@components/ui/stack';
import { ViewHeader } from '@components/ViewHeader';
import { exportDatabaseAsJson } from '@common/utils/databaseExport';
import { validateBackupPayload } from '@common/utils/backupValidator';
import { ErrorHandler, PersistenceException } from '@common/exceptions';

const DB_TABLE_OPTIONS: TableOption[] = [
  { id: 'projects', label: 'projects' },
  { id: 'tasks', label: 'tasks' },
  { id: 'time_logs', label: 'time_logs' },
  { id: 'holidays_leaves', label: 'holidays_leaves' },
  { id: 'patch_logs', label: 'patch_logs' },
];

function resolveNullableText(
  currentValue: string | null,
  column: string,
  targetColumn: string,
  newValue: string
): string | null {
  if (column !== targetColumn) {
    return currentValue;
  }
  const trimmed = newValue.trim();
  return trimmed === '' ? null : trimmed;
}

export default function DbExplorer() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useWindowShell();
  const { locale, customTranslations } = useLocale();
  const {
    projects,
    tasks,
    logs,
    holidays,
    patches,
    handleRestoreState,
    handleUpdateProject,
    handleUpdateTask,
    handleEditTimeLog,
    isLoading,
  } = useData();

  const [activeTable, setActiveTable] = useState('');

  const currentTableData = useMemo<Record<string, unknown>[]>(() => {
    switch (activeTable) {
      case 'projects':
        return projects as unknown as Record<string, unknown>[];
      case 'tasks':
        return tasks as unknown as Record<string, unknown>[];
      case 'time_logs':
        return logs as unknown as Record<string, unknown>[];
      case 'holidays_leaves':
        return (holidays ?? []) as unknown as Record<string, unknown>[];
      case 'patch_logs':
        return (patches ?? []) as unknown as Record<string, unknown>[];
      default:
        return [];
    }
  }, [activeTable, projects, tasks, logs, holidays, patches]);

  const handleCellEdit = async (rowId: string, column: string, newValue: string) => {
    try {
      if (activeTable === 'projects') {
        const target = projects.find((p) => p.id === rowId);
        if (target && handleUpdateProject) {
          const nextName = column === 'name' ? newValue : target.name;
          const nextColor = column === 'color' ? newValue : target.color;
          await handleUpdateProject(rowId, nextName, nextColor);
        }
      } else if (activeTable === 'tasks') {
        const target = tasks.find((t) => t.id === rowId);
        if (target && handleUpdateTask) {
          await handleUpdateTask(rowId, {
            name: column === 'name' ? newValue : target.name,
            completed: column === 'completed' ? newValue === 'true' : target.completed,
          });
        }
      } else if (activeTable === 'time_logs') {
        const target = logs.find((l) => l.id === rowId);
        if (target && handleEditTimeLog) {
          const nextStart = column === 'startTime' ? newValue : target.startTime;
          const nextEnd = resolveNullableText(target.endTime, column, 'endTime', newValue);
          const nextNote = resolveNullableText(target.note, column, 'note', newValue);
          await handleEditTimeLog(
            rowId,
            target.taskId,
            nextStart,
            nextEnd,
            nextNote,
            'Inline edit via Data Table Viewer'
          );
        }
      }
      showToast?.(translate(locale, 'database', 'SaveChanges', customTranslations));
    } catch (err) {
      ErrorHandler.handle(new PersistenceException('Failed to update cell', err, 'ERR_CELL_UPDATE'));
    }
  };

  const handleExportDatabase = () => {
    exportDatabaseAsJson({ projects, tasks, logs, holidays, patches });
  };

  const handleImportDatabase = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const data = validateBackupPayload(parsed);

        if (handleRestoreState) {
          await handleRestoreState(data);
        }

        showToast?.(translate(locale, 'database', 'ImportSuccess', customTranslations));
      } catch (err) {
        ErrorHandler.handle(
          new PersistenceException('Failed to restore database from file', err, 'ERR_DB_RESTORE')
        );
        showToast?.(translate(locale, 'database', 'InvalidBackupFile', customTranslations));
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div id="db-explorer-panel" className="text-left flex flex-col gap-8 pb-12">
      <ViewHeader
        className="border-b pb-4 border-border/40"
        title={translate(locale, 'database', 'DbTitle', customTranslations)}
        icon={Database}
        iconColor="text-primary animate-pulse"
        description={translate(locale, 'database', 'DbDesc', customTranslations)}
        actions={
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <Badge variant="orange" size="sm" className="font-mono uppercase tracking-wider self-start sm:self-auto">
              {translate(locale, 'database', 'TauriDriver', customTranslations)}
            </Badge>
            <HStack gap="xs" className="self-start sm:self-auto">
              <Button
                data-testid="export-db-btn"
                variant="outline"
                size="xs"
                onClick={handleExportDatabase}
                className="text-xs uppercase font-bold tracking-wider cursor-pointer h-auto py-1.5 px-3 flex items-center gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                {translate(locale, 'database', 'ExportDb', customTranslations)}
              </Button>
              <Button
                data-testid="import-db-btn"
                variant="secondary"
                size="xs"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs uppercase font-bold tracking-wider cursor-pointer h-auto py-1.5 px-3 flex items-center gap-1.5"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                {translate(locale, 'database', 'ImportDb', customTranslations)}
              </Button>
              <Input
                type="file"
                accept=".json,.sqlite"
                ref={fileInputRef}
                onChange={handleImportDatabase}
                className="hidden"
                data-testid="import-db-input"
              />
            </HStack>
          </div>
        }
      />

      <div className="flex flex-col gap-8">
        {isLoading ? (
          <div className="bg-slate-900/10 border border-white/5 rounded-3xl p-6 shadow-xl">
            <TableSkeleton rows={8} />
          </div>
        ) : (
          <>
            <DataTableViewer
              tables={DB_TABLE_OPTIONS}
              activeTable={activeTable}
              onSelectTable={setActiveTable}
              data={currentTableData}
              onCellEdit={handleCellEdit}
            >
              <DataTableViewer.Header />
              <DataTableViewer.Toolbar>
                <DataTableViewer.TableSelector />
                <DataTableViewer.Search />
              </DataTableViewer.Toolbar>
              <DataTableViewer.Table />
              <DataTableViewer.Pagination />
              <DataTableViewer.DetailModal />
            </DataTableViewer>
            <ProjectsTable />
            <TasksTable />
            <TimeLogsTable />
            <HolidaysLeavesTable />
            <PatchLogsTable />
          </>
        )}
      </div>
    </div>
  );
}

