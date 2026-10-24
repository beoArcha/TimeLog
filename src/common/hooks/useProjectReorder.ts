import { useState, useEffect, useMemo, useCallback } from 'react';
import { Project } from '@bindings/Project';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { ErrorHandler } from '@common/exceptions/ErrorHandler';

export interface UseProjectReorderProps {
  projects: Project[];
  onOrderChange?: (newOrder: string[]) => void;
}

export function useProjectReorder({ projects, onOrderChange }: UseProjectReorderProps) {
  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    PersistenceRouter.getInstance()
      .uiState.getProjectOrder()
      .then((loadedOrder) => {
        if (isMounted && loadedOrder.length > 0) {
          setOrder(loadedOrder);
        }
      })
      .catch((err) => {
        ErrorHandler.handle(err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const orderedProjects = useMemo(() => {
    if (projects.length === 0) return [];
    if (order.length === 0) return projects;

    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const result: Project[] = [];

    for (const id of order) {
      const p = projectMap.get(id);
      if (p) {
        result.push(p);
        projectMap.delete(id);
      }
    }

    for (const p of projects) {
      if (projectMap.has(p.id)) {
        result.push(p);
      }
    }

    return result;
  }, [projects, order]);

  const moveProject = useCallback(
    (projectId: string, direction: 'up' | 'down') => {
      const currentIndex = orderedProjects.findIndex((p) => p.id === projectId);
      if (currentIndex === -1) return;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= orderedProjects.length) return;

      const updated = [...orderedProjects];
      const [moved] = updated.splice(currentIndex, 1);
      updated.splice(targetIndex, 0, moved);

      const newOrder = updated.map((p) => p.id);
      setOrder(newOrder);
      onOrderChange?.(newOrder);

      PersistenceRouter.getInstance()
        .uiState.saveProjectOrder(newOrder)
        .catch((err) => {
          ErrorHandler.handle(err);
        });
    },
    [orderedProjects, onOrderChange]
  );

  const isFirst = useCallback(
    (projectId: string) => orderedProjects[0]?.id === projectId,
    [orderedProjects]
  );

  const isLast = useCallback(
    (projectId: string) =>
      orderedProjects.length > 0 &&
      orderedProjects[orderedProjects.length - 1]?.id === projectId,
    [orderedProjects]
  );

  return {
    orderedProjects,
    order,
    moveProject,
    isFirst,
    isLast,
  };
}
