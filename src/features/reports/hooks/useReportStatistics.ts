import { useMemo, useState, useEffect } from 'react';
import { EngineRouter } from '@common/engine/EngineRouter';
import { RangeBillingResult } from '@common/engine/billing/types';
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
    ]
  );

  const [billingResult, setBillingResult] = useState<RangeBillingResult | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    const fetchBilling = async () => {
      setIsBillingLoading(true);
      setBillingError(null);
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
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setBillingError(msg);
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
  }, [reportPeriod, customFrom, customTo, nowIso, selectedProjectId, sysSettings]);

  return {
    ...baseStats,
    billingResult,
    billingError,
    isBillingLoading,
  };
}
