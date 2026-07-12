import { STORAGE_KEYS } from '@common/constants';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { MockDatabaseState, MockCommandArgs } from './types';

const STATE_DB_KEY = STORAGE_KEYS.STATE_DB;

export const getMockDbState = (): MockDatabaseState => {
  const rawState = localStorage.getItem(STATE_DB_KEY);
  let state: Partial<MockDatabaseState> | null = null;
  if (rawState) {
    try {
      state = JSON.parse(rawState) as Partial<MockDatabaseState>;
    } catch {
      // Ignore parsing error
    }
  }

  return {
    projects: state?.projects ?? [],
    tasks: state?.tasks ?? [],
    logs: state?.logs ?? [],
    activeLog: state?.activeLog ?? null,
  };
};

export const saveMockDbState = (state: MockDatabaseState): void => {
  localStorage.setItem(STATE_DB_KEY, JSON.stringify(state));
};

const addProjectHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const newProj: Project = {
    id: String(state.projects.length + 1),
    name: args.name ?? '',
    color: args.color ?? '',
    createdAt: new Date().toISOString(),
    archived: false,
    description: null,
    icon: null,
    tags: null
  };
  state.projects.push(newProj);
  saveMockDbState(state);
  return state;
};

const toggleProjectArchiveHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const proj = state.projects.find((p) => p.id === args.projectId);
  if (proj) {
    proj.archived = !proj.archived;
  }
  saveMockDbState(state);
  return state;
};

const addTaskHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const newTask: Task = {
    id: String(100 + state.tasks.length + 1),
    projectId: args.projectId ?? '',
    parentTaskId: args.parentTaskId ?? null,
    name: args.name ?? '',
    createdAt: new Date().toISOString(),
    completed: false,
    status: null
  };
  state.tasks.push(newTask);
  saveMockDbState(state);
  return state;
};

const renameProjectHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const proj = state.projects.find((p) => p.id === args.projectId);
  if (proj) {
    proj.name = args.name ?? '';
  }
  saveMockDbState(state);
  return state;
};

const renameTaskHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const task = state.tasks.find((t) => t.id === args.taskId || t.id === args.id);
  if (task) {
    task.name = args.name ?? '';
  }
  saveMockDbState(state);
  return state;
};

const deleteTaskHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
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

const toggleTaskCompleteHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
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

const startTimerHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const taskId = args.taskId;
  if (!taskId) return state;

  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return state;

  const isRunning = state.logs.some((l) => l.taskId === taskId && !l.endTime);
  if (isRunning) {
    state.logs = state.logs.map((l) => {
      if (l.taskId === taskId && !l.endTime) {
        return { ...l, endTime: new Date().toISOString() };
      }
      return l;
    });
    if (state.activeLog?.taskId === taskId) {
      state.activeLog = null;
    }
    saveMockDbState(state);
    return state;
  }

  const parentId = task.parentTaskId;
  state.logs = state.logs.map((l) => {
    if (!l.endTime) {
      if (parentId && l.taskId === parentId) return l;
      return { ...l, endTime: new Date().toISOString() };
    }
    return l;
  });

  const newLog: TimeLog = {
    id: 'log_' + (state.logs.length + 1),
    taskId,
    projectId: task.projectId,
    startTime: new Date().toISOString(),
    endTime: null,
    note: null,
    editHistory: null
  };
  state.logs.push(newLog);
  state.activeLog = newLog;

  if (parentId) {
    const isParentRunning = state.logs.some((l) => l.taskId === parentId && !l.endTime);
    if (!isParentRunning) {
      const parentTask = state.tasks.find((t) => t.id === parentId);
      if (parentTask) {
        state.logs.push({
          id: 'log_m_' + (state.logs.length + 1),
          taskId: parentId,
          projectId: parentTask.projectId,
          startTime: new Date().toISOString(),
          endTime: null,
          note: null,
          editHistory: null
        });
      }
    }
  }

  saveMockDbState(state);
  return state;
};

const stopTimerHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  state.logs = state.logs.map((l) => {
    if (!l.endTime && (!args.projectId || l.projectId === args.projectId)) {
      return { ...l, endTime: new Date().toISOString() };
    }
    return l;
  });
  if (state.activeLog && (!args.projectId || state.activeLog.projectId === args.projectId)) {
    state.activeLog = null;
  }
  saveMockDbState(state);
  return state;
};

