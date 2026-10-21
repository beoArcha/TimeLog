import React from 'react';
import { TrendingUp, Clock, BarChart3, Award, Calendar } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { StatCard } from '@components/StatCard';
import { useTranslation } from '@common/i18n/translator';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { ReportTopProject } from '../types';

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

  const activePeriodMetrics = [
    {
      testId: 'report-stat-total',
      title: t('PeriodTotal'),
      value: formatSeconds(periodTotalSec ?? 0),
      description: t('SelectedPeriodTotalDesc'),
      icon: Clock,
    },
    {
      testId: 'report-stat-avg',
      title: t('DailyAverage'),
      value: formatSeconds(dailyAverageSec ?? 0),
      description: t('DailyAverageDesc'),
      icon: BarChart3,
    },
    {
      testId: 'report-stat-top',
      title: t('TopProject'),
      value: topProject ? `${topProject.name} (${topProject.percentage.toFixed(0)}%)` : '-',
      description: topProject ? formatSeconds(topProject.seconds) : undefined,
      icon: Award,
    },
  ];

  const baselineMetrics = [
    {
      testId: 'report-stat-today',
      title: t('TodayTotal'),
      value: formatSeconds(todaySec),
      description: t('LogsSumToday'),
      icon: Clock,
    },
    {
      testId: 'report-stat-week',
      title: t('WeekTotal'),
      value: formatSeconds(weekSec),
      description: t('FromMondayUntilNow'),
      icon: Calendar,
    },
    {
      testId: 'report-stat-month',
      title: t('MonthTotal'),
      value: formatSeconds(monthSec),
      description: t('AccumulatedMonthSeconds'),
      icon: Calendar,
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
            <StatCard
              key={metric.testId}
              testId={metric.testId}
              title={metric.title}
              value={metric.value}
              description={metric.description}
              icon={metric.icon}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {baselineMetrics.map((metric) => (
          <StatCard
            key={metric.testId}
            testId={metric.testId}
            title={metric.title}
            value={metric.value}
            description={metric.description}
            icon={metric.icon}
          />
        ))}
      </div>
    </CollapsibleCard>
  );
}

