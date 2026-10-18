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
    projects, tasks, logs, nowIso,
    reportPeriod, setReportPeriod, reportSort, setReportSort,
    customFrom, setCustomFrom, customTo, setCustomTo,
    sysSettings, patches
  } = state;

  const { t } = useTranslation('report');
  const {
    todaySec, weekSec, monthSec,
    periodTotalSec, dailyAverageSec, topProject,
    filteredLogs, projectChart, maxSec, displayLogs
  } = useReportStatistics({
    logs, patches, projects, tasks, nowIso,
    reportPeriod, reportSort, sysSettings,
    customFrom, customTo
  });

  return (
    <div id="reports-panel" className="backdrop-blur-md rounded-[2.5rem] p-8 border border-border bg-card text-foreground shadow-2xl flex flex-col gap-6 transition-all duration-300">
      <div>
        <span className="text-[10px] font-mono tracking-wider bg-orange-500/20 text-orange-500 dark:text-orange-300 px-3 py-1 rounded-full font-bold uppercase border border-orange-500/25">
          {t('SqlAnalyticsEngine')}
        </span>
        <h2 className="font-sans font-bold text-2xl mt-1.5 flex items-center gap-2 text-foreground">
          <BarChart3 className="w-6 h-6 text-orange-400" />
          {t('TimeSummariesReports')}
        </h2>
      </div>

      <ReportStatsCards
        todaySec={todaySec}
        weekSec={weekSec}
        monthSec={monthSec}
        periodTotalSec={periodTotalSec}
        dailyAverageSec={dailyAverageSec}
        topProject={topProject}
      />

      <ReportPeriodSelector
        reportPeriod={reportPeriod}
        setReportPeriod={setReportPeriod}
        reportSort={reportSort}
        setReportSort={setReportSort}
        customFrom={customFrom}
        setCustomFrom={setCustomFrom}
        customTo={customTo}
        setCustomTo={setCustomTo}
      />

      <ReportLogList
        filteredLogs={filteredLogs}
        projectChart={projectChart}
        maxSec={maxSec}
        displayLogs={displayLogs}
        projects={projects}
        tasks={tasks}
        nowIso={nowIso}
      />
    </div>
  );
}
