import React from 'react';
import { TrendingUp, Clock, BarChart3, Award, Calendar, DollarSign } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { StatCard } from '@components/StatCard';
import { CurrencyStatBadge } from '@components/CurrencyStatBadge';
import { Badge } from '@components/ui/badge';
import { Grid } from '@components/ui/grid';
import { useTranslation } from '@common/i18n/translator';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { RangeBillingResult, CurrencyBillingSummary } from '@common/engine/billing/types';
import { ReportTopProject } from '../types';

export interface ReportStatsCardsProps {
  todaySec?: number;
  weekSec?: number;
  monthSec?: number;
  periodTotalSec?: number;
  dailyAverageSec?: number;
  topProject?: ReportTopProject | null;
  billingResult?: RangeBillingResult | null;
  currencies?: CurrencyBillingSummary[];
  billingError?: string | null;
  isBillingLoading?: boolean;
  forceMountOnPrint?: boolean;
}

function getCurrencyMetricValue(curr: CurrencyBillingSummary): string {
  if (curr.billableDurationSeconds > 0) {
    return `${curr.totalAmount} ${curr.currency}`;
  }
  if (curr.nonBillableDurationSeconds > 0) {
    return `0.00 ${curr.currency}`;
  }
  if (curr.unconfiguredDurationSeconds > 0) {
    return '-';
  }
  return `${curr.totalAmount} ${curr.currency}`;
}

function getCurrencyMetricDescription(
  curr: CurrencyBillingSummary,
  t: (key: string) => string
): string {
  if (curr.billableDurationSeconds > 0) {
    return `${t('BillableTime')}: ${formatSeconds(curr.billableDurationSeconds)}`;
  }
  if (curr.nonBillableDurationSeconds > 0) {
    return `${t('NonBillableTime')}: ${formatSeconds(curr.nonBillableDurationSeconds)}`;
  }
  if (curr.unconfiguredDurationSeconds > 0) {
    return `${t('UnconfiguredTime')}: ${formatSeconds(curr.unconfiguredDurationSeconds)}`;
  }
  return `${curr.currency} ${t('TotalAmount')}`;
}

function getCurrencyBadge(curr: CurrencyBillingSummary, testId?: string): React.ReactNode {
  if (curr.billableDurationSeconds > 0) {
    return (
      <CurrencyStatBadge
        currency={curr.currency}
        variant="emerald"
        size="xs"
        testId={testId}
      />
    );
  }
  if (curr.nonBillableDurationSeconds > 0) {
    return (
      <CurrencyStatBadge
        rateStatus="non_billable"
        size="xs"
        testId={testId}
      />
    );
  }
  if (curr.unconfiguredDurationSeconds > 0) {
    return (
      <CurrencyStatBadge
        rateStatus="unconfigured"
        size="xs"
        testId={testId}
      />
    );
  }
  return (
    <CurrencyStatBadge
      currency={curr.currency}
      size="xs"
      testId={testId}
    />
  );
}

function getEmptyFinancialMetric(
  billingResult: RangeBillingResult | null | undefined,
  billingError: string | null | undefined,
  isBillingLoading: boolean | undefined,
  t: (key: string) => string
) {
  if (billingError) {
    return {
      testId: 'report-stat-financial',
      title: t('TotalPeriodValue'),
      value: '-',
      description: billingError,
      icon: DollarSign,
      iconColor: 'text-destructive',
      badge: (
        <Badge variant="destructive" size="xs">
          Error
        </Badge>
      ),
    };
  }
  if (isBillingLoading) {
    return {
      testId: 'report-stat-financial',
      title: t('TotalPeriodValue'),
      value: '...',
      description: t('TotalPeriodValueDesc'),
      icon: DollarSign,
      iconColor: 'text-emerald-500',
      badge: undefined,
    };
  }
  if (billingResult && billingResult.totalNonBillableSeconds > 0 && billingResult.totalBillableSeconds === 0) {
    return {
      testId: 'report-stat-financial',
      title: t('TotalPeriodValue'),
      value: '0.00',
      description: `${t('NonBillableTime')}: ${formatSeconds(billingResult.totalNonBillableSeconds)}`,
      icon: DollarSign,
      iconColor: 'text-muted-foreground',
      badge: <CurrencyStatBadge rateStatus="non_billable" size="xs" />,
    };
  }
  if (billingResult && billingResult.totalUnconfiguredSeconds > 0 && billingResult.totalBillableSeconds === 0) {
    return {
      testId: 'report-stat-financial',
      title: t('TotalPeriodValue'),
      value: '-',
      description: `${t('UnconfiguredTime')}: ${formatSeconds(billingResult.totalUnconfiguredSeconds)}`,
      icon: DollarSign,
      iconColor: 'text-amber-500',
      badge: <CurrencyStatBadge rateStatus="unconfigured" size="xs" />,
    };
  }
  return {
    testId: 'report-stat-financial',
    title: t('TotalPeriodValue'),
    value: '-',
    description: t('TotalPeriodValueDesc'),
    icon: DollarSign,
    iconColor: 'text-emerald-500',
    badge: undefined,
  };
}

