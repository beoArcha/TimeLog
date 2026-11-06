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

export interface ReportStatisticsHookProps extends UseReportStatisticsProps {
  selectedProjectId?: string | null;
  selectedTags?: string[];
}

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

  const effectiveProjects = useMemo(() => {
    if (!hasTagFilter || !selectedTags) return projects;
    return projects.filter(
      (p) => Array.isArray(p.tags) && p.tags.some((t) => selectedTags.includes(t))
    );
  }, [projects, selectedTags, hasTagFilter]);

  const effectiveProjectIds = useMemo(() => {
    return new Set(effectiveProjects.map((p) => p.id));
  }, [effectiveProjects]);

  const effectiveTasks = useMemo(() => {
    if (!hasTagFilter) return tasks;
    return tasks.filter((t) => effectiveProjectIds.has(t.projectId));
  }, [tasks, effectiveProjectIds, hasTagFilter]);

  const effectiveTaskIds = useMemo(() => {
    return new Set(effectiveTasks.map((t) => t.id));
  }, [effectiveTasks]);

  const effectiveLogs = useMemo(() => {
    if (!hasTagFilter) return logs;
    return logs.filter(
      (l) => effectiveProjectIds.has(l.projectId) || effectiveTaskIds.has(l.taskId)
    );
  }, [logs, effectiveProjectIds, effectiveTaskIds, hasTagFilter]);

  const effectivePatches = useMemo(() => {
    if (!hasTagFilter) return patches;
    return patches.filter((p) => effectiveProjectIds.has(p.projectId));
  }, [patches, effectiveProjectIds, hasTagFilter]);

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
        selectedProjectId,
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
        if (hasTagFilter) {
          filter.projectIds = Array.from(effectiveProjectIds);
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
  }, [
    reportPeriod,
    customFrom,
    customTo,
    nowIso,
    selectedProjectId,
    hasTagFilter,
    effectiveProjectIds,
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
