import React from 'react';
import { Coins, DollarSign } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { StatCard } from '@components/StatCard';
import { CurrencyStatBadge } from '@components/CurrencyStatBadge';
import { useTranslation } from '@common/i18n/translator';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { RangeBillingResult, CurrencyBillingSummary } from '@common/engine/billing/types';
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
import type { ReportKey } from '@common/i18n/keys/report';

export interface ReportBillingCardProps {
  billingResult?: RangeBillingResult | null;
  billingError?: string | null;
  isLoading?: boolean;
  isCondensed?: boolean;
  forceMountOnPrint?: boolean;
}

type TranslateReportFn = (key: ReportKey) => string;

function isUnknownCurrency(currency: string | null | undefined): boolean {
  return !currency || currency === 'UNKNOWN';
}

function formatDisplayRate(
  effectiveRate: string | null,
  currency: string | null,
  rateStatus: string
): string {
  if (effectiveRate) {
    const cleanCurrency = isUnknownCurrency(currency) ? '' : currency;
    return `${effectiveRate} ${cleanCurrency}`.trim();
  }
  if (rateStatus === 'non_billable') {
    return '0.00';
  }
  return '-';
}

function formatDisplayAmount(amount: string | null, currency: string | null): string {
  if (!amount) {
    return '-';
  }
  if (isUnknownCurrency(currency)) {
    return amount;
  }
  return `${amount} ${currency}`;
}

function getCurrencyCardTitle(curr: CurrencyBillingSummary, t: TranslateReportFn): string {
  if (isUnknownCurrency(curr.currency)) {
    return t('UnconfiguredTime');
  }
  return `${curr.currency} ${t('TotalAmount')}`;
}

function getCurrencyCardValue(curr: CurrencyBillingSummary): string {
  const unknown = isUnknownCurrency(curr.currency);
  if (curr.billableDurationSeconds > 0) {
    return unknown ? curr.totalAmount : `${curr.totalAmount} ${curr.currency}`;
  }
  if (curr.nonBillableDurationSeconds > 0) {
    return unknown ? '0.00' : `0.00 ${curr.currency}`;
  }
  if (curr.unconfiguredDurationSeconds > 0 || unknown) {
    return '-';
  }
  return `${curr.totalAmount} ${curr.currency}`;
}

function getCurrencyCardDescription(curr: CurrencyBillingSummary, t: TranslateReportFn): string {
  if (curr.billableDurationSeconds > 0) {
    return `${t('BillableTime')}: ${formatSeconds(curr.billableDurationSeconds)}`;
  }
  if (curr.nonBillableDurationSeconds > 0) {
    return `${t('NonBillableTime')}: ${formatSeconds(curr.nonBillableDurationSeconds)}`;
  }
  if (curr.unconfiguredDurationSeconds > 0 || isUnknownCurrency(curr.currency)) {
    return `${t('UnconfiguredTime')}: ${formatSeconds(curr.unconfiguredDurationSeconds)}`;
  }
  return `${t('BillableTime')}: ${formatSeconds(curr.billableDurationSeconds)}`;
}

function getCurrencyCardIconColor(curr: CurrencyBillingSummary): string {
  if (curr.billableDurationSeconds > 0) {
    return 'text-emerald-500';
  }
  if (curr.unconfiguredDurationSeconds > 0 || isUnknownCurrency(curr.currency)) {
    return 'text-amber-500';
  }
  return 'text-muted-foreground';
}

function getCurrencyCardBadge(curr: CurrencyBillingSummary): React.ReactNode {
  const unknown = isUnknownCurrency(curr.currency);
  if (curr.billableDurationSeconds > 0 && !unknown) {
    return (
      <CurrencyStatBadge
        currency={curr.currency}
        variant="emerald"
        size="xs"
      />
    );
  }
  if (curr.nonBillableDurationSeconds > 0) {
    return <CurrencyStatBadge rateStatus="non_billable" size="xs" />;
  }
  if (curr.unconfiguredDurationSeconds > 0 || unknown) {
    return <CurrencyStatBadge rateStatus="unconfigured" size="xs" />;
  }
  return (
    <CurrencyStatBadge
      currency={curr.currency}
      variant="emerald"
      size="xs"
    />
  );
}

