import { SandboxEmulatorStore } from '../../sandboxEmulatorStore';
import { TerminalOutput } from '../../../utils/terminalOutput';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { resolveEntity } from '../../../resolver/entityResolver';

export function handleStatus(
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

export function handleStart(
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
      output.error('Error: No target task specified. Usage: start <task_id | "task name">', 'CLI_SYNTAX_MISSING_TARGET', 2);
    }
    return;
  }

  const tasks = store.getTasks();
  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name);
  if (!resolve.entity) {
    output.error(resolve.error || `Error: Task "${target}" not found.`, 'DOM_ENTITY_NOT_FOUND', 4);
    return;
  }

  const task = resolve.entity;
  if (task.completed) {
    output.error(`Error: Cannot start timer on completed task "${task.name}". Mark it incomplete first.`, 'DOM_BUSINESS_VIOLATION', 1);
    return;
  }

  store.handleStartTimer(task.id);
  output.success(`▶️ Timer started: "${task.name}" [ID: ${task.id}]`);
}

export function handleStop(
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const activeLog = store.getActiveLog();
  const isAll = Boolean(flags['all']);

  if (!activeLog) {
    output.error('Error: No active timer session is currently running', 'ENG_TIMER_INACTIVE', 5);
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

export function handleSwitch(
  positionals: string[],
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const target = positionals.join(' ').trim();
  if (!target) {
    output.error('Error: Target task required to switch. Usage: switch <task_id | "task name">', 'CLI_SYNTAX_MISSING_TARGET', 2);
    return;
  }

  const tasks = store.getTasks();
  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name);
  if (!resolve.entity) {
    output.error(resolve.error || `Error: Task "${target}" not found.`, 'DOM_ENTITY_NOT_FOUND', 4);
    return;
  }

  const task = resolve.entity;
  if (task.completed) {
    output.error(`Error: Cannot switch to completed task "${task.name}".`, 'DOM_BUSINESS_VIOLATION', 1);
    return;
  }

  store.handleSwitchTimer(task.id);
  output.success(`🔀 Switched active timer to: "${task.name}" [ID: ${task.id}]`);
}

export function handleToday(
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
