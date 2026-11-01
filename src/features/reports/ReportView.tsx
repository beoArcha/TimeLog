import React, { useState, useMemo } from 'react';
import { GuiState } from '@layouts/hooks/useGuiLogic';
import { BarChart3, Download } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Area } from '@components/ui/area';
import { ViewHeader } from '@components/ViewHeader';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';
import { ExportPayload, ExportDataRow } from '@plugins/contracts/IExporterPlugin';
import ReportStatsCards from './components/ReportStatsCards';
import ReportBillingCard from './components/ReportBillingCard';
import ReportPeriodSelector from './components/ReportPeriodSelector';
import StackedBarActivityChart from './components/StackedBarActivityChart';
import ProjectDonutChart from './components/ProjectDonutChart';
import ReportLogList from './components/ReportLogList';
import ReportExportModal from './components/ReportExportModal';
import { useReportStatistics } from './hooks/useReportStatistics';

export default function ReportView({ state }: { state: GuiState }) {
  const {
    projects, tasks, logs, nowIso,
    reportPeriod, setReportPeriod, reportSort, setReportSort,
    customFrom, setCustomFrom, customTo, setCustomTo,
    sysSettings, patches
  } = state;

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const { t } = useTranslation('report');
  const {
    todaySec, weekSec, monthSec,
    periodTotalSec, dailyAverageSec, topProject,
    filteredLogs, projectChart, maxSec, displayLogs, clampedLogs
  } = useReportStatistics({
    logs, patches, projects, tasks, nowIso,
    reportPeriod, reportSort, sysSettings,
    customFrom, customTo
  });

  const effectiveDisplayLogs = useMemo(() => {
    if (!selectedProjectId) return displayLogs;
    return displayLogs.filter((log) => log.projectId === selectedProjectId);
  }, [displayLogs, selectedProjectId]);

  const exportPayload: ExportPayload = useMemo(() => {
    const rows: ExportDataRow[] = effectiveDisplayLogs.map((log) => {
      const task = tasks.find((t) => t.id === log.taskId);
      const projId = (log as ClampedTimeLog).projectId || task?.projectId;
      const project = projects.find((p) => p.id === projId);

      const isClamped = 'clampedDurationSeconds' in log;
      let durationSeconds: number;
      let start = log.startTime;
      let end = log.endTime || 'Running';

      if (isClamped) {
        const clamped = log as ClampedTimeLog;
        durationSeconds = clamped.clampedDurationSeconds;
        start = clamped.clampedStartTime || clamped.startTime;
        end = clamped.clampedEndTime || clamped.endTime || 'Running';
      } else {
        const s = new Date(log.startTime).getTime();
        const fallbackEnd = nowIso ? new Date(nowIso).getTime() : s;
        const e = log.endTime ? new Date(log.endTime).getTime() : fallbackEnd;
        durationSeconds = Math.max(0, Math.floor((e - s) / 1000));
      }
      const date = start.substring(0, 10);

      return {
        id: log.id,
        date,
        projectName: project?.name || 'Unknown',
        taskName: task?.name || 'Unknown',
        startTime: start,
        endTime: end,
        durationSeconds,
        formattedDuration: formatSeconds(durationSeconds),
        note: log.note || undefined,
      };
    });

    return {
      title: t('TimeSummariesReports'),
      period: reportPeriod,
      generatedAt: new Date().toISOString(),
      totalSeconds: periodTotalSec,
      formattedTotalDuration: formatSeconds(periodTotalSec),
      rows,
      projectBreakdown: projectChart.map((pc) => ({
        projectName: pc.name,
        seconds: pc.seconds,
        percentage: periodTotalSec > 0 ? (pc.seconds / periodTotalSec) * 100 : 0,
      })),
    };
  }, [effectiveDisplayLogs, tasks, projects, nowIso, t, reportPeriod, periodTotalSec, projectChart]);

  return (
    <Area as="main" id="reports-panel" variant="card" padding="section" radius="3xl" elevation="2xl" className="backdrop-blur-md flex flex-col gap-6 transition-all duration-300">
      <ViewHeader
        badge={
          <Badge variant="orange" size="sm" className="font-mono tracking-wider uppercase">
            {t('SqlAnalyticsEngine')}
          </Badge>
        }
        title={t('TimeSummariesReports')}
        icon={BarChart3}
        iconColor="text-primary"
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="report-export-button"
            onClick={() => setIsExportModalOpen(true)}
            className="gap-2 self-start sm:self-auto rounded-xl"
          >
            <Download className="w-4 h-4 text-primary" />
            {t('Export')}
          </Button>
        }
      />

      <ReportStatsCards
        todaySec={todaySec}
        weekSec={weekSec}
        monthSec={monthSec}
        periodTotalSec={periodTotalSec}
        dailyAverageSec={dailyAverageSec}
        topProject={topProject}
      />

      <ReportBillingCard
        reportPeriod={reportPeriod}
        customFrom={customFrom}
        customTo={customTo}
        nowIso={nowIso}
        selectedProjectId={selectedProjectId}
        sysSettings={sysSettings}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StackedBarActivityChart
          clampedLogs={clampedLogs}
          projects={projects}
          tasks={tasks}
        />
        <ProjectDonutChart
          projectChart={projectChart}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
        />
      </div>

      <ReportLogList
        filteredLogs={filteredLogs}
        projectChart={projectChart}
        maxSec={maxSec}
        displayLogs={effectiveDisplayLogs}
        projects={projects}
        tasks={tasks}
        nowIso={nowIso}
      />

      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        payload={exportPayload}
      />
    </Area>
  );
}
