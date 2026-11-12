import { Task } from '@bindings/Task';
import { SandboxEmulatorStore } from '../../sandboxEmulatorStore';
import { TerminalOutput } from '../../../utils/terminalOutput';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { isStrictResolution, reportResolveFailure, resolveEntity } from '../../../resolver/entityResolver';
import { isStartInRange, localDateOfRange } from '@common/engine/range/logRange';
import { resolveSandboxToday } from '../sandboxRange';
import { StartPayload } from '@bindings/StartPayload';
import { StatusPayload } from '@bindings/StatusPayload';
import { StopPayload } from '@bindings/StopPayload';
import { SwitchPayload } from '@bindings/SwitchPayload';
import { emitEnvelope, isMachineMode, SCHEMA_START, SCHEMA_STATUS, SCHEMA_STOP, SCHEMA_SWITCH } from '../sandboxEnvelope';
import { isQuietMode } from '../sandboxQuietMode';

// Mirrors OUT_NOTHING_TO_STOP in src-tauri/src/cli/handlers/constants.rs so the sandbox and native CLI print the same message.
const SANDBOX_NOTHING_TO_STOP = 'No active timer; nothing to stop.';

// Mirror OUT_ALREADY_TRACKING / OUT_STOPPED_TASK_LINE / LABEL_UNKNOWN_TASK in src-tauri/src/cli/handlers/constants.rs.
const SANDBOX_ALREADY_TRACKING = "Already tracking '{}' [{}].";
const SANDBOX_STOPPED_TASK_LINE = "Stopped: '{}' [{}]";
const SANDBOX_UNKNOWN_TASK = 'Unknown Task';

export function handleStatus(
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const activeLog = store.getActiveLog();
  if (isMachineMode(flags)) {
    const activeTaskIds = activeLog ? [activeLog.taskId] : [];
    const payload: StatusPayload = {
      activeTaskIds,
      count: activeTaskIds.length,
      running: activeTaskIds.length > 0,
    };
    emitEnvelope(output, SCHEMA_STATUS, payload);
    return;
  }
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
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const isStrict = isStrictResolution(flags);

  const target = positionals.join(' ').trim();
  const activeLog = store.getActiveLog();

  if (!target) {
    if (activeLog) {
      handleStatus(flags, store, output);
    } else {
      output.error('Error: No target task specified. Usage: start <task_id | "task name">', 'CLI_SYNTAX_MISSING_TARGET', 2);
    }
    return;
  }

  const tasks = store.getTasks();
  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name, isStrict);
  if (!resolve.entity) {
    reportResolveFailure(resolve, output);
    return;
  }

  const task = resolve.entity;
  if (task.completed) {
    output.error(`Error: Cannot start timer on completed task "${task.name}". Mark it incomplete first.`, 'DOM_BUSINESS_VIOLATION', 1);
    return;
  }

  if (activeLog?.taskId === task.id) {
    emitAlreadyRunning(flags, task, output);
    return;
  }

  const stoppedTask = activeLog ? tasks.find((t) => t.id === activeLog.taskId) : undefined;
  const newLog = store.handleStartTimer(task.id);
  if (isMachineMode(flags)) {
    const payload: StartPayload = {
      action: 'started',
      taskId: task.id,
      timeLogId: newLog.id,
      stoppedTaskIds: activeLog ? [activeLog.taskId] : [],
    };
    emitEnvelope(output, SCHEMA_START, payload);
    return;
  }
  if (isQuietMode(flags)) {
    output.output(newLog.id);
    return;
  }
  output.success(`▶️ Timer started: "${task.name}" [ID: ${task.id}]`);
  if (activeLog) {
    const stoppedName = stoppedTask?.name ?? SANDBOX_UNKNOWN_TASK;
    output.info(SANDBOX_STOPPED_TASK_LINE.replace('{}', stoppedName).replace('{}', activeLog.taskId));
  }
}

function emitAlreadyRunning(
  flags: Record<string, string | boolean>,
  task: Task,
  output: TerminalOutput
): void {
  if (isMachineMode(flags)) {
    const payload: StartPayload = {
      action: 'alreadyRunning',
      taskId: task.id,
      timeLogId: null,
      stoppedTaskIds: [],
    };
    emitEnvelope(output, SCHEMA_START, payload);
    return;
  }
  // No entity is created, so a quiet caller capturing an identifier gets nothing to capture.
  if (isQuietMode(flags)) return;
  output.info(SANDBOX_ALREADY_TRACKING.replace('{}', task.name).replace('{}', task.id));
}

export function handleStop(
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const activeLog = store.getActiveLog();
  const isAll = Boolean(flags['all']);

  if (!activeLog) {
    if (flags['if-running']) {
      emitNothingToStop(flags, output);
      return;
    }
    output.error('Error: No active timer session is currently running', 'ENG_TIMER_INACTIVE', 5);
    return;
  }

  const tasks = store.getTasks();
  const task = tasks.find((t) => t.id === activeLog.taskId);
  store.handleStopTimer();

  if (isMachineMode(flags)) {
    const payload: StopPayload = { action: 'stopped', stoppedCount: 1 };
    emitEnvelope(output, SCHEMA_STOP, payload);
    return;
  }

  if (isAll) {
    output.success('⏹️ Stopped all active sessions (1 session stopped).');
  } else {
    output.success(`⏹️ Timer stopped: "${task?.name || 'Unknown'}".`);
  }
}

function emitNothingToStop(flags: Record<string, string | boolean>, output: TerminalOutput): void {
  if (isMachineMode(flags)) {
    const payload: StopPayload = { action: 'noop', stoppedCount: 0 };
    emitEnvelope(output, SCHEMA_STOP, payload);
    return;
  }
  output.success(SANDBOX_NOTHING_TO_STOP);
}

export function handleSwitch(
  positionals: string[],
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const isStrict = isStrictResolution(flags);

  const target = positionals.join(' ').trim();
  if (!target) {
    output.error('Error: Target task required to switch. Usage: switch <task_id | "task name">', 'CLI_SYNTAX_MISSING_TARGET', 2);
    return;
  }

  const tasks = store.getTasks();
  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name, isStrict);
  if (!resolve.entity) {
    reportResolveFailure(resolve, output);
    return;
  }

  const task = resolve.entity;
  if (task.completed) {
    output.error(`Error: Cannot switch to completed task "${task.name}".`, 'DOM_BUSINESS_VIOLATION', 1);
    return;
  }

  const newLog = store.handleSwitchTimer(task.id);
  if (isMachineMode(flags)) {
    const payload: SwitchPayload = { action: 'switched', taskId: task.id, timeLogId: newLog.id };
    emitEnvelope(output, SCHEMA_SWITCH, payload);
    return;
  }
  if (isQuietMode(flags)) {
    output.output(newLog.id);
    return;
  }
  output.success(`🔀 Switched active timer to: "${task.name}" [ID: ${task.id}]`);
}

export function handleToday(
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const range = resolveSandboxToday(flags, output);
  if (!range) return;

  const tasks = store.getTasks();
  const projects = store.getProjects();

  const todayDate = localDateOfRange(range);
  const todayLogs = store.getLogs().filter((l) => isStartInRange(l.startTime, range));

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
