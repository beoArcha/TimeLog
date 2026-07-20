import { useMemo } from 'react';
import { TimeLog } from '@bindings/TimeLog';
import { PatchLog } from '@bindings/PatchLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { Settings } from '@bindings/Settings';
import { calculateReportStatistics } from '../utils/reportCalculator';

interface UseReportStatisticsProps {
  logs: TimeLog[];
  patches: PatchLog[];
  projects: Project[];
  tasks: Task[];
  nowIso: string;
  reportPeriod: string;
  reportSort: string;
  sysSettings?: Settings | null;
}

export interface ProjectChartItem {
  id: string;
  name: string;
  color: string;
  seconds: number;
  tasks: Array<{ task?: Task; seconds: number }>;
}

export interface ReportStatisticsResult {
  todaySec: number;
  weekSec: number;
  monthSec: number;
  filteredLogs: TimeLog[];
  projectChart: ProjectChartItem[];
  maxSec: number;
  displayLogs: TimeLog[];
}

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
