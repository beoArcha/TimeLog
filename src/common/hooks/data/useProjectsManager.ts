import { type SetStateAction } from 'react';
import { Project } from '@bindings/Project';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { EngineRouter } from '@common/engine/EngineRouter';
import { RepositoryStateHook } from './useRepositoryState';
import { AsyncActionRunnerHook } from './useAsyncActionRunner';

export interface ProjectInputData {
  name: string;
  color: string;
  description?: string | null;
  icon?: string | null;
  tags?: string[] | null;
  allowConcurrency?: boolean | null;
}

export interface UseProjectsManagerOptions {
  repositoryState: RepositoryStateHook;
  actionRunner: AsyncActionRunnerHook;
  refreshComputedMetrics: (nowIso?: string) => Promise<unknown>;
  engineRouter?: EngineRouter;
  persistenceRouter?: PersistenceRouter;
}

export const useProjectsManager = ({
  repositoryState,
  actionRunner,
  refreshComputedMetrics,
  engineRouter = EngineRouter.getInstance(),
  persistenceRouter = PersistenceRouter.getInstance(),
}: UseProjectsManagerOptions) => {
  const syncState = async (nextState: TimerRepositoryState) => {
    repositoryState.syncRepositoryState(nextState);
    await refreshComputedMetrics();
  };

  const shouldCascadeStopTimer = (projectId: string): boolean => {
    const project = repositoryState.projects.find((p) => p.id === projectId);
    const willArchive = project ? !project.archived : false;
    return willArchive && repositoryState.activeLog?.projectId === projectId;
  };

  const handleAddProject = async (
    nameOrInput: string | ProjectInputData,
    color = 'indigo',
    description: string | null = null,
    icon: string | null = null,
    tags: string[] | null = null,
    allowConcurrency: boolean | null = null
  ) => {
    const input: ProjectInputData =
      typeof nameOrInput === 'object'
        ? nameOrInput
        : { name: nameOrInput, color, description, icon, tags, allowConcurrency };

    await actionRunner.runAction('Failed to add project', async () => {
      await engineRouter.validation.validateProjectName(input.name, repositoryState.projects);
      const nextState = await persistenceRouter.projects.add(input);
      await syncState(nextState);
    });
  };

  const handleToggleProjectArchive = async (projectId: string) => {
    await actionRunner.runAction('Failed to toggle project archive', async () => {
      if (shouldCascadeStopTimer(projectId)) {
        await engineRouter.timer.stopTimer(projectId);
      }
      const nextState = await persistenceRouter.projects.toggleArchive(projectId);
      await syncState(nextState);
    });
  };

  const handleUpdateProject = async (
    projectId: string,
    nameOrInput: string | (Omit<ProjectInputData, 'name'> & { name: string }),
    color?: string,
    description: string | null = null,
    icon: string | null = null,
    tags: string[] | null = null,
    allowConcurrency: boolean | null = null
  ) => {
    const input: ProjectInputData =
      typeof nameOrInput === 'object'
        ? nameOrInput
        : { name: nameOrInput, color: color ?? 'indigo', description, icon, tags, allowConcurrency };

    await actionRunner.runAction('Failed to update project', async () => {
      await engineRouter.validation.validateProjectName(input.name, repositoryState.projects, projectId);
      const nextState = await persistenceRouter.projects.update(
        projectId,
        input.name,
        input.color,
        input.description ?? null,
        input.icon ?? null,
        input.tags ?? null,
        input.allowConcurrency ?? null
      );
      await syncState(nextState);
    });
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
    await actionRunner.runAction('Failed to rename project', async () => {
      await engineRouter.validation.validateProjectName(newName, repositoryState.projects, projectId);
      const nextState = await persistenceRouter.projects.rename(projectId, newName);
      await syncState(nextState);
    });
  };

  const handleDeleteProject = async (projectId: string) => {
    await actionRunner.runAction('Failed to delete project', async () => {
      const nextState = await persistenceRouter.projects.delete(projectId);
      await syncState(nextState);
    });
  };

  const setProjects = async (action: SetStateAction<Project[]>) => {
    await actionRunner.runAction(
      'Failed to set projects',
      async () => {
        const resolved = typeof action === 'function' ? action(repositoryState.projects) : action;
        const nextState = await persistenceRouter.core.overrideState({ projects: resolved });
        await syncState(nextState);
      },
      { withLoading: false }
    );
  };

  return {
    projects: repositoryState.projects,
    setProjects,
    handleAddProject,
    handleToggleProjectArchive,
    handleUpdateProject,
    handleRenameProject,
    handleDeleteProject,
  };
};

export type ProjectsManagerHook = ReturnType<typeof useProjectsManager>;
