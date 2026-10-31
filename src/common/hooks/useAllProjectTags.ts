import { useMemo } from 'react';
import { useDataSafe } from './DataContext';

/**
 * Aggregates unique tags across all projects from DataContext.
 * Filters empty or whitespace-only tags, deduplicates while preserving letter case,
 * and sorts them alphabetically.
 */
export function useAllProjectTags(): string[] {
  const data = useDataSafe();

  return useMemo(() => {
    const projects = data?.projects ?? [];
    const tagSet = new Set<string>();

    for (const project of projects) {
      const projectTags = Array.isArray(project.tags) ? project.tags : [];
      for (const rawTag of projectTags) {
        const trimmed = typeof rawTag === 'string' ? rawTag.trim() : '';
        if (trimmed.length > 0) {
          tagSet.add(trimmed);
        }
      }
    }

    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [data?.projects]);
}

export default useAllProjectTags;
