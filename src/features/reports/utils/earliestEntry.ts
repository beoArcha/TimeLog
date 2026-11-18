import type { PatchLog } from '@bindings/PatchLog';
import type { Task } from '@bindings/Task';
import type { TimeLog } from '@bindings/TimeLog';
import { createProjectAttribution } from '@plugins/engine/metrics/projectAttribution';

interface EarliestEntryScope {
  logs: readonly TimeLog[];
  patches: readonly PatchLog[];
  tasks: readonly Task[];
  /** Same project scope the engine filter applies; `null` keeps every entry. */
  projectIds: readonly string[] | null;
  includePatches: boolean;
}

/** ISO start of the earliest log (and patch, when reports include them) the report scope can contain. */
export function findEarliestEntryStart({
  logs,
  patches,
  tasks,
  projectIds,
  includePatches,
}: EarliestEntryScope): string | null {
  const resolveProjectId = createProjectAttribution(tasks);
  const inScope = (taskId: string | null | undefined, ownProjectId: string): boolean =>
    !projectIds || projectIds.includes(resolveProjectId(taskId, ownProjectId));

  const starts = [
    ...logs.filter((log) => inScope(log.taskId, log.projectId)).map((log) => log.startTime),
    ...(includePatches ? patches.filter((patch) => inScope(patch.taskId, patch.projectId)) : []).map(
      (patch) => patch.startTime
    ),
  ];

  return starts.reduce<string | null>(
    (earliest, start) => (earliest === null || Date.parse(start) < Date.parse(earliest) ? start : earliest),
    null
  );
}
