import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from '@common/i18n/translator';
import { EngineRouter } from '@common/engine/EngineRouter';
import { RangeBillingResult } from '@common/engine/billing/types';
import { ElapsedRangeFilter } from '@bindings/ElapsedRangeFilter';
import { getRangeFilterForPeriod } from '../utils/periodRanges';
import { calculateReportStatistics } from '../utils/reportCalculator';
import { filterProjectsByTags, filterTasksByProjectIds } from '../utils/tagFiltering';
import { UseReportStatisticsProps, ProjectChartItem, ReportStatisticsResult } from '../types';

export type { UseReportStatisticsProps, ProjectChartItem, ReportStatisticsResult };

export interface ExtendedReportStatisticsResult extends ReportStatisticsResult {
  billingResult: RangeBillingResult | null;
  billingError: string | null;
  isBillingLoading: boolean;
}

export interface ReportStatisticsHookProps extends UseReportStatisticsProps {
  selectedTags?: string[];
}

const EMPTY_BILLING_RESULT: RangeBillingResult = {
  byCurrency: {},
  byTask: [],
  totalBillableSeconds: 0,
  totalNonBillableSeconds: 0,
  totalUnconfiguredSeconds: 0,
};

export function useReportStatistics(props: ReportStatisticsHookProps): ExtendedReportStatisticsResult {
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
    selectedProjectIds,
    selectedTags,
  } = props;

  const { t } = useTranslation('report');

  const hasTagFilter = Boolean(selectedTags && selectedTags.length > 0);
  const hasProjectFilter = Boolean(selectedProjectIds && selectedProjectIds.length > 0);

  // Strict intersection between project scope and tag filter; an empty intersection yields an empty report
  const allowedProjectIds = useMemo((): Set<string> | null => {
    if (!hasTagFilter && !hasProjectFilter) {
      return null;
    }

    const scopedIds = new Set(selectedProjectIds);
    if (!hasTagFilter) {
      return scopedIds;
    }

    const matchingTagIds = new Set(filterProjectsByTags(projects, selectedTags).map((p) => p.id));
    if (!hasProjectFilter) {
      return matchingTagIds;
    }

    return new Set([...scopedIds].filter((id) => matchingTagIds.has(id)));
  }, [projects, selectedTags, selectedProjectIds, hasTagFilter, hasProjectFilter]);

  const effectiveProjects = useMemo(() => {
    if (!allowedProjectIds) return projects;
    return projects.filter((p) => allowedProjectIds.has(p.id));
  }, [projects, allowedProjectIds]);

  const effectiveTasks = useMemo(() => {
    if (!allowedProjectIds) return tasks;
    return filterTasksByProjectIds(tasks, allowedProjectIds);
  }, [tasks, allowedProjectIds]);

  const engineProjectIds = useMemo(
    () => (allowedProjectIds ? Array.from(allowedProjectIds) : null),
    [allowedProjectIds]
  );

  const baseStats = useMemo(
    () =>
      calculateReportStatistics({
        logs,
        patches,
        projects: effectiveProjects,
        tasks: effectiveTasks,
        nowIso,
        reportPeriod,
        reportSort,
        sysSettings,
        customFrom,
        customTo,
        projectIds: engineProjectIds,
      }),
    [
      logs,
      patches,
      effectiveProjects,
      effectiveTasks,
      nowIso,
      reportPeriod,
      reportSort,
      sysSettings,
      customFrom,
      customTo,
      engineProjectIds,
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

      // If intersection is empty, return empty billing result immediately without querying engine
      if (allowedProjectIds !== null && allowedProjectIds.size === 0) {
        if (!isCancelled) {
          setBillingResult(EMPTY_BILLING_RESULT);
          setIsBillingLoading(false);
          setBillingError(null);
        }
        return;
      }

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

        if (engineProjectIds !== null) {
          filter.projectIds = engineProjectIds;
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
            projectIds: engineProjectIds ?? undefined,
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
  }, [
    reportPeriod,
    customFrom,
    customTo,
    nowIso,
    allowedProjectIds,
    engineProjectIds,
    includePatches,
    t,
  ]);

  return {
    ...baseStats,
    billingResult,
    billingError,
    isBillingLoading,
  };
}
