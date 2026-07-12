import React from 'react';
import { translate } from '@common/i18n/i18n';
import { Locale } from '@bindings/Locale';

interface ReportPeriodSelectorProps {
  reportPeriod: 'today' | 'week' | 'month' | 'all';
  setReportPeriod: (p: 'today' | 'week' | 'month' | 'all') => void;
  reportSort: 'date' | 'duration';
  setReportSort: (s: 'date' | 'duration') => void;
  theme: string;
  locale: Locale;
  customTranslations: any;
}

export default function ReportPeriodSelector({
  reportPeriod,
  setReportPeriod,
  reportSort,
  setReportSort,
  theme,
  locale,
  customTranslations
}: ReportPeriodSelectorProps) {
  return (
    <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB]' : 'bg-black/25 border-white/10'
      }`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-[#9B8C83]">{translate(locale, 'dynamic.period', customTranslations)}</span>
        {(['today', 'week', 'month', 'all'] as const).map(p => (
          <button
            key={p}
            onClick={() => setReportPeriod(p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase transition-all cursor-pointer ${reportPeriod === p
              ? 'bg-orange-500 text-white'
              : 'bg-[#FCFAF8]/5 hover:bg-[#FCFAF8]/10 text-[#9B8C83]'
              }`}
          >
            {p === 'today' ? (translate(locale, 'dynamic.today', customTranslations)) :
              p === 'week' ? (translate(locale, 'dynamic.week', customTranslations)) :
                p === 'month' ? (translate(locale, 'dynamic.month', customTranslations)) :
                  (translate(locale, 'dynamic.all', customTranslations))}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-[#9B8C83]">{translate(locale, 'dynamic.sortBy', customTranslations)}</span>
        <select
          value={reportSort}
          onChange={e => setReportSort(e.target.value as 'date' | 'duration')}
          className={`px-3 py-1.5 border rounded-xl text-xs focus:outline-none transition-all ${theme === 'light' ? 'bg-[#FCFAF8] text-[#2C2421] border-[#DFD7CB]' : 'bg-slate-900 border-white/10 text-white'
            }`}
        >
          <option value="duration">{translate(locale, 'dynamic.durationHighestFirst', customTranslations)}</option>
          <option value="date">{translate(locale, 'dynamic.dateChronological', customTranslations)}</option>
        </select>
      </div>
    </div>
  );
}