const resetDatabaseHandler = async (): Promise<MockDatabaseState> => {
  const rawState = localStorage.getItem(STATE_DB_KEY);
  let raw: Record<string, unknown> = {};
  if (rawState) {
    try {
      raw = JSON.parse(rawState) as Record<string, unknown>;
    } catch {
      // Ignore parsing error
    }
  }
  delete raw.projects;
  delete raw.tasks;
  delete raw.logs;
  delete raw.activeLog;
  localStorage.setItem(STATE_DB_KEY, JSON.stringify(raw));
  return { projects: [], tasks: [], logs: [], activeLog: null };
};

const editTimeLogHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const logId = args.id;
  if (!logId) return state;

  const log = state.logs.find((l) => l.id === logId);
  if (log) {
    log.taskId = args.taskId ?? log.taskId;
    log.startTime = args.startTime ?? log.startTime;
    log.endTime = args.endTime !== undefined ? args.endTime : log.endTime;
    log.note = args.note !== undefined ? args.note : log.note;

    const historyItem = {
      editedAt: new Date().toISOString(),
      prevStartTime: args.startTime ?? '',
      prevEndTime: args.endTime ?? null,
      prevNote: args.note ?? null,
      reason: args.reason || 'Korekta'
    };
    log.editHistory = log.editHistory ? [...log.editHistory, historyItem] : [historyItem];
  }
  saveMockDbState(state);
  return state;
};

export const BACKEND_HANDLERS: Record<string, (args: MockCommandArgs) => Promise<unknown>> = {
  override_state: async (args) => {
    const state = getMockDbState();
    const newState = { ...state, ...args.state };
    saveMockDbState(newState);
    return newState;
  },
  get_timer_state: async () => {
    return getMockDbState();
  },
  get_state: async () => {
    return getMockDbState();
  },
  get: async () => {
    const saved = localStorage.getItem('timelog_persistence_plugin_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Ignore parsing error
      }
    }
    const theme = localStorage.getItem('oxytime_theme') || 'system';
    const textAndIconSize = localStorage.getItem('oxytime_text_icon_size') || 'medium';
    const guiVariant = localStorage.getItem('oxytime_gui_variant') || 'large';
    const alwaysOnTopSmall = localStorage.getItem('oxytime_always_on_top_small') === 'true';
    const alwaysOnTopMain = localStorage.getItem('oxytime_always_on_top_main') === 'true';
    const minimizeToTray = localStorage.getItem('oxytime_min_to_tray') !== 'false';
    let autoStart = false;
    let autoPauseOnSleep = true;
    let includePatchesInReports = true;
    const sysSaved = localStorage.getItem('oxytime_sys_settings');
    if (sysSaved) {
      try {
        const parsed = JSON.parse(sysSaved) as Record<string, boolean>;
        autoStart = parsed.autoStart ?? false;
        autoPauseOnSleep = parsed.autoPauseOnSleep ?? true;
        includePatchesInReports = parsed.includePatchesInReports ?? true;
      } catch {
        // Ignore parsing error
      }
    }
    return {
      autoStart,
      autoPauseOnSleep,
      includePatchesInReports,
      activeSinks: ['Csv'],
      theme,
      textAndIconSize,
      guiVariant,
      alwaysOnTopSmall,
      alwaysOnTopMain,
      minimizeToTray,
    };
  },
  save: async (args) => {
    if (args.settings) {
      localStorage.setItem('timelog_persistence_plugin_settings', JSON.stringify(args.settings));
    }
    return Promise.resolve();
  },
  add_project: addProjectHandler,
  add: addProjectHandler,
  toggle_project_archive: toggleProjectArchiveHandler,
  toggle_archive: toggleProjectArchiveHandler,
  add_task: addTaskHandler,
  create: addTaskHandler,
  rename_project: renameProjectHandler,
  rename: renameProjectHandler,
  rename_task: renameTaskHandler,
  update: renameTaskHandler,
  delete_task: deleteTaskHandler,
  delete: deleteTaskHandler,
  toggle_task_complete: toggleTaskCompleteHandler,
  toggle_complete: toggleTaskCompleteHandler,
  start_timer: startTimerHandler,
  stop_timer: stopTimerHandler,
  reset_database: resetDatabaseHandler,
  reset: resetDatabaseHandler,
  edit_time_log: editTimeLogHandler,
};
