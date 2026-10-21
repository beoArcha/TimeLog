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
import { Heading, Text } from '@components/ui/typography';
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
          <Heading level={2} className="flex items-center gap-2 dark:text-white">
            <Database className="w-5.5 h-5.5 text-orange-500 animate-pulse" />
            <span>{translate(locale, 'database', 'DbTitle', customTranslations)}</span>
          </Heading>
          <Text size="sm" variant="muted" className="mt-1 max-w-2xl leading-relaxed">
            {translate(locale, 'database', 'DbDesc', customTranslations)}
          </Text>
        </div>
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
