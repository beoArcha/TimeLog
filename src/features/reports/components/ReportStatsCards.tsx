import React from 'react';
import { TrendingUp } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { useTranslation } from '@common/i18n/translator';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { ReportTopProject } from '../types';
import ReportMetricCard, { ReportMetricCardProps } from './ReportMetricCard';

export interface ReportStatsCardsProps {
  todaySec?: number;
  weekSec?: number;
  monthSec?: number;
  periodTotalSec?: number;
  dailyAverageSec?: number;
  topProject?: ReportTopProject | null;
}

export default function ReportStatsCards({
  todaySec = 0,
  weekSec = 0,
  monthSec = 0,
  periodTotalSec,
  dailyAverageSec,
  topProject,
}: ReportStatsCardsProps) {
  const { t } = useTranslation('report');

  const showActivePeriodStats = periodTotalSec !== undefined;

  const activePeriodMetrics: ReportMetricCardProps[] = [
    {
      testId: 'report-stat-total',
      label: t('PeriodTotal'),
      value: formatSeconds(periodTotalSec ?? 0),
      description: t('SelectedPeriodTotalDesc'),
      valueClassName: 'font-mono text-orange-600 dark:text-orange-400',
    },
    {
      testId: 'report-stat-avg',
      label: t('DailyAverage'),
      value: formatSeconds(dailyAverageSec ?? 0),
      description: t('DailyAverageDesc'),
      valueClassName: 'font-mono text-emerald-600 dark:text-emerald-400',
    },
    {
      testId: 'report-stat-top',
      label: t('TopProject'),
      value: topProject ? `${topProject.name} (${topProject.percentage.toFixed(0)}%)` : '-',
      description: topProject ? formatSeconds(topProject.seconds) : '',
      valueClassName: 'font-sans truncate text-foreground',
    },
  ];

  const baselineMetrics: ReportMetricCardProps[] = [
    {
      testId: 'report-stat-today',
      label: t('TodayTotal'),
      value: formatSeconds(todaySec),
      description: t('LogsSumToday'),
      valueClassName: 'font-mono text-emerald-600 dark:text-emerald-400',
    },
    {
      testId: 'report-stat-week',
      label: t('WeekTotal'),
      value: formatSeconds(weekSec),
      description: t('FromMondayUntilNow'),
      valueClassName: 'font-mono text-orange-600 dark:text-orange-400',
    },
    {
      testId: 'report-stat-month',
      label: t('MonthTotal'),
      value: formatSeconds(monthSec),
      description: t('AccumulatedMonthSeconds'),
      valueClassName: 'font-mono text-rose-600 dark:text-rose-450',
    },
  ];

  return (
    <CollapsibleCard
      title={t('PeriodReport')}
      icon={TrendingUp}
      iconColor="text-orange-400"
      defaultExpanded={true}
      headerTestId="report-stats-collapsible-header"
      contentClassName="flex flex-col gap-4 mt-2"
    >
      {showActivePeriodStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activePeriodMetrics.map((metric) => (
            <ReportMetricCard
              key={metric.testId}
              testId={metric.testId}
              label={metric.label}
              value={metric.value}
              description={metric.description}
              valueClassName={metric.valueClassName}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {baselineMetrics.map((metric) => (
          <ReportMetricCard
            key={metric.testId}
            testId={metric.testId}
            label={metric.label}
            value={metric.value}
            description={metric.description}
            valueClassName={metric.valueClassName}
          />
        ))}
      </div>
    </CollapsibleCard>
  );
}
