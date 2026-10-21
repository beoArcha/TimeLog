import { Project } from '@bindings/Project';
import { MockCommandArgs, MockDatabaseState } from '../types';
import { getMockDbState, saveMockDbState } from '../state';

export const addProjectHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const newProj: Project = {
    id: String(state.projects.length + 1),
    name: args.name ?? '',
    color: args.color ?? '',
    createdAt: new Date().toISOString(),
    archived: false,
    description: null,
    icon: null,
    tags: null,
  };
  state.projects.push(newProj);
  saveMockDbState(state);
  return state;
};

export const toggleProjectArchiveHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const proj = state.projects.find((p) => p.id === args.projectId);
  if (proj) {
    proj.archived = !proj.archived;
  }
  saveMockDbState(state);
  return state;
};

export const renameProjectHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const proj = state.projects.find((p) => p.id === args.projectId);
  if (proj) {
    proj.name = args.name ?? '';
  }
  saveMockDbState(state);
  return state;
};

export const updateProjectHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const proj = state.projects.find((p) => p.id === args.projectId);
  if (proj) {
    if (args.name !== undefined) proj.name = args.name ?? '';
    if (args.color !== undefined) proj.color = args.color ?? '';
    if (args.description !== undefined) proj.description = args.description ?? null;
    if (args.icon !== undefined) proj.icon = args.icon ?? null;
    if (args.tags !== undefined) proj.tags = args.tags ?? null;
  }
  saveMockDbState(state);
  return state;
};

export const PROJECT_HANDLERS: Record<string, (args: MockCommandArgs) => Promise<unknown>> = {
  add_project: addProjectHandler,
  add: addProjectHandler,
  toggle_project_archive: toggleProjectArchiveHandler,
  toggle_archive: toggleProjectArchiveHandler,
  rename_project: renameProjectHandler,
  rename: renameProjectHandler,
  update_project: updateProjectHandler,
};
