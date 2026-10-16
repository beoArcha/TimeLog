import React from 'react';
import { useTranslation } from '@common/i18n/translator';
import { Button } from '@components/ui/button';
import { NativeSelect } from '@components/ui/select';

interface ReportPeriodSelectorProps {
  reportPeriod: 'today' | 'week' | 'month' | 'all';
  setReportPeriod: (p: 'today' | 'week' | 'month' | 'all') => void;
  reportSort: 'date' | 'duration';
  setReportSort: (s: 'date' | 'duration') => void;
}

export default function ReportPeriodSelector({
  reportPeriod,
  setReportPeriod,
  reportSort,
  setReportSort,
}: ReportPeriodSelectorProps) {
  const { t: tReport } = useTranslation('report');
  const { t: tCommon } = useTranslation('common');

  return (
    <div className="p-4 rounded-2xl border border-border bg-muted/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">{tCommon('Period')}</span>
        {(['today', 'week', 'month', 'all'] as const).map(p => (
          <Button
            data-testid={`period-btn-${p}`}
            aria-pressed={reportPeriod === p}
            key={p}
            variant={reportPeriod === p ? 'accent' : 'ghost'}
            size="xs"
            onClick={() => setReportPeriod(p)}
            className="px-3 py-1.5 h-auto rounded-xl text-xs font-semibold uppercase transition-all cursor-pointer"
          >
            {p === 'today' ? tCommon('Today') :
              p === 'week' ? tCommon('Week') :
                p === 'month' ? tCommon('Month') :
                  tCommon('All')}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">{tReport('SortBy')}</span>
        <div>
          <NativeSelect
            data-testid="report-sort-select"
            value={reportSort}
            onChange={(e) => {
              if (e.target.value) setReportSort(e.target.value as 'date' | 'duration');
            }}
            className="h-8 px-3 py-1.5 border border-border rounded-xl text-xs focus:outline-none transition-all bg-card text-foreground"
            aria-label={tReport('SortBy')}
          >
            <option value="duration">{tReport('DurationHighestFirst')}</option>
            <option value="date">{tReport('DateChronological')}</option>
          </NativeSelect>
        </div>
      </div>
    </div>
  );
}
