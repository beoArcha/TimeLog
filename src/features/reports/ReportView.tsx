import React, { useState, useMemo } from 'react';
import { GuiState } from '@layouts/hooks/useGuiLogic';
import { BarChart3, Download } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Area } from '@components/ui/area';
import { Grid } from '@components/ui/grid';
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const { t } = useTranslation('report');

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const project of projects) {
      if (Array.isArray(project.tags)) {
        for (const rawTag of project.tags) {
          const trimmed = typeof rawTag === 'string' ? rawTag.trim() : '';
          if (trimmed.length > 0) {
            tagSet.add(trimmed);
          }
        }
      }
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClearTags = () => {
    setSelectedTags([]);
  };

  const effectiveSelectedProjectId = useMemo(() => {
    if (!selectedProjectId) return null;
    if (selectedTags.length === 0) return selectedProjectId;
    const project = projects.find((p) => p.id === selectedProjectId);
    const matches = project?.tags?.some((t) => selectedTags.includes(t));
    return matches ? selectedProjectId : null;
  }, [selectedProjectId, selectedTags, projects]);

  const {
    todaySec, weekSec, monthSec,
    periodTotalSec, dailyAverageSec, topProject,
    filteredLogs, projectChart, maxSec, displayLogs, clampedLogs,
    billingResult, billingError, isBillingLoading,
  } = useReportStatistics({
    logs, patches, projects, tasks, nowIso,
    reportPeriod, reportSort, sysSettings,
    customFrom, customTo,
    selectedProjectId: effectiveSelectedProjectId,
    selectedTags,
  });

  const matchingTagProjectIds = useMemo(() => {
    if (selectedTags.length === 0) return null;
    return projects
      .filter((p) => Array.isArray(p.tags) && p.tags.some((t) => selectedTags.includes(t)))
      .map((p) => p.id);
  }, [projects, selectedTags]);

  const effectiveBillingProjectId = useMemo(() => {
    if (effectiveSelectedProjectId) return effectiveSelectedProjectId;
    if (matchingTagProjectIds === null) return null;
    if (matchingTagProjectIds.length === 1) return matchingTagProjectIds[0];
    if (matchingTagProjectIds.length === 0) return '__no_matching_project__';
    return null;
  }, [effectiveSelectedProjectId, matchingTagProjectIds]);

  const effectiveDisplayLogs = useMemo(() => {
    if (!effectiveSelectedProjectId) return displayLogs;
    return displayLogs.filter((log) => log.projectId === effectiveSelectedProjectId);
  }, [displayLogs, effectiveSelectedProjectId]);

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

    const effectiveTotalSeconds = rows.reduce((acc, row) => acc + row.durationSeconds, 0);

    const projectBreakdown = selectedProjectId
      ? projectChart
          .filter((pc) => pc.id === selectedProjectId)
          .map((pc) => ({
            projectName: pc.name,
            seconds: effectiveTotalSeconds,
            percentage: 100,
          }))
      : projectChart.map((pc) => ({
          projectName: pc.name,
          seconds: pc.seconds,
          percentage: effectiveTotalSeconds > 0 ? (pc.seconds / effectiveTotalSeconds) * 100 : 0,
        }));

    return {
      title: t('TimeSummariesReports'),
      period: reportPeriod,
      generatedAt: new Date().toISOString(),
      totalSeconds: effectiveTotalSeconds,
      formattedTotalDuration: formatSeconds(effectiveTotalSeconds),
      rows,
      projectBreakdown,
    };
  }, [effectiveDisplayLogs, tasks, projects, nowIso, t, reportPeriod, selectedProjectId, projectChart]);

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
        billingResult={billingResult}
        billingError={billingError}
        isBillingLoading={isBillingLoading}
      />

      <ReportBillingCard
        reportPeriod={reportPeriod}
        customFrom={customFrom}
        customTo={customTo}
        nowIso={nowIso}
        selectedProjectId={effectiveBillingProjectId}
        sysSettings={sysSettings}
        billingResult={billingResult}
        billingError={billingError}
        isLoading={isBillingLoading}
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
        availableTags={availableTags}
        selectedTags={selectedTags}
        onToggleTag={handleToggleTag}
        onClearTags={handleClearTags}
      />

      <Grid cols={1} gap="xl" className="lg:grid-cols-2">
        <StackedBarActivityChart
          clampedLogs={clampedLogs}
          projects={projects}
          tasks={tasks}
        />
        <ProjectDonutChart
          projectChart={projectChart}
          selectedProjectId={effectiveSelectedProjectId}
          onSelectProject={setSelectedProjectId}
        />
      </Grid>

      <ReportLogList
        filteredLogs={filteredLogs}
        projectChart={projectChart}
        maxSec={maxSec}
        displayLogs={effectiveDisplayLogs}
        projects={projects}
        tasks={tasks}
        nowIso={nowIso}
        logs={logs}
        activeTimerLogId={state.activeLog?.id}
      />

      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        payload={exportPayload}
      />
    </Area>
  );
}
