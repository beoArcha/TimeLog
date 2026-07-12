import React from 'react';
import { Database } from 'lucide-react';
import { useOxyFlow } from '@common/hooks/OxyContext';
import { translate } from '@common/i18n/translator';

import ProjectsTable from './components/ProjectsTable';
import TasksTable from './components/TasksTable';
import TimeLogsTable from './components/TimeLogsTable';
import HolidaysLeavesTable from './components/HolidaysLeavesTable';
import PatchLogsTable from './components/PatchLogsTable';

import { TableSkeleton } from '@components/ui/Skeletons';

export default function DbExplorer() {
  const { 
    projects, tasks, logs, holidays, patches,
    locale, customTranslations, isLoading
  } = useOxyFlow();

  const handleExportDatabase = () => {
    const data = { projects, tasks, logs, holidays, patches };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OxyFlow_Backup_${new Date().toISOString().substring(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="text-left flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-white/5">
        <div>
          <h2 className="text-xl font-heading font-extrabold flex items-center gap-2 dark:text-white">
            <Database className="w-5.5 h-5.5 text-orange-500 animate-pulse" />
            <span>{translate(locale, 'database', 'DbTitle', customTranslations)}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {translate(locale, 'database', 'DbDesc', customTranslations)}
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <span className="text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3.5 py-1.5 rounded-xl uppercase font-bold self-start sm:self-auto tracking-wider">
            {translate(locale, 'database', 'TauriDriver', customTranslations)}
          </span>
          <button
            onClick={handleExportDatabase}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-600 transition-colors uppercase font-bold tracking-wider cursor-pointer"
          >
            {translate(locale, 'database', 'ExportDb', customTranslations)}
          </button>
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
