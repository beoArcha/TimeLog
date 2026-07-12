import React from 'react';
import { GuiState } from '@layouts/hooks/useGuiLogic';
import { BarChart3 } from 'lucide-react';
import { translate } from '@common/i18n/i18n';
import { getThemeStyles } from '@/src/layouts/parts/GuiStyles';
import ReportStatsCards from './components/ReportStatsCards';
import ReportPeriodSelector from './components/ReportPeriodSelector';
import ReportLogList from './components/ReportLogList';

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

  let limitMs = 0;
  if (reportPeriod === 'today') {
    limitMs = startOfToday;
  } else if (reportPeriod === 'week') {
    limitMs = startOfWeek;
  } else if (reportPeriod === 'month') {
    limitMs = startOfMonth;
  }

  const filteredLogs = logs.filter(log => new Date(log.startTime).getTime() >= limitMs);
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

      <ReportStatsCards
        todaySec={todaySec}
        weekSec={weekSec}
        monthSec={monthSec}
        theme={theme}
        locale={locale}
        customTranslations={customTranslations}
      />

      <ReportPeriodSelector
        reportPeriod={reportPeriod}
        setReportPeriod={setReportPeriod}
        reportSort={reportSort}
        setReportSort={setReportSort}
        theme={theme}
        locale={locale}
        customTranslations={customTranslations}
      />

      <ReportLogList
        filteredLogs={filteredLogs}
        projectChart={projectChart}
        maxSec={maxSec}
        displayLogs={displayLogs}
        projects={projects}
        tasks={tasks}
        nowIso={nowIso}
        theme={theme}
        locale={locale}
        customTranslations={customTranslations}
        th={th}
      />
    </div>
  );
}
