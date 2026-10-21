import { TimeLog } from '@bindings/TimeLog';
import { Task } from '@bindings/Task';
import { PatchLog } from '@bindings/PatchLog';
import { Project } from '@bindings/Project';
import { Settings } from '@bindings/Settings';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';

export type ReportPeriodType =
  | 'today'
  | 'yesterday'
  | 'week'
  | 'lastWeek'
  | 'month'
  | 'lastMonth'
  | 'last30Days'
  | 'year'
  | 'all'
  | 'custom';

export interface UseReportStatisticsProps {
  logs: TimeLog[];
  patches: PatchLog[];
  projects: Project[];
  tasks: Task[];
  nowIso?: string;
  reportPeriod: string;
  reportSort: string;
  sysSettings?: Settings | null;
  customFrom?: string;
  customTo?: string;
}

export interface ProjectChartItem {
  id: string;
  name: string;
  color: string;
  seconds: number;
  tasks: Array<{ task?: Task; seconds: number }>;
}

export interface ReportTopProject {
  id: string;
  name: string;
  color: string;
  seconds: number;
  percentage: number;
}

export interface ReportStatisticsResult {
  todaySec: number;
  weekSec: number;
  monthSec: number;
  periodTotalSec: number;
  dailyAverageSec: number;
  topProject: ReportTopProject | null;
  filteredLogs: TimeLog[];
  projectChart: ProjectChartItem[];
  maxSec: number;
  displayLogs: ClampedTimeLog[] | TimeLog[];
  clampedLogs: ClampedTimeLog[];
}
