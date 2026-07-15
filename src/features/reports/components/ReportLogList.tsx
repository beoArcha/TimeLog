import React from 'react';
import { motion } from 'motion/react';
import { translate } from '@common/i18n/translator';
import { formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { Locale } from '@bindings/Locale';

interface ReportLogListProps {
  filteredLogs: any[];
  projectChart: any[];
  maxSec: number;
  displayLogs: any[];
  projects: any[];
  tasks: any[];
  nowIso: string;
  theme: string;
  locale: Locale;
  customTranslations: any;
  th: any;
}

export default function ReportLogList({
  filteredLogs,
  projectChart,
  maxSec,
  displayLogs,
  projects,
  tasks,
  nowIso,
  theme,
  locale,
  customTranslations,
  th
}: ReportLogListProps) {
  if (filteredLogs.length === 0) {
    return (
      <div className="text-center py-12 text-[#9B8C83] text-xs font-mono">
        ⚠️ {translate(locale, 'report', 'NoDataSelectedRange', customTranslations)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Graphical bars representation */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-mono font-bold tracking-wider text-[#9B8C83] uppercase flex items-center gap-1.5">
          📊 {translate(locale, 'report', 'GraphicalDistribution', customTranslations)}
        </h4>
        <div className="flex flex-col gap-4">
          {projectChart.map(pc => {
            const widthPct = Math.min(100, Math.max(5, (pc.seconds / maxSec) * 100));
            return (
              <div key={pc.id} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full bg-${pc.color}-500`} />
                    {pc.name}
                  </span>
                  <span className="font-mono text-orange-450">{formatSeconds(pc.seconds)}</span>
                </div>
                <div className={`w-full h-3 rounded-full overflow-hidden relative ${theme === 'light' ? 'bg-[#EAE4DB]' : 'bg-[#FCFAF8]/5'
                  }`}>
                  <motion.div
                     initial={{ width: 0 }}
                     animate={{ width: `${widthPct}%` }}
                     transition={{ duration: 0.5 }}
                     className="h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full"
                  />
                </div>
                {pc.tasks.length > 0 && (
                  <div className="flex flex-col gap-1 mt-1 pl-4 border-l-2 border-white/10 dark:border-white/5">
                    {pc.tasks.map((tt: any) => (
                      <div key={tt.task!.id} className="flex justify-between items-center text-[10px] text-[#8A7A71] dark:text-[#9B8C83]">
                        <span className="truncate">{tt.task!.name}</span>
                        <span className="font-mono">{formatSeconds(tt.seconds)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Regular logs output */}
      <div className="flex flex-col gap-3 mt-4">
        <h4 className="text-xs font-mono font-bold tracking-wider text-[#9B8C83] uppercase">
          📋 {translate(locale, 'report', 'PlainDump', customTranslations)} ({displayLogs.length})
        </h4>
        <div className={`rounded-[1.5rem] border max-h-[250px] overflow-y-auto p-4 flex flex-col gap-2 ${theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB] shadow-inner' : 'bg-black/20 border-white/5'
          }`}>
          {displayLogs.map(log => {
            const p = projects.find(x => x.id === log.projectId);
            const t = tasks.find(x => x.id === log.taskId);
            const start = new Date(log.startTime).getTime();
            const end = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso).getTime();
            const durSeconds = Math.max(0, Math.floor((end - start) / 1000));

            return (
              <div
                key={log.id}
                className={`flex flex-col sm:flex-row justify-between sm:items-center gap-1 py-1.5 border-b last:border-0 text-xs ${theme === 'light' ? 'border-[#DFD7CB] text-[#5A4A42]' : 'border-white/5 text-slate-300'
                  }`}
              >
                <span className="truncate flex items-center gap-1">
                  <span className="font-mono text-indigo-400 text-[10px] shrink-0 font-bold">[{new Date(log.startTime).toLocaleTimeString()}]</span>
                  <strong className={`${theme === 'light' ? 'text-[#2C2421]' : 'text-slate-200'}`}>"{t?.name || 'N/A'}"</strong>
                  <span className={`${th.textMuted} text-[10px]`}>({p?.name})</span>
                </span>
                <span className="font-mono text-orange-400 shrink-0 self-end sm:self-auto font-bold">{formatSeconds(durSeconds)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
