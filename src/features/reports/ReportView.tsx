import React from 'react';
import { GuiState } from '@layouts/hooks/useGuiLogic';
import { BarChart3 } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import ReportStatsCards from './components/ReportStatsCards';
import ReportPeriodSelector from './components/ReportPeriodSelector';
import ReportLogList from './components/ReportLogList';

import { useReportStatistics } from './hooks/useReportStatistics';

export default function ReportView({ state }: { state: GuiState }) {
  const {
    projects, tasks, logs, nowIso, theme,
    reportPeriod, setReportPeriod, reportSort, setReportSort,
    sysSettings, patches
  } = state;

  const { t } = useTranslation('report');
  const { todaySec, weekSec, monthSec, filteredLogs, projectChart, maxSec, displayLogs } = useReportStatistics({
    logs, patches, projects, tasks, nowIso, reportPeriod, reportSort, sysSettings
  });

  return (
    <div id="reports-panel" className={`backdrop-blur-md rounded-[2.5rem] p-8 border shadow-2xl flex flex-col gap-6 transition-all duration-300 ${theme === 'light'
      ? 'bg-[#FCFAF8] border-[#DFD7CB] shadow-[#DFD7CB]'
      : theme === 'high-contrast'
        ? 'bg-black border-2 border-white'
        : 'bg-[#FCFAF8]/5 border-white/10'
      }`}>
      <div>
        <span className="text-[10px] font-mono tracking-wider bg-orange-500/20 text-orange-500 dark:text-orange-300 px-3 py-1 rounded-full font-bold uppercase border border-orange-500/25">
          {t('SqlAnalyticsEngine')}
        </span>
        <h2 className={`font-sans font-bold text-2xl mt-1.5 flex items-center gap-2 ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'
          }`}>
          <BarChart3 className="w-6 h-6 text-orange-400" />
          {t('TimeSummariesReports')}
        </h2>
      </div>

      <ReportStatsCards
        todaySec={todaySec}
        weekSec={weekSec}
        monthSec={monthSec}
        theme={theme}
      />

      <ReportPeriodSelector
        reportPeriod={reportPeriod}
        setReportPeriod={setReportPeriod}
        reportSort={reportSort}
        setReportSort={setReportSort}
        theme={theme}
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
      />
    </div>
  );
}
