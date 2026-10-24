import { SandboxEmulatorStore } from './sandboxEmulatorStore';
import { TerminalOutput } from '../utils/terminalOutput';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { resolveEntity } from '../resolver/entityResolver';

export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

/**
 * Parses command tokens into positional arguments and key-value/boolean flags.
 */
export function parseFlags(tokens: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith('--')) {
      const eqIdx = token.indexOf('=');
      if (eqIdx !== -1) {
        flags[token.slice(2, eqIdx)] = token.slice(eqIdx + 1);
        continue;
      }
      const key = token.slice(2);
      const next = tokens[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else if (token.startsWith('-') && token.length > 1) {
      const key = token.slice(1);
      const next = tokens[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positionals.push(token);
    }
  }

  return { positionals, flags };
}

/**
 * Maps legacy shorthand and flat commands to canonical noun-verb command structure.
 */
export function normalizeLegacyCommand(tokens: string[]): string[] {
  if (tokens.length === 0) return tokens;

  const cmd = tokens[0].toLowerCase();
  const rest = tokens.slice(1);

  if (cmd === 'addproject') {
    return ['project', 'add', ...rest];
  }
  if (cmd === 'renameproject') {
    return ['project', 'rename', ...rest];
  }
  if (cmd === 'addtask') {
    const pId = rest[0];
    const name = rest[1];
    if (pId && name) {
      return ['task', 'add', name, '-p', pId];
    }
    return ['task', 'add', ...rest];
  }
  if (cmd === 'addsubtask') {
    const parent = rest[0];
    const name = rest[1];
    if (parent && name) {
      return ['task', 'add', name, '-P', parent];
    }
    return ['task', 'add', ...rest];
  }
  if (cmd === 'complete') {
    return ['task', 'done', ...rest];
  }
  if (cmd === 'renametask') {
    return ['task', 'rename', ...rest];
  }
  if (cmd === 'tasks') {
    if (rest[0]) {
      return ['task', 'list', '-p', rest[0]];
    }
    return ['task', 'list'];
  }
  if (cmd === 'projects' || cmd === 'projlist') {
    return ['project', 'list', ...rest];
  }

  return tokens;
}

function handleProjectList(
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const showAll = Boolean(flags['a'] || flags['all']);
  const allProjects = store.getProjects();
  const projects = showAll ? allProjects : allProjects.filter((p) => !p.archived);

  if (projects.length === 0) {
    output.info('No projects found in sandbox.');
    return;
  }

  const metrics = store.getComputedMetrics();
  output.info('┌──────┬────────────────────────────────┬────────────────────────┐');
  output.info('│ ID   │ Name                           │ Total Time             │');
  output.info('├──────┼────────────────────────────────┼────────────────────────┤');
  for (const p of projects) {
    const totalSecs = metrics?.projects[p.id]?.totalElapsedSeconds ?? 0;
    const timeStr = formatSeconds(totalSecs);
    const idCol = p.id.padEnd(4);
    const nameCol = p.name.slice(0, 30).padEnd(30);
    const timeCol = timeStr.padEnd(22);
    const archivedMark = p.archived ? ' [archived]' : '';
    output.output(`│ ${idCol} │ ${nameCol} │ ${timeCol} │${archivedMark}`);
  }
  output.info('└──────┴────────────────────────────────┴────────────────────────┘');
}

function handleProjectAdd(
  positionals: string[],
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const name = positionals[0];
  if (!name) {
    output.error('Error: Project name is required. Usage: project add <name> [-c <color>]');
    return;
  }
  const color = (flags['c'] || flags['color'] || 'indigo') as string;
  const project = store.handleAddProject(name, color);
  output.success(`Project created: "${project.name}" [ID: ${project.id}] (color: ${project.color})`);
}

function handleProjectRename(
  positionals: string[],
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const target = positionals[0];
  const newName = positionals[1];
  const color = (flags['c'] || flags['color']) as string | undefined;

  if (!target) {
    output.error('Error: Project target is required. Usage: project rename <target> [new_name] [-c <color>]');
    return;
  }

  const projects = store.getProjects();
  const resolve = resolveEntity(projects, target, 'Project', (p) => p.id, (p) => p.name);
  if (!resolve.entity) {
    output.error(resolve.error || `Error: Project "${target}" not found.`);
    return;
  }

  const project = resolve.entity;
  const finalName = newName || project.name;
  store.handleRenameProject(project.id, finalName, color);
  output.success(`Project updated: "${finalName}" [ID: ${project.id}]`);
}

function handleProjectArchive(
  positionals: string[],
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const target = positionals[0];
  if (!target) {
    output.error('Error: Project target is required. Usage: project archive <target>');
    return;
  }

  const projects = store.getProjects();
  const resolve = resolveEntity(projects, target, 'Project', (p) => p.id, (p) => p.name);
  if (!resolve.entity) {
    output.error(resolve.error || `Error: Project "${target}" not found.`);
    return;
  }

  const project = resolve.entity;
  store.handleArchiveProject(project.id);
  const status = project.archived ? 'unarchived' : 'archived';
  output.success(`Project "${project.name}" [ID: ${project.id}] has been ${status}.`);
}

function handleTaskList(
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const showAll = Boolean(flags['a'] || flags['all']);
  const projTarget = (flags['p'] || flags['project']) as string | undefined;

  let filteredProjects = store.getProjects();
  if (projTarget) {
    const resolve = resolveEntity(filteredProjects, projTarget, 'Project', (p) => p.id, (p) => p.name);
    if (!resolve.entity) {
      output.error(resolve.error || `Error: Project "${projTarget}" not found.`);
      return;
    }
    filteredProjects = [resolve.entity];
  }

  const allTasks = store.getTasks();
  const selectedTaskId = store.getSelectedTaskId();
  const metrics = store.getComputedMetrics();

  for (const proj of filteredProjects) {
    let projTasks = allTasks.filter((t) => t.projectId === proj.id);
    if (!showAll) {
      projTasks = projTasks.filter((t) => !t.archived);
    }
    const rootTasks = projTasks.filter((t) => !t.parentTaskId);

    if (rootTasks.length === 0) {
      output.info(`${proj.name}: No tasks found.`);
      continue;
    }

    output.success(`Tasks for ${proj.name} [ID: ${proj.id}]:`);
    for (const root of rootTasks) {
      const statusSymbol = root.completed ? '[X]' : '[ ]';
      const rootSecs = metrics?.tasks[root.id]?.elapsedSeconds ?? 0;
      const duration = formatSeconds(rootSecs);
      const isSelected = root.id === selectedTaskId ? ' (Selected)' : '';
      const text = `${statusSymbol} ID: ${root.id.padEnd(6)} - ${root.name} (${duration})${isSelected}`;
      if (root.completed) {
        output.info(text);
      } else {
        output.output(text);
      }

      const subtasks = projTasks.filter((t) => t.parentTaskId === root.id);
      for (const sub of subtasks) {
        const subStatus = sub.completed ? '[X]' : '[ ]';
        const subSecs = metrics?.tasks[sub.id]?.elapsedSeconds ?? 0;
        const subDuration = formatSeconds(subSecs);
        const isSubSelected = sub.id === selectedTaskId ? ' (Selected)' : '';
        output.info(`      ↳ ${subStatus} ID: ${sub.id.padEnd(6)} - ${sub.name} (${subDuration})${isSubSelected}`);
      }
    }
  }
}

function handleTaskAdd(
  positionals: string[],
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const name = positionals[0];
  if (!name) {
    output.error('Error: Task name is required. Usage: task add <name> -p <proj> [-P <parent>]');
    return;
  }

  const projTarget = (flags['p'] || flags['project']) as string | undefined;
  const parentTarget = (flags['P'] || flags['parent']) as string | undefined;

  let parentTaskId: string | null = null;
  let targetProjectId: string | undefined;

  if (parentTarget) {
    const tasks = store.getTasks();
    const resolveParent = resolveEntity(tasks, parentTarget, 'Task', (t) => t.id, (t) => t.name);
    if (!resolveParent.entity) {
      output.error(resolveParent.error || `Error: Parent task "${parentTarget}" not found.`);
      return;
    }
    parentTaskId = resolveParent.entity.id;
    targetProjectId = resolveParent.entity.projectId;
  }

  if (projTarget) {
    const projects = store.getProjects();
    const resolveProj = resolveEntity(projects, projTarget, 'Project', (p) => p.id, (p) => p.name);
    if (!resolveProj.entity) {
      output.error(resolveProj.error || `Error: Project "${projTarget}" not found.`);
      return;
    }
    targetProjectId = resolveProj.entity.id;
  }

  if (!targetProjectId) {
    const firstProj = store.getProjects()[0];
    if (!firstProj) {
      output.error('Error: No project available. Create a project first with "project add <name>".');
      return;
    }
    targetProjectId = firstProj.id;
  }

  const task = store.handleAddTask(targetProjectId, name, parentTaskId);
  const typeLabel = parentTaskId ? 'Subtask' : 'Task';
  output.success(`${typeLabel} created: "${task.name}" [ID: ${task.id}]`);
}

function handleTaskDone(
  positionals: string[],
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const target = positionals[0];
  if (!target) {
    output.error('Error: Task target is required. Usage: task done <target>');
    return;
  }

  const tasks = store.getTasks();
  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name);
  if (!resolve.entity) {
    output.error(resolve.error || `Error: Task "${target}" not found.`);
    return;
  }

  const task = resolve.entity;
  store.handleToggleTaskComplete(task.id);
  const state = task.completed ? 'completed' : 'uncompleted';
  output.success(`Task "${task.name}" [ID: ${task.id}] marked as ${state}.`);
}

