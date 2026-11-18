import { useCallback, useMemo, useState } from 'react';
import { Project } from '@bindings/Project';

/**
 * Drops ids of deleted projects so a stale id can never silently narrow the report.
 * Archived projects stay in scope: reporting on finished work is a normal use.
 */
export function resolveReportProjectScope(
  requestedIds: readonly string[],
  projects: readonly Project[]
): string[] {
  const existing = new Set(projects.map((p) => p.id));
  return requestedIds.filter((id) => existing.has(id));
}

/**
 * Report scope independent of the Tasks tab working project.
 * An empty list means all projects.
 */
export function useReportProjectScope(projects: readonly Project[]) {
  const [requestedIds, setRequestedIds] = useState<readonly string[]>([]);

  const reportProjectIds = useMemo(
    () => resolveReportProjectScope(requestedIds, projects),
    [requestedIds, projects]
  );

  const toggleReportProject = useCallback(
    (projectId: string) => {
      setRequestedIds((prev) => {
        const current = resolveReportProjectScope(prev, projects);
        return current.includes(projectId)
          ? current.filter((id) => id !== projectId)
          : [...current, projectId];
      });
    },
    [projects]
  );

  const clearReportProjects = useCallback(() => setRequestedIds([]), []);

  return { reportProjectIds, toggleReportProject, clearReportProjects };
}
