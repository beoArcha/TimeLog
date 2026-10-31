import React, { useEffect, useState } from 'react';
import { Coins, Clock, DollarSign } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { StatCard } from '@components/StatCard';
import { useTranslation } from '@common/i18n/translator';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { EngineRouter } from '@common/engine/EngineRouter';
import { RangeBillingResult, CurrencyBillingSummary } from '@common/engine/billing/types';
import { getRangeFilterForPeriod } from '../utils/periodRanges';
import { Settings } from '@bindings/Settings';
import { Badge } from '@components/ui/badge';

export interface ReportBillingCardProps {
  reportPeriod: string;
  customFrom?: string;
  customTo?: string;
  nowIso?: string;
  selectedProjectId?: string | null;
  sysSettings?: Settings | null;
}

export default function ReportBillingCard({
  reportPeriod,
  customFrom,
  customTo,
  nowIso,
  selectedProjectId,
  sysSettings,
}: ReportBillingCardProps) {
  const { t } = useTranslation('report');
  const [billingResult, setBillingResult] = useState<RangeBillingResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    const fetchBilling = async () => {
      setIsLoading(true);
      try {
        const now = nowIso ? new Date(nowIso) : new Date();
        const { filter } = getRangeFilterForPeriod(
          reportPeriod,
          now,
          customFrom,
          customTo,
          sysSettings?.includePatchesInReports ?? false
        );

        if (selectedProjectId) {
          filter.projectId = selectedProjectId;
        }

        const res = await EngineRouter.getInstance().billing.calculateRangeBilling(filter, nowIso);
        if (!isCancelled) {
          setBillingResult(res);
        }
      } catch (err) {
        console.error('Failed to calculate range billing:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchBilling();

    return () => {
      isCancelled = true;
    };
  }, [reportPeriod, customFrom, customTo, nowIso, selectedProjectId, sysSettings]);

  if (!billingResult && !isLoading) {
    return null;
  }

  const currencies = billingResult
    ? (Object.values(billingResult.byCurrency) as CurrencyBillingSummary[])
    : [];

  return (
    <CollapsibleCard
      title={t('BillingSummary')}
      icon={Coins}
      iconColor="text-emerald-500"
      defaultExpanded={true}
      headerTestId="report-billing-collapsible-header"
      contentClassName="flex flex-col gap-4 mt-2"
    >
      {currencies.length === 0 ? (
        <div className="text-sm text-muted-foreground py-2" data-testid="report-billing-empty">
          {t('UnconfiguredTime')}: {formatSeconds(billingResult?.totalUnconfiguredSeconds ?? 0)}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="report-billing-currencies">
            {currencies.map((curr) => (
              <StatCard
                key={curr.currency}
                testId={`report-stat-currency-${curr.currency}`}
                title={`${curr.currency} ${t('TotalAmount')}`}
                value={`${curr.totalAmount} ${curr.currency}`}
                description={`${t('BillableTime')}: ${formatSeconds(curr.billableDurationSeconds)}`}
                icon={DollarSign}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/40 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t('BillableTime')}:</span>
              <span className="font-mono font-medium text-foreground">
                {formatSeconds(billingResult?.totalBillableSeconds ?? 0)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t('NonBillableTime')}:</span>
              <span className="font-mono font-medium text-foreground">
                {formatSeconds(billingResult?.totalNonBillableSeconds ?? 0)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t('UnconfiguredTime')}:</span>
              <span className="font-mono font-medium text-foreground">
                {formatSeconds(billingResult?.totalUnconfiguredSeconds ?? 0)}
              </span>
            </div>
          </div>

          {billingResult && billingResult.byTask.length > 0 && (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="py-2 px-3 font-medium">Task</th>
                    <th className="py-2 px-3 font-medium">Rate</th>
                    <th className="py-2 px-3 font-medium">Duration</th>
                    <th className="py-2 px-3 font-medium text-right">{t('Amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {billingResult.byTask.map((task) => (
                    <tr key={task.taskId} className="hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium text-foreground">{task.taskName}</td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {task.effectiveRate
                          ? `${task.effectiveRate} ${task.currency ?? ''}`
                          : task.rateStatus === 'non_billable'
                          ? '0.00'
                          : '-'}
                        <Badge variant="outline" size="xs" className="ml-2 uppercase text-[10px]">
                          {task.rateStatus}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 font-mono text-muted-foreground">
                        {formatSeconds(task.durationSeconds)}
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-right text-foreground">
                        {task.amount ? `${task.amount} ${task.currency ?? ''}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </CollapsibleCard>
  );
}