function handleTaskRename(
  positionals: string[],
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const target = positionals[0];
  const newName = positionals[1];

  if (!target || !newName) {
    output.error('Error: Task target and new name required. Usage: task rename <target> <new_name>');
    return;
  }

  const tasks = store.getTasks();
  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name);
  if (!resolve.entity) {
    output.error(resolve.error || `Error: Task "${target}" not found.`);
    return;
  }

  store.handleRenameTask(resolve.entity.id, newName);
  output.success(`Task renamed: "${newName}" [ID: ${resolve.entity.id}]`);
}

function handleTaskArchive(
  positionals: string[],
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const target = positionals[0];
  if (!target) {
    output.error('Error: Task target is required. Usage: task archive <target>');
    return;
  }

  const tasks = store.getTasks();
  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name);
  if (!resolve.entity) {
    output.error(resolve.error || `Error: Task "${target}" not found.`);
    return;
  }

  store.handleArchiveTask(resolve.entity.id);
  const status = resolve.entity.archived ? 'unarchived' : 'archived';
  output.success(`Task "${resolve.entity.name}" [ID: ${resolve.entity.id}] has been ${status}.`);
}

function handleStatus(
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const activeLog = store.getActiveLog();
  if (!activeLog) {
    output.info('Timer status: Idle (no active timer)');
    return;
  }

  const tasks = store.getTasks();
  const projects = store.getProjects();
  const task = tasks.find((t) => t.id === activeLog.taskId);
  const project = projects.find((p) => p.id === activeLog.projectId);
  const startMs = new Date(activeLog.startTime).getTime();
  const elapsedSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));

  output.success(
    `Timer status: Active ▶ "${task?.name || 'Unknown'}" [${project?.name || 'General'}] (${formatSeconds(elapsedSecs)})`
  );
}

