import React from 'react';
import { useTranslation } from '@common/i18n/translator';
import { SegmentedControl, type SegmentedControlOption } from '@components/SegmentedControl';
import { NativeSelect } from '@components/ui/select';
import { Input } from '@components/ui/input';
import { HStack, InlineCluster } from '@components/ui/stack';
import { ReportPeriodType } from '../types';

export interface ReportPeriodSelectorProps {
  reportPeriod: ReportPeriodType;
  setReportPeriod: (p: ReportPeriodType) => void;
  reportSort: 'date' | 'duration';
  setReportSort: (s: 'date' | 'duration') => void;
  customFrom?: string;
  setCustomFrom?: (v: string) => void;
  customTo?: string;
  setCustomTo?: (v: string) => void;
}

export default function ReportPeriodSelector({
  reportPeriod,
  setReportPeriod,
  reportSort,
  setReportSort,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
}: ReportPeriodSelectorProps) {
  const { t: tReport } = useTranslation('report');
  const { t: tCommon } = useTranslation('common');

  const presets: Array<{ id: ReportPeriodType; label: string }> = [
    { id: 'today', label: tCommon('Today') },
    { id: 'yesterday', label: tReport('Yesterday') },
    { id: 'week', label: tCommon('Week') },
    { id: 'lastWeek', label: tReport('LastWeek') },
    { id: 'month', label: tCommon('Month') },
    { id: 'lastMonth', label: tReport('LastMonth') },
    { id: 'last30Days', label: tReport('Last30Days') },
    { id: 'year', label: tReport('ThisYear') },
    { id: 'all', label: tCommon('All') },
    { id: 'custom', label: tReport('CustomRange') },
  ];

  const options: SegmentedControlOption<ReportPeriodType>[] = presets.map(p => ({
    value: p.id,
    label: p.label,
    testId: `period-btn-${p.id}`,
    ariaLabel: p.label,
  }));

  return (
    <div className="p-4 rounded-2xl border border-border bg-muted/40 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <InlineCluster gap="xs" className="items-center">
          <span className="text-xs font-mono text-muted-foreground mr-1">{tCommon('Period')}</span>
          <SegmentedControl
            value={reportPeriod}
            onChange={setReportPeriod}
            options={options}
            size="xs"
            className="flex-wrap bg-muted/30"
          />
        </InlineCluster>

        <HStack gap="sm" className="shrink-0">
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
        </HStack>
      </div>

      {reportPeriod === 'custom' && (
        <InlineCluster data-testid="custom-date-range-panel" gap="lg" className="pt-3 border-t border-border/50 text-xs">
          <HStack gap="sm">
            <span className="font-mono text-muted-foreground">{tReport('DateFrom')}:</span>
            <Input
              data-testid="custom-from-input"
              type="date"
              value={customFrom ?? ''}
              onChange={(e) => setCustomFrom?.(e.target.value)}
              className="w-36 h-8 text-xs bg-card"
              aria-label={tReport('DateFrom')}
            />
          </HStack>
          <HStack gap="sm">
            <span className="font-mono text-muted-foreground">{tReport('DateTo')}:</span>
            <Input
              data-testid="custom-to-input"
              type="date"
              value={customTo ?? ''}
              onChange={(e) => setCustomTo?.(e.target.value)}
              className="w-36 h-8 text-xs bg-card"
              aria-label={tReport('DateTo')}
            />
          </HStack>
        </InlineCluster>
      )}
    </div>
  );
}
