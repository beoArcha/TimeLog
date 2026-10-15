import React from 'react';
import { useTranslation } from '@common/i18n/translator';
import { formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';

interface ReportStatsCardsProps {
  todaySec: number;
  weekSec: number;
  monthSec: number;
}

export default function ReportStatsCards({
  todaySec,
  weekSec,
  monthSec,
}: ReportStatsCardsProps) {
  const { t } = useTranslation('report');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-5 rounded-3xl border border-border bg-card shadow-xs transition-all">
        <p className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">{t('TodayTotal')}</p>
        <p className="text-2xl font-extrabold tracking-tight mt-1 font-mono text-emerald-600 dark:text-emerald-400">
          {formatSeconds(todaySec)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">{t('LogsSumToday')}</p>
      </div>

      <div className="p-5 rounded-3xl border border-border bg-card shadow-xs transition-all">
        <p className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">{t('WeekTotal')}</p>
        <p className="text-2xl font-extrabold tracking-tight mt-1 font-mono text-orange-600 dark:text-orange-400">
          {formatSeconds(weekSec)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">{t('FromMondayUntilNow')}</p>
      </div>

      <div className="p-5 rounded-3xl border border-border bg-card shadow-xs transition-all">
        <p className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">{t('MonthTotal')}</p>
        <p className="text-2xl font-extrabold tracking-tight mt-1 font-mono text-rose-600 dark:text-rose-450">
          {formatSeconds(monthSec)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">{t('AccumulatedMonthSeconds')}</p>
      </div>
    </div>
  );
}