function handleStart(
  positionals: string[],
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const target = positionals.join(' ').trim();
  const activeLog = store.getActiveLog();

  if (!target) {
    if (activeLog) {
      handleStatus(store, output);
    } else {
      output.error('Error: No target task specified. Usage: start <task_id | "task name">');
    }
    return;
  }

  const tasks = store.getTasks();
  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name);
  if (!resolve.entity) {
    output.error(resolve.error || `Error: Task "${target}" does not exist`);
    return;
  }

  const task = resolve.entity;
  if (task.completed) {
    output.error(`Error: Cannot start timer on completed task "${task.name}". Mark it incomplete first.`);
    return;
  }

  store.handleStartTimer(task.id);
  output.success(`▶️ Timer started: "${task.name}" [ID: ${task.id}]`);
}

function handleStop(
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const activeLog = store.getActiveLog();
  const isAll = Boolean(flags['all']);

  if (!activeLog) {
    output.error('Error: No active timer session is currently running');
    return;
  }

  const tasks = store.getTasks();
  const task = tasks.find((t) => t.id === activeLog.taskId);
  store.handleStopTimer();

  if (isAll) {
    output.success('⏹️ Stopped all active sessions (1 session stopped).');
  } else {
    output.success(`⏹️ Timer stopped: "${task?.name || 'Unknown'}".`);
  }
}

