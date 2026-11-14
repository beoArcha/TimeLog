import React, { useEffect, useState } from 'react';
import { Coins, DollarSign } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { StatCard } from '@components/StatCard';
import { CurrencyStatBadge } from '@components/CurrencyStatBadge';
import { useTranslation } from '@common/i18n/translator';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { EngineRouter } from '@common/engine/EngineRouter';
import { RangeBillingResult, CurrencyBillingSummary } from '@common/engine/billing/types';
import { getRangeFilterForPeriod } from '../utils/periodRanges';
import { Settings } from '@bindings/Settings';
import { Grid } from '@components/ui/grid';
import { Alert, AlertTitle, AlertDescription } from '@components/ui/alert';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@components/ui/table';

export interface ReportBillingCardProps {
  reportPeriod: string;
  customFrom?: string;
  customTo?: string;
  nowIso?: string;
  selectedProjectIds?: readonly string[] | null;
  sysSettings?: Settings | null;
  billingResult?: RangeBillingResult | null;
  billingError?: string | null;
  isLoading?: boolean;
  forceMountOnPrint?: boolean;
}

function formatDisplayRate(
  effectiveRate: string | null,
  currency: string | null,
  rateStatus: string
): string {
  if (effectiveRate) {
    return `${effectiveRate} ${currency ?? ''}`.trim();
  }
  if (rateStatus === 'non_billable') {
    return '0.00';
  }
  return '-';
}

export default function ReportBillingCard({
  reportPeriod,
  customFrom,
  customTo,
  nowIso,
  selectedProjectIds,
  sysSettings,
  billingResult: propBillingResult,
  billingError: propBillingError,
  isLoading: propIsLoading,
  forceMountOnPrint = false,
}: ReportBillingCardProps) {
  const { t } = useTranslation('report');
  const [internalResult, setInternalResult] = useState<RangeBillingResult | null>(null);
  const [internalLoading, setInternalLoading] = useState<boolean>(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const isControlled = propBillingResult !== undefined || propBillingError !== undefined;
  const billingResult = isControlled ? (propBillingResult ?? null) : internalResult;
  const isLoading = isControlled ? (propIsLoading ?? false) : internalLoading;
  const billingError = isControlled ? (propBillingError ?? null) : internalError;

  useEffect(() => {
    if (isControlled) return;

    let isCancelled = false;

    const fetchBilling = async () => {
      setInternalLoading(true);
      setInternalError(null);
      setInternalResult(null);
      let filterContext: unknown = null;
      try {
        const now = nowIso ? new Date(nowIso) : new Date();
        const { filter } = getRangeFilterForPeriod(
          reportPeriod,
          now,
          customFrom,
          customTo,
          sysSettings?.includePatchesInReports ?? false
        );

        if (selectedProjectIds && selectedProjectIds.length > 0) {
          filter.projectIds = [...selectedProjectIds];
        }
        filterContext = filter;

        let router: EngineRouter | null = null;
        try {
          router = typeof EngineRouter !== 'undefined' ? EngineRouter.getInstance() : null;
        } catch (engineErr) {
          console.error('[ReportBillingCard] Failed to get EngineRouter instance:', {
            filter: filterContext,
            nowIso,
            error: engineErr,
          });
          if (!isCancelled) {
            setInternalError(t('BillingCalculationError'));
          }
          return;
        }

        if (!router?.billing?.calculateRangeBilling) {
          return;
        }

        const res = await router.billing.calculateRangeBilling(filter, nowIso);
        if (!isCancelled) {
          setInternalResult(res);
        }
      } catch (err) {
        console.error('[ReportBillingCard] Billing calculation failed:', {
          filter: filterContext ?? {
            reportPeriod,
            customFrom,
            customTo,
            includePatches: sysSettings?.includePatchesInReports ?? false,
          },
          nowIso,
          error: err,
        });
        if (!isCancelled) {
          setInternalError(t('BillingCalculationError'));
        }
      } finally {
        if (!isCancelled) {
          setInternalLoading(false);
        }
      }
    };

    fetchBilling();

    return () => {
      isCancelled = true;
    };
  }, [
    isControlled,
    reportPeriod,
    customFrom,
    customTo,
    nowIso,
    selectedProjectIds,
    sysSettings,
    t,
  ]);

  if (billingError) {
    return (
      <CollapsibleCard
        title={t('BillingSummary')}
        icon={Coins}
        iconColor="text-destructive"
        defaultExpanded={true}
        headerTestId="report-billing-collapsible-header"
        contentClassName="flex flex-col gap-4 mt-2"
        forceMountOnPrint={forceMountOnPrint}
      >
        <Alert variant="destructive" data-testid="report-billing-error">
          <AlertTitle>{t('BillingCalculationError')}</AlertTitle>
          <AlertDescription>{billingError}</AlertDescription>
        </Alert>
      </CollapsibleCard>
    );
  }

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
      forceMountOnPrint={forceMountOnPrint}
    >
      {currencies.length === 0 ? (
        <div className="text-sm text-muted-foreground py-2" data-testid="report-billing-empty">
          {t('UnconfiguredTime')}: {formatSeconds(billingResult?.totalUnconfiguredSeconds ?? 0)}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Grid cols={1} gap="xl" className="md:grid-cols-3" data-testid="report-billing-currencies">
            {currencies.map((curr) => (
              <StatCard
                key={curr.currency}
                testId={`report-stat-currency-${curr.currency}`}
                title={`${curr.currency} ${t('TotalAmount')}`}
                value={`${curr.totalAmount} ${curr.currency}`}
                description={`${t('BillableTime')}: ${formatSeconds(curr.billableDurationSeconds)}`}
                icon={DollarSign}
                badge={
                  <CurrencyStatBadge
                    currency={curr.currency}
                    variant="emerald"
                    size="xs"
                  />
                }
              />
            ))}
          </Grid>

          <Grid cols={1} gap="lg" className="sm:grid-cols-3 pt-2 border-t border-border/40 text-xs">
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
          </Grid>

          {billingResult && billingResult.byTask.length > 0 && (
            <div className="mt-2 overflow-x-auto print:overflow-visible">
              <Table className="w-full text-xs text-left">
                <TableHeader>
                  <TableRow className="border-b border-border/60 text-muted-foreground">
                    <TableHead className="py-2 px-3 font-medium">Task</TableHead>
                    <TableHead className="py-2 px-3 font-medium">Rate</TableHead>
                    <TableHead className="py-2 px-3 font-medium">Duration</TableHead>
                    <TableHead className="py-2 px-3 font-medium text-right">{t('Amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/30">
                  {billingResult.byTask.map((task) => (
                    <TableRow key={task.taskId} className="hover:bg-muted/30">
                      <TableCell className="py-2 px-3 font-medium text-foreground">{task.taskName}</TableCell>
                      <TableCell className="py-2 px-3 text-muted-foreground">
                        {formatDisplayRate(task.effectiveRate, task.currency, task.rateStatus)}
                        <CurrencyStatBadge
                          rateStatus={task.rateStatus}
                          size="xs"
                          className="ml-2"
                          testId={`task-rate-status-${task.taskId}`}
                        />
                      </TableCell>
                      <TableCell className="py-2 px-3 font-mono text-muted-foreground">
                        {formatSeconds(task.durationSeconds)}
                      </TableCell>
                      <TableCell className="py-2 px-3 font-mono font-semibold text-right text-foreground">
                        {task.amount ? `${task.amount} ${task.currency ?? ''}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </CollapsibleCard>
  );
}
