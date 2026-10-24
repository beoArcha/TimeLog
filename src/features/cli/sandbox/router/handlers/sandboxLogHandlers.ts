import { SandboxEmulatorStore } from '../../sandboxEmulatorStore';
import { TerminalOutput } from '../../../utils/terminalOutput';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { resolveEntity } from '../../../resolver/entityResolver';

export function parseDurationToSeconds(input: string): number {
  const trimmed = input.trim().toLowerCase();
  let totalSeconds = 0;
  const matchHours = /(\d+)\s*h/.exec(trimmed);
  const matchMinutes = /(\d+)\s*m/.exec(trimmed);
  const matchSeconds = /(\d+)\s*s/.exec(trimmed);

  if (matchHours || matchMinutes || matchSeconds) {
    if (matchHours) totalSeconds += parseInt(matchHours[1], 10) * 3600;
    if (matchMinutes) totalSeconds += parseInt(matchMinutes[1], 10) * 60;
    if (matchSeconds) totalSeconds += parseInt(matchSeconds[1], 10);
    return totalSeconds;
  }
  const numeric = parseInt(trimmed, 10);
  return isNaN(numeric) ? 0 : numeric * 60;
}

export function handleLogList(
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

export function handleLogAdd(
  positionals: string[],
  _flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const target = positionals[0];
  const durationStr = positionals[1];
  const note = positionals[2];

  if (!target) {
    output.error('Error: Target task required to add time log. Usage: log add <target> [duration] [note]', 'CLI_SYNTAX_MISSING_TARGET', 2);
    return;
  }

  const tasks = store.getTasks();
  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name);
  if (!resolve.entity) {
    output.error(resolve.error || `Error: Task "${target}" not found.`, 'DOM_ENTITY_NOT_FOUND', 4);
    return;
  }

  const task = resolve.entity;
  const durSecs = durationStr ? parseDurationToSeconds(durationStr) : 1800;
  const log = store.handleAddLog(task.id, durSecs, note);
  const formattedDur = durationStr || formatSeconds(durSecs);
  output.success(`Logged ${formattedDur} to '${task.name}' [ID: ${log.id}]`);
}

export function handleLogRemove(
  positionals: string[],
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const logId = positionals[0];
  if (!logId) {
    output.error('Error: Log ID required to remove log entry. Usage: log remove <id>', 'CLI_SYNTAX_INVALID_ARGS', 2);
    return;
  }

  const logs = store.getLogs();
  const logExists = logs.some((l) => l.id === logId);
  if (!logExists) {
    output.error(`Error: Time log "${logId}" not found.`, 'DOM_ENTITY_NOT_FOUND', 4);
    return;
  }

  store.handleRemoveLog(logId);
  output.success(`Deleted time log: ${logId}`);
}