function handleSwitch(
  positionals: string[],
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const target = positionals.join(' ').trim();
  if (!target) {
    output.error('Error: Target task required to switch. Usage: switch <task_id | "task name">');
    return;
  }

  const tasks = store.getTasks();
  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name);
  if (!resolve.entity) {
    output.error(resolve.error || `Error: Task "${target}" does not exist`);
    return;
  }

  const task = resolve.entity;
  if (task.completed) {
    output.error(`Error: Cannot switch to completed task "${task.name}".`);
    return;
  }

  store.handleSwitchTimer(task.id);
  output.success(`🔀 Switched active timer to: "${task.name}" [ID: ${task.id}]`);
}

function handleToday(
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const logs = store.getLogs();
  const tasks = store.getTasks();
  const projects = store.getProjects();

  const todayDate = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter((l) => l.startTime.startsWith(todayDate));

  if (todayLogs.length === 0) {
    output.info(`No time logs recorded for today (${todayDate}).`);
    return;
  }

  let totalSeconds = 0;
  output.info(`── Today's Progress (${todayDate}) ──────────────────────────`);

  for (const log of todayLogs) {
    const startMs = new Date(log.startTime).getTime();
    const endMs = log.endTime ? new Date(log.endTime).getTime() : Date.now();
    const durSecs = Math.max(0, Math.floor((endMs - startMs) / 1000));
    totalSeconds += durSecs;

    const task = tasks.find((t) => t.id === log.taskId);
    const project = task ? projects.find((p) => p.id === task.projectId) : null;

    output.output(`• [${project?.name || 'General'}] ${task?.name || 'Unknown'} - ${formatSeconds(durSecs)}`);
  }

  output.info('─────────────────────────────────────────────────────────');
  output.success(`Total Today: ${formatSeconds(totalSeconds)} (${todayLogs.length} session(s))`);
}

function handleLogList(
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  let logs = store.getLogs();
  const tasks = store.getTasks();
  const projects = store.getProjects();

  if (flags['today']) {
    const today = new Date().toISOString().slice(0, 10);
    logs = logs.filter((l) => l.startTime.startsWith(today));
  }

  const projFilter = (flags['p'] || flags['project']) as string | undefined;
  if (projFilter) {
    const resolve = resolveEntity(projects, projFilter, 'Project', (p) => p.id, (p) => p.name);
    if (resolve.entity) {
      logs = logs.filter((l) => l.projectId === resolve.entity?.id);
    }
  }

  const taskFilter = (flags['t'] || flags['task']) as string | undefined;
  if (taskFilter) {
    const resolve = resolveEntity(tasks, taskFilter, 'Task', (t) => t.id, (t) => t.name);
    if (resolve.entity) {
      logs = logs.filter((l) => l.taskId === resolve.entity?.id);
    }
  }

  const limit = flags['limit'] ? parseInt(String(flags['limit']), 10) : 20;
  logs = logs.slice(-limit);

  if (logs.length === 0) {
    output.info('No time logs found matching the filter.');
    return;
  }

  output.info('┌──────┬────────────────────────────────┬──────────────────────┬──────────┐');
  output.info('│ ID   │ Task                           │ Time (Start - End)   │ Duration │');
  output.info('├──────┼────────────────────────────────┼──────────────────────┼──────────┤');
  for (const log of logs) {
    const task = tasks.find((t) => t.id === log.taskId);
    const startMs = new Date(log.startTime).getTime();
    const endMs = log.endTime ? new Date(log.endTime).getTime() : Date.now();
    const durSecs = Math.max(0, Math.floor((endMs - startMs) / 1000));
    const durStr = formatSeconds(durSecs).padEnd(8);
    const idCol = log.id.padEnd(4);
    const nameCol = (task?.name || 'Unknown').slice(0, 30).padEnd(30);
    const timeRange = `${log.startTime.slice(11, 16)} - ${log.endTime ? log.endTime.slice(11, 16) : 'running'}`.padEnd(20);
    output.output(`│ ${idCol} │ ${nameCol} │ ${timeRange} │ ${durStr} │`);
  }
  output.info('└──────┴────────────────────────────────┴──────────────────────┴──────────┘');
}

