import { type SetStateAction } from 'react';
import { Project } from '@bindings/Project';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { EngineRouter } from '@common/engine/EngineRouter';
import { RepositoryStateHook } from './useRepositoryState';
import { AsyncActionRunnerHook } from './useAsyncActionRunner';

export interface UseProjectsManagerOptions {
  repositoryState: RepositoryStateHook;
  actionRunner: AsyncActionRunnerHook;
  refreshComputedMetrics: (nowIso?: string) => Promise<unknown>;
}

export const useProjectsManager = ({
  repositoryState,
  actionRunner,
  refreshComputedMetrics,
}: UseProjectsManagerOptions) => {
  const handleAddProject = async (
    name: string,
    color: string,
    description: string | null = null,
    icon: string | null = null,
    tags: string[] | null = null
  ) => {
    await actionRunner.runAction('Failed to add project', async () => {
      await EngineRouter.getInstance().validation.validateProjectName(name, repositoryState.projects);
      const nextState = await PersistenceRouter.getInstance().projects.add({ name, color, description, icon, tags });
      repositoryState.setProjectsState(nextState.projects);
      await refreshComputedMetrics();
    });
  };

  const handleToggleProjectArchive = async (projectId: string) => {
    await actionRunner.runAction('Failed to toggle project archive', async () => {
      const nextState = await PersistenceRouter.getInstance().projects.toggleArchive(projectId);
      repositoryState.setProjectsState(nextState.projects);
      repositoryState.setLogsState(nextState.logs);
      repositoryState.setActiveLogState(nextState.activeLog);
      await refreshComputedMetrics();
    });
  };

  const handleUpdateProject = async (
    projectId: string,
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null
  ) => {
    await actionRunner.runAction('Failed to update project', async () => {
      await EngineRouter.getInstance().validation.validateProjectName(name, repositoryState.projects, projectId);
      const nextState = await PersistenceRouter.getInstance().projects.update(projectId, name, color, description, icon, tags);
      repositoryState.setProjectsState(nextState.projects);
      await refreshComputedMetrics();
    });
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
    await actionRunner.runAction('Failed to rename project', async () => {
      await EngineRouter.getInstance().validation.validateProjectName(newName, repositoryState.projects, projectId);
      const nextState = await PersistenceRouter.getInstance().projects.rename(projectId, newName);
      repositoryState.setProjectsState(nextState.projects);
      await refreshComputedMetrics();
    });
  };

  const setProjects = async (action: SetStateAction<Project[]>) => {
    await actionRunner.runAction(
      'Failed to set projects',
      async () => {
        const resolved = typeof action === 'function' ? action(repositoryState.projects) : action;
        const nextState = await PersistenceRouter.getInstance().core.overrideState({ projects: resolved });
        repositoryState.setProjectsState(nextState.projects);
        await refreshComputedMetrics();
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
  };
};

export type ProjectsManagerHook = ReturnType<typeof useProjectsManager>;
