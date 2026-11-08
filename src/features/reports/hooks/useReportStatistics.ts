import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from '@common/i18n/translator';
import { EngineRouter } from '@common/engine/EngineRouter';
import { RangeBillingResult } from '@common/engine/billing/types';
import { ElapsedRangeFilter } from '@bindings/ElapsedRangeFilter';
import { getRangeFilterForPeriod } from '../utils/periodRanges';
import { calculateReportStatistics } from '../utils/reportCalculator';
import {
  filterProjectsByTags,
  filterTasksByProjectIds,
  filterTimeLogsByTagFilter,
} from '../utils/tagFiltering';
import { UseReportStatisticsProps, ProjectChartItem, ReportStatisticsResult } from '../types';

export type { UseReportStatisticsProps, ProjectChartItem, ReportStatisticsResult };

export interface ExtendedReportStatisticsResult extends ReportStatisticsResult {
  billingResult: RangeBillingResult | null;
  billingError: string | null;
  isBillingLoading: boolean;
}

export interface ReportStatisticsHookProps extends UseReportStatisticsProps {
  selectedProjectId?: string | null;
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
    selectedProjectId,
    selectedTags,
  } = props;

  const { t } = useTranslation('report');

  const hasTagFilter = Boolean(selectedTags && selectedTags.length > 0);
  const hasProjectFilter = Boolean(selectedProjectId);

  // Strict intersection between project filter and tag filter
  const allowedProjectIds = useMemo(() => {
    if (!hasTagFilter && !hasProjectFilter) {
      return null;
    }

    const matchingTagProjects = hasTagFilter
      ? filterProjectsByTags(projects, selectedTags)
      : projects;
    const matchingTagIds = new Set(matchingTagProjects.map((p) => p.id));

    if (hasProjectFilter && selectedProjectId) {
      if (matchingTagIds.has(selectedProjectId)) {
        return new Set([selectedProjectId]);
      }
      return new Set<string>();
    }

    return matchingTagIds;
  }, [projects, selectedTags, selectedProjectId, hasTagFilter, hasProjectFilter]);

  const effectiveProjects = useMemo(() => {
    if (!allowedProjectIds) return projects;
    return projects.filter((p) => allowedProjectIds.has(p.id));
  }, [projects, allowedProjectIds]);

  const effectiveTasks = useMemo(() => {
    if (!allowedProjectIds) return tasks;
    return filterTasksByProjectIds(tasks, allowedProjectIds);
  }, [tasks, allowedProjectIds]);

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const effectiveLogs = useMemo(() => {
    if (!allowedProjectIds) return logs;
    return filterTimeLogsByTagFilter(logs, allowedProjectIds, taskMap);
  }, [logs, taskMap, allowedProjectIds]);

  const effectivePatches = useMemo(() => {
    if (!allowedProjectIds) return patches;
    return filterTimeLogsByTagFilter(patches, allowedProjectIds, taskMap);
  }, [patches, taskMap, allowedProjectIds]);

  const effectiveSelectedProjectId = useMemo(() => {
    if (!selectedProjectId) return null;
    return allowedProjectIds && allowedProjectIds.has(selectedProjectId) ? selectedProjectId : null;
  }, [selectedProjectId, allowedProjectIds]);

  const baseStats = useMemo(
    () =>
      calculateReportStatistics({
        logs: effectiveLogs,
        patches: effectivePatches,
        projects: effectiveProjects,
        tasks: effectiveTasks,
        nowIso,
        reportPeriod,
        reportSort,
        sysSettings,
        customFrom,
        customTo,
        selectedProjectId: effectiveSelectedProjectId,
      }),
    [
      effectiveLogs,
      effectivePatches,
      effectiveProjects,
      effectiveTasks,
      nowIso,
      reportPeriod,
      reportSort,
      sysSettings,
      customFrom,
      customTo,
      effectiveSelectedProjectId,
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

        if (selectedProjectId) {
          filter.projectId = selectedProjectId;
        }
        if (allowedProjectIds !== null) {
          filter.projectIds = Array.from(allowedProjectIds);
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
            projectIds: allowedProjectIds ? Array.from(allowedProjectIds) : undefined,
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
    selectedProjectId,
    allowedProjectIds,
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
