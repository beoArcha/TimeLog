import { SandboxEmulatorStore } from '../../sandboxEmulatorStore';
import { TerminalOutput } from '../../../utils/terminalOutput';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { resolveEntity } from '../../../resolver/entityResolver';

export function handleTaskList(
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
      output.error(resolve.error || `Error: Project "${projTarget}" not found.`, 'DOM_ENTITY_NOT_FOUND', 4);
      return;
    }
    filteredProjects = [resolve.entity];
  }

  const allTasks = store.getTasks();
  const selectedTaskId = store.getSelectedTaskId();
  const metrics = store.getComputedMetrics();

  if (allTasks.length === 0) {
    output.info('No tasks found in sandbox.');
    return;
  }

  output.info('┌──────┬────────────────────────────────┬────────────────────────┐');
  output.info('│ ID   │ Task Title                     │ Total Time             │');
  output.info('├──────┼────────────────────────────────┼────────────────────────┤');

  for (const project of filteredProjects) {
    const projTasks = allTasks.filter((t) => t.projectId === project.id);
    const visibleTasks = showAll ? projTasks : projTasks.filter((t) => !t.archived);

    if (visibleTasks.length === 0) continue;

    output.info(`Project: ${project.name} [ID: ${project.id}]`);
    const rootTasks = visibleTasks.filter((t) => !t.parentTaskId);

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

export function handleTaskAdd(
  positionals: string[],
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const name = positionals[0];
  if (!name) {
    output.error('Error: Task title is required. Usage: task add <name> -p <proj> [-P <parent>]', 'CLI_SYNTAX_INVALID_ARGS', 2);
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
      output.error(resolveParent.error || `Error: Parent task "${parentTarget}" not found.`, 'DOM_ENTITY_NOT_FOUND', 4);
      return;
    }
    parentTaskId = resolveParent.entity.id;
    targetProjectId = resolveParent.entity.projectId;
  }

  if (projTarget) {
    const projects = store.getProjects();
    const resolveProj = resolveEntity(projects, projTarget, 'Project', (p) => p.id, (p) => p.name);
    if (!resolveProj.entity) {
      output.error(resolveProj.error || `Error: Project "${projTarget}" not found.`, 'DOM_ENTITY_NOT_FOUND', 4);
      return;
    }
    targetProjectId = resolveProj.entity.id;
  }

  if (!targetProjectId) {
    const firstProj = store.getProjects()[0];
    if (!firstProj) {
      output.error('Error: No project available. Create a project first with "project add <name>".', 'DOM_BUSINESS_NO_PROJECTS', 1);
      return;
    }
    targetProjectId = firstProj.id;
  }

  const rate = flags['rate'] ? String(flags['rate']) : undefined;
  const task = store.handleAddTask(targetProjectId, name, parentTaskId, rate);
  const typeLabel = parentTaskId ? 'Subtask' : 'Task';
  output.success(`${typeLabel} created: "${task.name}" [ID: ${task.id}]`);
}

export function handleTaskRate(
  positionals: string[],
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const target = positionals[0];
  const rateArg = positionals[1];

  if (!target || rateArg === undefined) {
    output.error('Error: Task target and rate required. Usage: task rate <target> <rate|inherit>', 'CLI_SYNTAX_INVALID_ARGS', 2);
    return;
  }

  const tasks = store.getTasks();
  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name);
  if (!resolve.entity) {
    output.error(resolve.error || `Error: Task "${target}" not found.`, 'DOM_ENTITY_NOT_FOUND', 4);
    return;
  }

  const rate =
    rateArg.toLowerCase() === 'inherit' ||
    rateArg.toLowerCase() === 'none' ||
    rateArg.toLowerCase() === 'clear'
      ? null
      : rateArg;

  store.handleSetTaskRate(resolve.entity.id, rate);
  output.success(`Updated billing rate for task "${resolve.entity.name}" [ID: ${resolve.entity.id}] to ${rate ?? 'inherited'}.`);
}

export function handleTaskDone(
  positionals: string[],
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const target = positionals[0];
  if (!target) {
    output.error('Error: Task target is required. Usage: task done <target>', 'CLI_SYNTAX_INVALID_ARGS', 2);
    return;
  }

  const tasks = store.getTasks();
  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name);
  if (!resolve.entity) {
    output.error(resolve.error || `Error: Task "${target}" not found.`, 'DOM_ENTITY_NOT_FOUND', 4);
    return;
  }

  const task = resolve.entity;
  store.handleToggleTaskComplete(task.id);
  const state = task.completed ? 'completed' : 'uncompleted';
  output.success(`Task "${task.name}" [ID: ${task.id}] marked as ${state}.`);
}

export function handleTaskRename(
  positionals: string[],
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const target = positionals[0];
  const newName = positionals[1];

  if (!target || !newName) {
    output.error('Error: Task target and new name required. Usage: task rename <target> <new_name>', 'CLI_SYNTAX_INVALID_ARGS', 2);
    return;
  }

  const tasks = store.getTasks();
  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name);
  if (!resolve.entity) {
    output.error(resolve.error || `Error: Task "${target}" not found.`, 'DOM_ENTITY_NOT_FOUND', 4);
    return;
  }

  store.handleRenameTask(resolve.entity.id, newName);
  output.success(`Renamed task: "${newName}" [ID: ${resolve.entity.id}]`);
}

export function handleTaskArchive(
  positionals: string[],
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const target = positionals[0];
  if (!target) {
    output.error('Error: Task target is required. Usage: task archive <target>', 'CLI_SYNTAX_INVALID_ARGS', 2);
    return;
  }

  const tasks = store.getTasks();
  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name);
  if (!resolve.entity) {
    output.error(resolve.error || `Error: Task "${target}" not found.`, 'DOM_ENTITY_NOT_FOUND', 4);
    return;
  }

  store.handleArchiveTask(resolve.entity.id);
  const status = resolve.entity.archived ? 'unarchived' : 'archived';
  output.success(`Task "${resolve.entity.name}" [ID: ${resolve.entity.id}] has been ${status}.`);
}