export default function ReportStatsCards({
  todaySec = 0,
  weekSec = 0,
  monthSec = 0,
  periodTotalSec,
  dailyAverageSec,
  topProject,
  billingResult,
  currencies,
  billingError,
  isBillingLoading,
  forceMountOnPrint = false,
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
      iconColor: undefined,
      badge: undefined,
    },
    {
      testId: 'report-stat-avg',
      title: t('DailyAverage'),
      value: formatSeconds(dailyAverageSec ?? 0),
      description: t('DailyAverageDesc'),
      icon: BarChart3,
      iconColor: undefined,
      badge: undefined,
    },
    {
      testId: 'report-stat-top',
      title: t('TopProject'),
      value: topProject ? `${topProject.name} (${topProject.percentage.toFixed(0)}%)` : '-',
      description: topProject ? formatSeconds(topProject.seconds) : undefined,
      icon: Award,
      iconColor: undefined,
      badge: undefined,
    },
  ];

  const currencyList: CurrencyBillingSummary[] =
    currencies ?? (billingResult ? Object.values(billingResult.byCurrency) : []);

  const financialMetrics: Array<{
    testId: string;
    title: string;
    value: string;
    description?: string;
    icon: React.ElementType;
    iconColor?: string;
    badge?: React.ReactNode;
  }> = [];

  if (isBillingLoading) {
    financialMetrics.push(
      getEmptyFinancialMetric(null, null, true, t as (key: string) => string)
    );
  } else if (currencyList.length === 0) {
    financialMetrics.push(
      getEmptyFinancialMetric(billingResult, billingError, false, t as (key: string) => string)
    );
  } else if (currencyList.length === 1) {
    const curr = currencyList[0];
    financialMetrics.push({
      testId: 'report-stat-financial',
      title: t('TotalPeriodValue'),
      value: getCurrencyMetricValue(curr),
      description: getCurrencyMetricDescription(curr, t as (key: string) => string),
      icon: DollarSign,
      iconColor: 'text-emerald-500',
      badge: getCurrencyBadge(curr, `report-stat-financial-${curr.currency}`),
    });
  } else {
    for (const curr of currencyList) {
      financialMetrics.push({
        testId: `report-stat-financial-${curr.currency}`,
        title: `${curr.currency} ${t('TotalPeriodValue')}`,
        value: getCurrencyMetricValue(curr),
        description: getCurrencyMetricDescription(curr, t as (key: string) => string),
        icon: DollarSign,
        iconColor: 'text-emerald-500',
        badge: getCurrencyBadge(curr, `report-stat-currency-${curr.currency}`),
      });
    }
  }

  const allActiveMetrics = [...activePeriodMetrics, ...financialMetrics];

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
      forceMountOnPrint={forceMountOnPrint}
    >
      {showActivePeriodStats && (
        <Grid cols={1} gap="xl" className="md:grid-cols-2 lg:grid-cols-4">
          {allActiveMetrics.map((metric) => (
            <StatCard
              key={metric.testId}
              testId={metric.testId}
              title={metric.title}
              value={metric.value}
              description={metric.description}
              icon={metric.icon}
              iconColor={metric.iconColor}
              badge={metric.badge}
            />
          ))}
        </Grid>
      )}

      <Grid cols={1} gap="xl" className="md:grid-cols-3">
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
      </Grid>
    </CollapsibleCard>
  );
}
