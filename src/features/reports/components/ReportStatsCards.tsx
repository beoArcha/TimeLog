import React from 'react';
import { useTranslation } from '@common/i18n/translator';
import { formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';

interface ReportStatsCardsProps {
  todaySec: number;
  weekSec: number;
  monthSec: number;
  theme: string;
}

export default function ReportStatsCards({
  todaySec,
  weekSec,
  monthSec,
  theme,
}: ReportStatsCardsProps) {
  const { t } = useTranslation('report');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className={`p-5 rounded-3xl border transition-all ${theme === 'light' ? 'bg-teal-50/30 border-teal-100 shadow-sm shadow-teal-50' : 'bg-[#FCFAF8]/5 border-white/10'
        }`}>
        <p className="text-[10px] font-mono tracking-wider text-[#9B8C83] uppercase">{t('TodayTotal')}</p>
        <p className={`text-2xl font-extrabold tracking-tight mt-1 font-mono ${theme === 'light' ? 'text-teal-700' : 'text-emerald-400'}`}>
          {formatSeconds(todaySec)}
        </p>
        <p className="text-[10px] text-[#8A7A71] mt-1">{t('LogsSumToday')}</p>
      </div>

      <div className={`p-5 rounded-3xl border transition-all ${theme === 'light' ? 'bg-orange-50/30 border-orange-150 shadow-sm shadow-orange-50' : 'bg-[#FCFAF8]/5 border-white/10'
        }`}>
        <p className="text-[10px] font-mono tracking-wider text-[#9B8C83] uppercase">{t('WeekTotal')}</p>
        <p className={`text-2xl font-extrabold tracking-tight mt-1 font-mono ${theme === 'light' ? 'text-orange-700' : 'text-orange-400'}`}>
          {formatSeconds(weekSec)}
        </p>
        <p className="text-[10px] text-[#8A7A71] mt-1">{t('FromMondayUntilNow')}</p>
      </div>

      <div className={`p-5 rounded-3xl border transition-all ${theme === 'light' ? 'bg-rose-50/30 border-rose-150 shadow-sm shadow-rose-50' : 'bg-[#FCFAF8]/5 border-white/10'
        }`}>
        <p className="text-[10px] font-mono tracking-wider text-[#9B8C83] uppercase">{t('MonthTotal')}</p>
        <p className={`text-2xl font-extrabold tracking-tight mt-1 font-mono ${theme === 'light' ? 'text-rose-700' : 'text-rose-450'}`}>
          {formatSeconds(monthSec)}
        </p>
        <p className="text-[10px] text-[#8A7A71] mt-1">{t('AccumulatedMonthSeconds')}</p>
      </div>
    </div>
  );
}
