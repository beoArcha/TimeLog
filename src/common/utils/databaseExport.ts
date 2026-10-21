import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { PatchLog } from '@bindings/PatchLog';

export interface DatabaseExportData {
  version?: number;
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  holidays?: HolidayLeave[];
  patches?: PatchLog[];
}

export function exportDatabaseAsJson(data: DatabaseExportData, filenamePrefix: string = 'OxyFlow_Backup'): void {
  const payload = {
    version: data.version ?? 1,
    projects: data.projects,
    tasks: data.tasks,
    logs: data.logs,
    holidays: data.holidays ?? [],
    patches: data.patches ?? [],
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().substring(0, 10);
  link.download = `${filenamePrefix}_${dateStr}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