/**
 * Dispatches noun-verb domain commands for the in-memory sandbox emulator.
 */
export class SandboxCommandRouter {
  public static normalizeLegacyCommand(tokens: string[]): string[] {
    return normalizeLegacyCommand(tokens);
  }

  public static route(
    tokens: string[],
    store: SandboxEmulatorStore,
    output: TerminalOutput
  ): boolean {
    if (tokens.length === 0) return false;

    const domain = tokens[0].toLowerCase();
    const rest = tokens.slice(1);
    const { positionals, flags } = parseFlags(rest);

    switch (domain) {
      case 'project': {
        const action = positionals[0]?.toLowerCase() || 'list';
        const actionPos = positionals.slice(1);
        if (action === 'list' || action === 'ls') {
          handleProjectList(flags, store, output);
          return true;
        }
        if (action === 'add' || action === 'create') {
          handleProjectAdd(actionPos, flags, store, output);
          return true;
        }
        if (action === 'rename' || action === 'ren') {
          handleProjectRename(actionPos, flags, store, output);
          return true;
        }
        if (action === 'archive' || action === 'rm') {
          handleProjectArchive(actionPos, store, output);
          return true;
        }
        output.error(`Error: Unknown project action "${action}". Available: list, add, rename, archive.`);
        return true;
      }

      case 'task': {
        const action = positionals[0]?.toLowerCase() || 'list';
        const actionPos = positionals.slice(1);
        if (action === 'list' || action === 'ls') {
          handleTaskList(flags, store, output);
          return true;
        }
        if (action === 'add' || action === 'create') {
          handleTaskAdd(actionPos, flags, store, output);
          return true;
        }
        if (action === 'done' || action === 'complete') {
          handleTaskDone(actionPos, store, output);
          return true;
        }
        if (action === 'rename' || action === 'ren') {
          handleTaskRename(actionPos, store, output);
          return true;
        }
        if (action === 'archive' || action === 'rm') {
          handleTaskArchive(actionPos, store, output);
          return true;
        }
        output.error(`Error: Unknown task action "${action}". Available: list, add, done, rename, archive.`);
        return true;
      }

      case 'log': {
        const action = positionals[0]?.toLowerCase() || 'list';
        if (action === 'list' || action === 'ls') {
          handleLogList(flags, store, output);
          return true;
        }
        output.error(`Error: Unknown log action "${action}". Available: list.`);
        return true;
      }

      case 'status': {
        handleStatus(store, output);
        return true;
      }

      case 'start': {
        handleStart(positionals, store, output);
        return true;
      }

      case 'stop':
      case 'pause': {
        handleStop(flags, store, output);
        return true;
      }

      case 'switch': {
        handleSwitch(positionals, store, output);
        return true;
      }

      case 'today': {
        handleToday(store, output);
        return true;
      }

      default:
        return false;
    }
  }
}
