import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';

/**
 * Extracts unique, trimmed non-empty tags from an array of projects,
 * sorted alphabetically using standard localeCompare.
 */
export function extractAvailableTags(projects: Project[]): string[] {
  const tagSet = new Set<string>();
  for (const project of projects) {
    if (Array.isArray(project.tags)) {
      for (const rawTag of project.tags) {
        const trimmed = typeof rawTag === 'string' ? rawTag.trim() : '';
        if (trimmed.length > 0) {
          tagSet.add(trimmed);
        }
      }
    }
  }
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}

/**
 * Checks if a project contains at least one of the selected tags.
 * If selectedTags is empty or omitted, returns true (no filtering).
 */
export function projectMatchesTags(
  project: Project | null | undefined,
  selectedTags?: string[]
): boolean {
  if (!selectedTags || selectedTags.length === 0) {
    return true;
  }
  if (!project || !Array.isArray(project.tags) || project.tags.length === 0) {
    return false;
  }
  return project.tags.some((t) => selectedTags.includes(t));
}

/**
 * Filters projects by matching any of the selected tags.
 * If selectedTags is empty or omitted, returns the original projects array unmodified.
 */
export function filterProjectsByTags(
  projects: Project[],
  selectedTags?: string[]
): Project[] {
  if (!selectedTags || selectedTags.length === 0) {
    return projects;
  }
  return projects.filter((project) => projectMatchesTags(project, selectedTags));
}

/**
 * Filters tasks belonging to a set of project IDs.
 */
export function filterTasksByProjectIds(
  tasks: Task[],
  matchingProjectIds: Set<string>
): Task[] {
  return tasks.filter((task) => matchingProjectIds.has(task.projectId));
}

/**
 * Consolidated pure helper to filter time logs or patch logs by matching project IDs.
 * Looks up the task's projectId via taskMap if available, falling back to item's direct projectId.
 *
 * @param items Array of logs or patch items with optional taskId and/or projectId
 * @param matchingProjectIds Set of allowed project IDs
 * @param taskMap Precomputed lookup map or array of tasks
 */
export function filterTimeLogsByTagFilter<
  T extends { taskId?: string | null; projectId?: string }
>(
  items: T[],
  matchingProjectIds: Set<string>,
  taskMap: Map<string, Task> | Task[]
): T[] {
  const map =
    taskMap instanceof Map
      ? taskMap
      : new Map(taskMap.map((t) => [t.id, t]));

  return items.filter((item) => {
    const projId =
      (item.taskId ? map.get(item.taskId)?.projectId : undefined) ??
      item.projectId;
    return projId ? matchingProjectIds.has(projId) : false;
  });
}
