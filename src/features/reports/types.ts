import { TimeLog } from '@bindings/TimeLog';
import { Task } from '@bindings/Task';
import { PatchLog } from '@bindings/PatchLog';
import { Project } from '@bindings/Project';
import { Settings } from '@bindings/Settings';

export interface UseReportStatisticsProps {
  logs: TimeLog[];
  patches: PatchLog[];
  projects: Project[];
  tasks: Task[];
  nowIso?: string;
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
