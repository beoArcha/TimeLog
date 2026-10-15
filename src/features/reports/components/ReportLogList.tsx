import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from '@common/i18n/translator';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { TimeLog } from '@bindings/TimeLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { ProjectChartItem } from '../types';

interface ReportLogListProps {
  filteredLogs: TimeLog[];
  projectChart: ProjectChartItem[];
  maxSec: number;
  displayLogs: TimeLog[];
  projects: Project[];
  tasks: Task[];
  nowIso?: string;
}

export default function ReportLogList({
  filteredLogs,
  projectChart,
  maxSec,
  displayLogs,
  projects,
  tasks,
  nowIso,
}: ReportLogListProps) {
  const { t } = useTranslation('report');

  if (filteredLogs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-xs font-mono">
        ⚠️ {t('NoDataSelectedRange')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
          📊 {t('GraphicalDistribution')}
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
                  <span className="font-mono text-orange-500">{formatSeconds(pc.seconds)}</span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden relative bg-muted">
                  <motion.div
                     initial={{ width: 0 }}
                     animate={{ width: `${widthPct}%` }}
                     transition={{ duration: 0.5 }}
                     className="h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full"
                  />
                </div>
                {pc.tasks.length > 0 && (
                  <div className="flex flex-col gap-1 mt-1 pl-4 border-l-2 border-border/50">
                    {pc.tasks.map((tt) => (
                      <div key={tt.task?.id || Math.random()} className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span className="truncate">{tt.task?.name || 'N/A'}</span>
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

      <div className="flex flex-col gap-3 mt-4">
        <h4 className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase">
          📋 {t('PlainDump')} ({displayLogs.length})
        </h4>
        <div className="rounded-[1.5rem] border border-border bg-muted/30 max-h-[250px] overflow-y-auto p-4 flex flex-col gap-2">
          {displayLogs.map(log => {
            const p = projects.find(x => x.id === log.projectId);
            const tObj = tasks.find(x => x.id === log.taskId);
            const start = new Date(log.startTime).getTime();
            const end = log.endTime ? new Date(log.endTime).getTime() : (nowIso ? new Date(nowIso).getTime() : start);
            const durSeconds = Math.max(0, Math.floor((end - start) / 1000));

            return (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 py-1.5 border-b border-border/50 last:border-0 text-xs text-foreground"
              >
                <span className="truncate flex items-center gap-1">
                  <span className="font-mono text-indigo-400 text-[10px] shrink-0 font-bold">[{new Date(log.startTime).toLocaleTimeString()}]</span>
                  <strong className="text-foreground">"{tObj?.name || 'N/A'}"</strong>
                  <span className="text-muted-foreground text-[10px]">({p?.name})</span>
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
