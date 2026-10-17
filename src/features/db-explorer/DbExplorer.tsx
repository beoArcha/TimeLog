import { Database } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import ProjectsTable from './components/ProjectsTable';
import TasksTable from './components/TasksTable';
import TimeLogsTable from './components/TimeLogsTable';
import HolidaysLeavesTable from './components/HolidaysLeavesTable';
import PatchLogsTable from './components/PatchLogsTable';
import { TableSkeleton } from '@components/ui/Skeletons';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import { Button } from '@components/ui/button';
import { exportDatabaseAsJson } from '@common/utils/databaseExport';

export default function DbExplorer() {
  const { locale, customTranslations } = useLocale();
  const { projects, tasks, logs, holidays, patches, isLoading } = useData();

  const handleExportDatabase = () => {
    exportDatabaseAsJson({ projects, tasks, logs, holidays, patches });
  };

  return (
    <div id="db-explorer-panel" className="text-left flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-white/5">
        <div>
          <h2 className="text-xl font-heading font-extrabold flex items-center gap-2 dark:text-white">
            <Database className="w-5.5 h-5.5 text-orange-500 animate-pulse" />
            <span>{translate(locale, 'database', 'DbTitle', customTranslations)}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            {translate(locale, 'database', 'DbDesc', customTranslations)}
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <span className="text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3.5 py-1.5 rounded-xl uppercase font-bold self-start sm:self-auto tracking-wider">
            {translate(locale, 'database', 'TauriDriver', customTranslations)}
          </span>
          <Button
            data-testid="export-db-btn"
            variant="outline"
            size="xs"
            onClick={handleExportDatabase}
            className="text-[10px] uppercase font-bold tracking-wider cursor-pointer h-auto py-1.5 px-3"
          >
            {translate(locale, 'database', 'ExportDb', customTranslations)}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {isLoading ? (
          <div className="bg-slate-900/10 border border-white/5 rounded-3xl p-6 shadow-xl">
            <TableSkeleton rows={8} />
          </div>
        ) : (
          <>
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