export default function ReportBillingCard({
  billingResult = null,
  billingError = null,
  isLoading = false,
  isCondensed = false,
  forceMountOnPrint = false,
}: ReportBillingCardProps) {
  const { t } = useTranslation('report');

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
          <Grid
            cols={1}
            gap="xl"
            className={isCondensed ? undefined : 'md:grid-cols-3'}
            data-testid="report-billing-currencies"
          >
            {currencies.map((curr) => (
              <StatCard
                key={curr.currency}
                testId={`report-stat-currency-${curr.currency}`}
                title={getCurrencyCardTitle(curr, t)}
                value={getCurrencyCardValue(curr)}
                description={getCurrencyCardDescription(curr, t)}
                icon={DollarSign}
                iconColor={getCurrencyCardIconColor(curr)}
                badge={getCurrencyCardBadge(curr)}
              />
            ))}
          </Grid>

          <Grid
            cols={1}
            gap="sm"
            className={
              isCondensed
                ? 'pt-2 border-t border-border/40 text-xs'
                : 'sm:grid-cols-3 sm:gap-4 pt-2 border-t border-border/40 text-xs'
            }
          >
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-muted-foreground">{t('BillableTime')}:</span>
              <span className="font-mono font-medium text-foreground shrink-0">
                {formatSeconds(billingResult?.totalBillableSeconds ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-muted-foreground">{t('NonBillableTime')}:</span>
              <span className="font-mono font-medium text-foreground shrink-0">
                {formatSeconds(billingResult?.totalNonBillableSeconds ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-muted-foreground">{t('UnconfiguredTime')}:</span>
              <span className="font-mono font-medium text-foreground shrink-0">
                {formatSeconds(billingResult?.totalUnconfiguredSeconds ?? 0)}
              </span>
            </div>
          </Grid>

          {billingResult && billingResult.byTask.length > 0 && isCondensed && (
            <div className="flex flex-col gap-2.5 mt-1" data-testid="report-billing-task-cards">
              {billingResult.byTask.map((task) => {
                const formattedRate = formatDisplayRate(
                  task.effectiveRate,
                  task.currency,
                  task.rateStatus
                );
                const formattedAmount = formatDisplayAmount(task.amount, task.currency);

                return (
                  <div
                    key={task.taskId}
                    data-testid={`report-billing-task-card-${task.taskId}`}
                    className="rounded-xl border border-border/60 bg-muted/20 p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-foreground leading-snug break-words min-w-0">
                        {task.taskName}
                      </span>
                      <CurrencyStatBadge
                        rateStatus={task.rateStatus}
                        size="xs"
                        className="shrink-0"
                        testId={`task-rate-status-${task.taskId}`}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-xs">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[11px] text-muted-foreground">
                          {t('BillingColRate')}
                        </span>
                        <span className="font-mono text-foreground truncate">
                          {formattedRate}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[11px] text-muted-foreground">
                          {t('BillingColDuration')}
                        </span>
                        <span className="font-mono text-foreground">
                          {formatSeconds(task.durationSeconds)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 items-end min-w-0">
                        <span className="text-[11px] text-muted-foreground">
                          {t('Amount')}
                        </span>
                        <span className="font-mono font-semibold text-foreground truncate">
                          {formattedAmount}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {billingResult && billingResult.byTask.length > 0 && !isCondensed && (
            <div
              className="mt-2 overflow-x-auto print:overflow-visible"
              data-testid="report-billing-task-table"
            >
              <Table className="w-full text-xs text-left">
                <TableHeader>
                  <TableRow className="border-b border-border/60 text-muted-foreground">
                    <TableHead className="py-2 px-3 font-medium">{t('BillingColTask')}</TableHead>
                    <TableHead className="py-2 px-3 font-medium">{t('BillingColRate')}</TableHead>
                    <TableHead className="py-2 px-3 font-medium">{t('BillingColDuration')}</TableHead>
                    <TableHead className="py-2 px-3 font-medium text-right">{t('Amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/30">
                  {billingResult.byTask.map((task) => (
                    <TableRow key={task.taskId} className="hover:bg-muted/30">
                      <TableCell className="py-2 px-3 font-medium text-foreground">
                        {task.taskName}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-muted-foreground">
                        <span className="inline-flex items-center flex-wrap gap-1.5">
                          <span>
                            {formatDisplayRate(task.effectiveRate, task.currency, task.rateStatus)}
                          </span>
                          <CurrencyStatBadge
                            rateStatus={task.rateStatus}
                            size="xs"
                            testId={`task-rate-status-${task.taskId}`}
                          />
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-3 font-mono text-muted-foreground whitespace-nowrap">
                        {formatSeconds(task.durationSeconds)}
                      </TableCell>
                      <TableCell className="py-2 px-3 font-mono font-semibold text-right text-foreground whitespace-nowrap">
                        {formatDisplayAmount(task.amount, task.currency)}
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
