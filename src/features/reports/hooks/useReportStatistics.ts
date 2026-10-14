import { useMemo } from 'react';
import { TimeLog } from '@bindings/TimeLog';
import { PatchLog } from '@bindings/PatchLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { Settings } from '@bindings/Settings';
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
