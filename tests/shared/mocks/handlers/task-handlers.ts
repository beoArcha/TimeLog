import { Task } from '@bindings/Task';
import { MockCommandArgs, MockDatabaseState } from '../types';
import { getMockDbState, saveMockDbState } from '../state';

export const addTaskHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const newTask: Task = {
    id: String(100 + state.tasks.length + 1),
    projectId: args.projectId ?? '',
    parentTaskId: args.parentTaskId ?? null,
    name: args.name ?? '',
    createdAt: new Date().toISOString(),
    completed: false,
    status: null,
  };
  state.tasks.push(newTask);
  saveMockDbState(state);
  return state;
};

export const renameTaskHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const task = state.tasks.find((t) => t.id === args.taskId || t.id === args.id);
  if (task) {
    task.name = args.name ?? '';
  }
  saveMockDbState(state);
  return state;
};

export const updateTaskHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const task = state.tasks.find((t) => t.id === args.taskId || t.id === args.id);
  if (task) {
    if (args.name !== undefined) task.name = args.name ?? '';
    if (args.parentTaskId !== undefined) task.parentTaskId = args.parentTaskId ?? null;
    if (args.status !== undefined) task.status = (args.status as Task['status']) ?? null;
    if (args.completed !== undefined) task.completed = args.completed ?? false;
    if (task.completed || task.status === 'Done') {
      const targetId = args.taskId || args.id;
      state.logs = state.logs.map((l) =>
        l.taskId === targetId && !l.endTime
          ? { ...l, endTime: new Date().toISOString() }
          : l
      );
      if (state.activeLog?.taskId === targetId) {
        state.activeLog = null;
      }
    }
  }
  saveMockDbState(state);
  return state;
};

export const deleteTaskHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  if (!args.taskId) return state;

  const toDeleteIds = new Set<string>([args.taskId]);
  let sizeBefore: number;
  do {
    sizeBefore = toDeleteIds.size;
    state.tasks.forEach((t) => {
      if (t.parentTaskId && toDeleteIds.has(t.parentTaskId)) {
        toDeleteIds.add(t.id);
      }
    });
  } while (toDeleteIds.size !== sizeBefore);

  state.tasks = state.tasks.filter((t) => !toDeleteIds.has(t.id));
  state.logs = state.logs.filter((l) => !toDeleteIds.has(l.taskId));
  if (state.activeLog && toDeleteIds.has(state.activeLog.taskId)) {
    state.activeLog = null;
  }
  saveMockDbState(state);
  return state;
};

export const toggleTaskCompleteHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const task = state.tasks.find((t) => t.id === args.taskId);
  if (task) {
    task.completed = !task.completed;
    if (task.completed) {
      state.logs = state.logs.map((l) =>
        l.taskId === args.taskId && !l.endTime
          ? { ...l, endTime: new Date().toISOString() }
          : l
      );
      if (state.activeLog?.taskId === args.taskId) {
        state.activeLog = null;
      }
    }
  }
  saveMockDbState(state);
  return state;
};

export const TASK_HANDLERS: Record<string, (args: MockCommandArgs) => Promise<unknown>> = {
  add_task: addTaskHandler,
  create: addTaskHandler,
  rename_task: renameTaskHandler,
  update_task: updateTaskHandler,
  update: updateTaskHandler,
  delete_task: deleteTaskHandler,
  delete: deleteTaskHandler,
  toggle_task_complete: toggleTaskCompleteHandler,
  toggle_complete: toggleTaskCompleteHandler,
  get_project_id: async (args) => {
    const state = getMockDbState();
    const task = state.tasks.find((t) => t.id === args.taskId);
    if (!task) throw new Error(`Task ${args.taskId} not found`);
    return task.projectId;
  },
  get_subtasks: async (args) => {
    const state = getMockDbState();
    return state.tasks.filter((t) => t.parentTaskId === args.taskId);
  },
};
