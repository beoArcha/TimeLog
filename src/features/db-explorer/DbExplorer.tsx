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
import { Badge } from '@components/ui/badge';
import { ViewHeader } from '@components/ViewHeader';
import { exportDatabaseAsJson } from '@common/utils/databaseExport';

export default function DbExplorer() {
  const { locale, customTranslations } = useLocale();
  const { projects, tasks, logs, holidays, patches, isLoading } = useData();

  const handleExportDatabase = () => {
    exportDatabaseAsJson({ projects, tasks, logs, holidays, patches });
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
            <Button
              data-testid="export-db-btn"
              variant="outline"
              size="xs"
              onClick={handleExportDatabase}
              className="text-xs uppercase font-bold tracking-wider cursor-pointer h-auto py-1.5 px-3"
            >
              {translate(locale, 'database', 'ExportDb', customTranslations)}
            </Button>
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
