import React from 'react';
import { GuiState } from '../useGuiLogic';
import { BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { translate } from '@common/i18n/i18n';
import { formatSeconds } from '@features/timelogs/utils/timelogUtils';
import { getThemeStyles } from './guiStyles';

export default function ReportView({ state }: { state: GuiState }) {
  const {
    projects, tasks, logs, nowIso, locale, customTranslations, theme,
    reportPeriod, setReportPeriod, reportSort, setReportSort,
    sysSettings, patches
  } = state;

  const th = getThemeStyles(theme);

  const now = new Date(nowIso);
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);

  const dWeek = new Date(now);
  const wDay = dWeek.getDay();
  const diffToMonday = dWeek.getDate() - wDay + (wDay === 0 ? -6 : 1);
  const startOfWeek = new Date(dWeek.setDate(diffToMonday)).setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const getSumSeconds = (timeLimitMs: number) => {
    let sum = logs.reduce((acc, log) => {
      const logStart = new Date(log.startTime).getTime();
      if (logStart >= timeLimitMs) {
        const logEnd = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso).getTime();
        return acc + Math.max(0, Math.floor((logEnd - logStart) / 1000));
      }
      return acc;
    }, 0);

    if (sysSettings?.includePatchesInReports) {
      sum += patches.reduce((acc, p) => {
        const pStart = new Date(p.startTime).getTime();
        if (pStart >= timeLimitMs) {
          const pEnd = p.endTime ? new Date(p.endTime).getTime() : new Date(nowIso).getTime();
          return acc + Math.max(0, Math.floor((pEnd - pStart) / 1000));
        }
        return acc;
      }, 0);
    }

    return sum;
  };

  const todaySec = getSumSeconds(startOfToday);
  const weekSec = getSumSeconds(startOfWeek);
  const monthSec = getSumSeconds(startOfMonth);

  // Filtered logs
  let limitMs = 0;
  if (reportPeriod === 'today') {
    limitMs = startOfToday;
  } else if (reportPeriod === 'week') {
    limitMs = startOfWeek;
  } else if (reportPeriod === 'month') {
    limitMs = startOfMonth;
  }

  const filteredLogs = logs.filter(log => {
    const logTime = new Date(log.startTime).getTime();
    return logTime >= limitMs;
  });

  // Compute duration per project and task breakdown
  const projectTimeData: Record<string, { seconds: number; tasks: Record<string, number> }> = {};

  const combinedLogs = sysSettings?.includePatchesInReports ? [...filteredLogs, ...patches.filter(p => new Date(p.startTime).getTime() >= limitMs)] : filteredLogs;

  combinedLogs.forEach(log => {
    const start = new Date(log.startTime).getTime();
    const end = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso).getTime();
    const duration = Math.max(0, Math.floor((end - start) / 1000));

    if (!projectTimeData[log.projectId]) {
      projectTimeData[log.projectId] = { seconds: 0, tasks: {} };
    }
    projectTimeData[log.projectId].seconds += duration;

    if (log.taskId) {
      projectTimeData[log.projectId].tasks[log.taskId] = (projectTimeData[log.projectId].tasks[log.taskId] || 0) + duration;
    }
  });

  // Projects charts data
  const projectChart = Object.entries(projectTimeData).map(([pId, data]) => {
    const p = projects.find(x => x.id === pId);
    const taskBreakdown = Object.entries(data.tasks).map(([tId, sec]) => {
      return { task: tasks.find(t => t.id === tId), seconds: sec };
    }).filter(t => t.task).sort((a, b) => b.seconds - a.seconds);
    return { id: pId, name: p?.name || `Project ${pId}`, color: p?.color || 'violet', seconds: data.seconds, tasks: taskBreakdown };
  });

  if (reportSort === 'duration') {
    projectChart.sort((a, b) => b.seconds - a.seconds);
  } else {
    projectChart.sort((a, b) => a.name.localeCompare(b.name));
  }

  const maxSec = Math.max(...projectChart.map(x => x.seconds), 1);

  // Sort individual logs
  const displayLogs = [...filteredLogs];
  if (reportSort === 'date') {
    displayLogs.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  } else {
    displayLogs.sort((a, b) => {
      const endA = a.endTime ? new Date(a.endTime).getTime() : new Date(nowIso).getTime();
      const endB = b.endTime ? new Date(b.endTime).getTime() : new Date(nowIso).getTime();
      return (endB - new Date(b.startTime).getTime()) - (endA - new Date(a.startTime).getTime());
    });
  }

  return (
    <div id="reports-panel" className={`backdrop-blur-md rounded-[2.5rem] p-8 border shadow-2xl flex flex-col gap-6 transition-all duration-300 ${theme === 'light'
      ? 'bg-[#FCFAF8] border-[#DFD7CB] shadow-[#DFD7CB]'
      : theme === 'high-contrast'
        ? 'bg-black border-2 border-white'
        : 'bg-[#FCFAF8]/5 border-white/10'
      }`}>
      <div>
        <span className="text-[10px] font-mono tracking-wider bg-orange-500/20 text-orange-500 dark:text-orange-300 px-3 py-1 rounded-full font-bold uppercase border border-orange-500/25">
          {translate(locale, 'dynamic.sQLAnalyticsEngine', customTranslations)}
        </span>
        <h2 className={`font-sans font-bold text-2xl mt-1.5 flex items-center gap-2 ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'
          }`}>
          <BarChart3 className="w-6 h-6 text-orange-400" />
          {translate(locale, 'dynamic.timeSummariesReports', customTranslations)}
        </h2>
      </div>

      {/* Quick Aggregates Grid - Today, Week, Month */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-5 rounded-3xl border transition-all ${theme === 'light' ? 'bg-teal-50/30 border-teal-100 shadow-sm shadow-teal-50' : 'bg-[#FCFAF8]/5 border-white/10'
          }`}>
          <p className="text-[10px] font-mono tracking-wider text-[#9B8C83] uppercase">{translate(locale, 'dynamic.tODAYTOTAL', customTranslations)}</p>
          <p className={`text-2xl font-extrabold tracking-tight mt-1 font-mono ${theme === 'light' ? 'text-teal-700' : 'text-emerald-400'}`}>
            {formatSeconds(todaySec)}
          </p>
          <p className="text-[10px] text-[#8A7A71] mt-1">{translate(locale, 'dynamic.sQLiteLogsSumForToday', customTranslations)}</p>
        </div>

        <div className={`p-5 rounded-3xl border transition-all ${theme === 'light' ? 'bg-orange-50/30 border-orange-150 shadow-sm shadow-orange-50' : 'bg-[#FCFAF8]/5 border-white/10'
          }`}>
          <p className="text-[10px] font-mono tracking-wider text-[#9B8C83] uppercase">{translate(locale, 'dynamic.wEEKTOTAL', customTranslations)}</p>
          <p className={`text-2xl font-extrabold tracking-tight mt-1 font-mono ${theme === 'light' ? 'text-orange-700' : 'text-orange-400'}`}>
            {formatSeconds(weekSec)}
          </p>
          <p className="text-[10px] text-[#8A7A71] mt-1">{translate(locale, 'dynamic.fromMondayUntilNow', customTranslations)}</p>
        </div>

        <div className={`p-5 rounded-3xl border transition-all ${theme === 'light' ? 'bg-rose-50/30 border-rose-150 shadow-sm shadow-rose-50' : 'bg-[#FCFAF8]/5 border-white/10'
          }`}>
          <p className="text-[10px] font-mono tracking-wider text-[#9B8C83] uppercase">{translate(locale, 'dynamic.mONTHTOTAL', customTranslations)}</p>
          <p className={`text-2xl font-extrabold tracking-tight mt-1 font-mono ${theme === 'light' ? 'text-rose-700' : 'text-rose-450'}`}>
            {formatSeconds(monthSec)}
          </p>
          <p className="text-[10px] text-[#8A7A71] mt-1">{translate(locale, 'dynamic.accumulatedMonthSeconds', customTranslations)}</p>
        </div>
      </div>

      {/* Filter controls */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB]' : 'bg-black/25 border-white/10'
        }`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-[#9B8C83]">{translate(locale, 'dynamic.period', customTranslations)}</span>
          {(['today', 'week', 'month', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setReportPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase transition-all cursor-pointer ${reportPeriod === p
                ? 'bg-orange-500 text-white'
                : 'bg-[#FCFAF8]/5 hover:bg-[#FCFAF8]/10 text-[#9B8C83]'
                }`}
            >
              {p === 'today' ? (translate(locale, 'dynamic.today', customTranslations)) :
                p === 'week' ? (translate(locale, 'dynamic.week', customTranslations)) :
                  p === 'month' ? (translate(locale, 'dynamic.month', customTranslations)) :
                    (translate(locale, 'dynamic.all', customTranslations))}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#9B8C83]">{translate(locale, 'dynamic.sortBy', customTranslations)}</span>
          <select
            value={reportSort}
            onChange={e => setReportSort(e.target.value as 'date' | 'duration')}
            className={`px-3 py-1.5 border rounded-xl text-xs focus:outline-none transition-all ${theme === 'light' ? 'bg-[#FCFAF8] text-[#2C2421] border-[#DFD7CB]' : 'bg-slate-900 border-white/10 text-white'
              }`}
          >
            <option value="duration">{translate(locale, 'dynamic.durationHighestFirst', customTranslations)}</option>
            <option value="date">{translate(locale, 'dynamic.dateChronological', customTranslations)}</option>
          </select>
        </div>
      </div>

      {/* Filtered logs lists and visual progress bars */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-12 text-[#9B8C83] text-xs font-mono">
          ⚠️ {translate(locale, 'dynamic.noDataInSqliteLogsForTheSelect', customTranslations)}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Graphical bars representation */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-mono font-bold tracking-wider text-[#9B8C83] uppercase flex items-center gap-1.5">
              📊 {translate(locale, 'dynamic.gRAPHICALPROJECTTIMEDISTRIBUTI', customTranslations)}
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
                        className={`h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full`}
                      />
                    </div>
                    {pc.tasks.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1 pl-4 border-l-2 border-white/10 dark:border-white/5">
                        {pc.tasks.map(tt => (
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
              📋 {translate(locale, 'dynamic.pLAINSQLITELOGSDUMP', customTranslations)} ({displayLogs.length})
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
      )}
    </div>
  );
}
