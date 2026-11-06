import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from '@common/i18n/translator';
import { EngineRouter } from '@common/engine/EngineRouter';
import { RangeBillingResult } from '@common/engine/billing/types';
import { ElapsedRangeFilter } from '@bindings/ElapsedRangeFilter';
import { getRangeFilterForPeriod } from '../utils/periodRanges';
import { calculateReportStatistics } from '../utils/reportCalculator';
import { UseReportStatisticsProps, ProjectChartItem, ReportStatisticsResult } from '../types';

export type { UseReportStatisticsProps, ProjectChartItem, ReportStatisticsResult };

export interface ExtendedReportStatisticsResult extends ReportStatisticsResult {
  billingResult: RangeBillingResult | null;
  billingError: string | null;
  isBillingLoading: boolean;
}

export function useReportStatistics(
  props: UseReportStatisticsProps & { selectedProjectId?: string | null }
): ExtendedReportStatisticsResult {
  const {
    logs,
    patches,
    projects,
    tasks,
    nowIso,
    reportPeriod,
    reportSort,
    sysSettings,
    customFrom,
    customTo,
    selectedProjectId,
  } = props;

  const { t } = useTranslation('report');

  const baseStats = useMemo(
    () =>
      calculateReportStatistics({
        logs,
        patches,
        projects,
        tasks,
        nowIso,
        reportPeriod,
        reportSort,
        sysSettings,
        customFrom,
        customTo,
        selectedProjectId,
      }),
    [
      logs,
      patches,
      projects,
      tasks,
      nowIso,
      reportPeriod,
      reportSort,
      sysSettings,
      customFrom,
      customTo,
      selectedProjectId,
    ]
  );

  const [billingResult, setBillingResult] = useState<RangeBillingResult | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState<boolean>(true);

  const includePatches = sysSettings?.includePatchesInReports ?? false;

  useEffect(() => {
    let isCancelled = false;

    const fetchBilling = async () => {
      setBillingResult(null);
      setIsBillingLoading(true);
      setBillingError(null);
      let filterContext: ElapsedRangeFilter | null = null;
      try {
        const now = nowIso ? new Date(nowIso) : new Date();
        const { filter } = getRangeFilterForPeriod(
          reportPeriod,
          now,
          customFrom,
          customTo,
          includePatches
        );

        if (selectedProjectId) {
          filter.projectId = selectedProjectId;
        }
        filterContext = filter;

        let router: EngineRouter | null = null;
        try {
          router = typeof EngineRouter !== 'undefined' ? EngineRouter.getInstance() : null;
        } catch (engineErr) {
          console.error('[useReportStatistics] Failed to get EngineRouter instance:', {
            filter: filterContext,
            nowIso,
            error: engineErr,
          });
          if (!isCancelled) {
            setBillingError(t('BillingCalculationError'));
          }
          return;
        }

        if (!router?.billing?.calculateRangeBilling) {
          return;
        }

        const res = await router.billing.calculateRangeBilling(filter, nowIso);
        if (!isCancelled) {
          setBillingResult(res);
        }
      } catch (err) {
        console.error('[useReportStatistics] Billing calculation failed:', {
          filter: filterContext ?? {
            reportPeriod,
            customFrom,
            customTo,
            selectedProjectId,
            includePatches,
          },
          nowIso,
          error: err,
        });
        if (!isCancelled) {
          setBillingError(t('BillingCalculationError'));
        }
      } finally {
        if (!isCancelled) {
          setIsBillingLoading(false);
        }
      }
    };

    fetchBilling();

    return () => {
      isCancelled = true;
    };
  }, [reportPeriod, customFrom, customTo, nowIso, selectedProjectId, includePatches, t]);

  return {
    ...baseStats,
    billingResult,
    billingError,
    isBillingLoading,
  };
}
