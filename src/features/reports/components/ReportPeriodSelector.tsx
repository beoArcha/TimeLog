import React from 'react';
import { useTranslation } from '@common/i18n/translator';

interface ReportPeriodSelectorProps {
  reportPeriod: 'today' | 'week' | 'month' | 'all';
  setReportPeriod: (p: 'today' | 'week' | 'month' | 'all') => void;
  reportSort: 'date' | 'duration';
  setReportSort: (s: 'date' | 'duration') => void;
  theme: string;
}

export default function ReportPeriodSelector({
  reportPeriod,
  setReportPeriod,
  reportSort,
  setReportSort,
  theme,
}: ReportPeriodSelectorProps) {
  const { t: tReport } = useTranslation('report');
  const { t: tCommon } = useTranslation('common');

  return (
    <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB]' : 'bg-black/25 border-white/10'
      }`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-[#9B8C83]">{tCommon('Period')}</span>
        {(['today', 'week', 'month', 'all'] as const).map(p => (
          <button
            data-testid={`period-btn-${p}`}
            key={p}
            onClick={() => setReportPeriod(p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase transition-all cursor-pointer ${reportPeriod === p
              ? 'bg-orange-500 text-white'
              : 'bg-[#FCFAF8]/5 hover:bg-[#FCFAF8]/10 text-[#9B8C83]'
              }`}
          >
            {p === 'today' ? tCommon('Today') :
              p === 'week' ? tCommon('Week') :
                p === 'month' ? tCommon('Month') :
                  tCommon('All')}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-[#9B8C83]">{tReport('SortBy')}</span>
        <select
          data-testid="report-sort-select"
          value={reportSort}
          onChange={e => setReportSort(e.target.value as 'date' | 'duration')}
          className={`px-3 py-1.5 border rounded-xl text-xs focus:outline-none transition-all ${theme === 'light' ? 'bg-[#FCFAF8] text-[#2C2421] border-[#DFD7CB]' : 'bg-slate-900 border-white/10 text-white'
            }`}
        >
          <option value="duration">{tReport('DurationHighestFirst')}</option>
          <option value="date">{tReport('DateChronological')}</option>
        </select>
      </div>
    </div>
  );
}
