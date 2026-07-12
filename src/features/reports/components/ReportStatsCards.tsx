import React from 'react';
import { translate } from '@common/i18n/i18n';
import { formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { Locale } from '@bindings/Locale';

interface ReportStatsCardsProps {
  todaySec: number;
  weekSec: number;
  monthSec: number;
  theme: string;
  locale: Locale;
  customTranslations: any;
}

export default function ReportStatsCards({
  todaySec,
  weekSec,
  monthSec,
  theme,
  locale,
  customTranslations
}: ReportStatsCardsProps) {
  return (
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
  );
}
