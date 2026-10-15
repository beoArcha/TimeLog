import { useMemo } from 'react';

import { calculateReportStatistics } from '../utils/reportCalculator';
import { UseReportStatisticsProps, ProjectChartItem, ReportStatisticsResult } from '../types';

export type { UseReportStatisticsProps, ProjectChartItem, ReportStatisticsResult };

export function useReportStatistics(props: UseReportStatisticsProps): ReportStatisticsResult {
  const {
    logs,
    patches,
    projects,
    tasks,
    nowIso,
    reportPeriod,
    reportSort,
    sysSettings,
  } = props;

  return useMemo(
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
    ]
  );
}
