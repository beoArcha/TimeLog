import React from 'react';
import { useTranslation } from '@common/i18n/translator';
import { Calendar } from 'lucide-react';
import { HStack } from '@components/ui/stack';
import { Text, MonoText } from '@components/ui/typography';
import { ReportPeriodType } from '../types';
import { formatCustomDateRange } from '../utils/reportDateUtils';

export interface ReportPeriodPrintHeaderProps {
  reportPeriod: ReportPeriodType | string;
  customFrom?: string;
  customTo?: string;
}

/**
 * Print-only summary header displaying the active report period (preset or custom date range)
 * using localized labels and UTC calendar conventions. Invisible on screen.
 */
export default function ReportPeriodPrintHeader({
  reportPeriod,
  customFrom,
  customTo,
}: ReportPeriodPrintHeaderProps) {
  const { t: tReport, locale } = useTranslation('report');
  const { t: tCommon } = useTranslation('common');

  const getPeriodLabel = (): string => {
    switch (reportPeriod) {
      case 'today':
        return tCommon('Today');
      case 'yesterday':
        return tReport('Yesterday');
      case 'week':
        return tCommon('Week');
      case 'lastWeek':
        return tReport('LastWeek');
      case 'month':
        return tCommon('Month');
      case 'lastMonth':
        return tReport('LastMonth');
      case 'last30Days':
        return tReport('Last30Days');
      case 'year':
        return tReport('ThisYear');
      case 'all':
        return tCommon('All');
      case 'custom': {
        const customRange = formatCustomDateRange(customFrom, customTo, locale);
        if (customRange.label) {
          return `${tReport('CustomRange')}: ${customRange.label}`;
        }
        return tReport('CustomRange');
      }
      default:
        return String(reportPeriod);
    }
  };

  const periodLabel = getPeriodLabel();

  return (
    <div
      data-testid="report-print-period-header"
      data-slot="report-print-period-header"
      className="hidden print:flex items-center justify-between text-xs font-mono border-b border-border/60 pb-2 mb-2 text-foreground"
    >
      <HStack align="center" gap="xs">
        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
        <Text as="span" variant="muted" size="xs">
          {tCommon('Period')}
        </Text>
        <MonoText as="strong" size="xs" weight="bold" className="text-foreground">
          {periodLabel}
        </MonoText>
      </HStack>
    </div>
  );
}
