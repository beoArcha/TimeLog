import { useMemo } from 'react';

import { calculateReportStatistics } from '../utils/reportCalculator';
import { UseReportStatisticsProps, ProjectChartItem, ReportStatisticsResult } from '../types';

export type { UseReportStatisticsProps, ProjectChartItem, ReportStatisticsResult };

export function useReportStatistics(props: UseReportStatisticsProps): ReportStatisticsResult {
  return useMemo(
    () => calculateReportStatistics(props),
    [
      props.logs,
      props.patches,
      props.projects,
      props.tasks,
      props.nowIso,
      props.reportPeriod,
      props.reportSort,
      props.sysSettings?.includePatchesInReports,
    ]
  );
}
