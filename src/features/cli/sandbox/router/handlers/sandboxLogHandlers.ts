import { SandboxEmulatorStore } from '../../sandboxEmulatorStore';
import { TerminalOutput } from '../../../utils/terminalOutput';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { isStrictResolution, reportResolveFailure, resolveEntity } from '../../../resolver/entityResolver';
import { isStartInRange } from '@common/engine/range/logRange';
import { resolveSandboxRange } from '../sandboxRange';
import { emitMutationResult, isQuietMode } from '../sandboxQuietMode';

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

/**
 * Mirrors MSG_LOGS_TRUNCATED_FOOTER in src-tauri/src/cli/handlers/constants.rs
 */
export const SANDBOX_LOGS_TRUNCATED_FOOTER =
  '… {} more entries not shown. Use --limit <n> to show more.';

const HUMAN_DEFAULT_LOG_LIMIT = 20;

// Machine output must never drop entries silently, so only human output gets a default limit.
function resolveEffectiveLimit(explicitLimit: number | undefined, isMachine: boolean): number | undefined {
  if (explicitLimit !== undefined) return explicitLimit;
  if (isMachine) return undefined;
  return HUMAN_DEFAULT_LOG_LIMIT;
}

export function handleLogList(
  flags: Record<string, string | boolean>,
  store: SandboxEmulatorStore,
  output: TerminalOutput
): void {
  const range = resolveSandboxRange(flags, output);
  if (!range) return;

  let logs = store.getLogs().filter((l) => isStartInRange(l.startTime, range));
  const tasks = store.getTasks();
  const projects = store.getProjects();

  const isStrict = isStrictResolution(flags);
  const isMachine = Boolean(flags['json'] || flags['machine']);
  const quiet = isQuietMode(flags);
  const projFilter = (flags['p'] || flags['project']) as string | undefined;
  if (projFilter) {
    const resolve = resolveEntity(projects, projFilter, 'Project', (p) => p.id, (p) => p.name, isStrict);
    if (!resolve.entity) {
      reportResolveFailure(resolve, output);
      return;
    }
    logs = logs.filter((l) => l.projectId === resolve.entity?.id);
  }

  const taskFilter = (flags['t'] || flags['task']) as string | undefined;
  if (taskFilter) {
    const resolve = resolveEntity(tasks, taskFilter, 'Task', (t) => t.id, (t) => t.name, isStrict);
    if (!resolve.entity) {
      reportResolveFailure(resolve, output);
      return;
    }
    logs = logs.filter((l) => l.taskId === resolve.entity?.id);
  }

  let explicitLimit: number | undefined;
  if (flags['limit'] !== undefined) {
    const parsed = parseInt(String(flags['limit']), 10);
    if (isNaN(parsed) || parsed < 1) {
      output.error('Error: --limit must be at least 1.', 'CLI_SYNTAX_INVALID_ARGS', 2);
      return;
    }
    explicitLimit = parsed;
  }

  // Sort descending by startTime (newest first) to mirror native reference engine
  const sortedLogs = [...logs].sort((a, b) => b.startTime.localeCompare(a.startTime));
  const totalMatched = sortedLogs.length;

  const effectiveLimit = resolveEffectiveLimit(explicitLimit, isMachine);
  const visibleLogs = effectiveLimit !== undefined ? sortedLogs.slice(0, effectiveLimit) : sortedLogs;

  if (visibleLogs.length === 0) {
    if (isMachine) {
      output.output('[]');
    } else if (!quiet) {
      output.info('No time logs found matching the filter.');
    }
    return;
  }

  if (isMachine) {
    output.output(JSON.stringify(visibleLogs, null, 2));
    return;
  }

  if (!quiet) {
    output.info('┌──────┬────────────────────────────────┬──────────────────────┬──────────┐');
    output.info('│ ID   │ Task                           │ Time (Start - End)   │ Duration │');
    output.info('├──────┼────────────────────────────────┼──────────────────────┼──────────┤');
  }
  for (const log of visibleLogs) {
    const task = tasks.find((t) => t.id === log.taskId);
    const startMs = new Date(log.startTime).getTime();
    const endMs = log.endTime ? new Date(log.endTime).getTime() : Date.now();
    const durSecs = Math.max(0, Math.floor((endMs - startMs) / 1000));
    const durStr = formatSeconds(durSecs).padEnd(8);
    const idCol = log.id.padEnd(4);
    const nameCol = (task?.name || 'Unknown').slice(0, 30).padEnd(30);
    const timeRange = `${log.startTime.slice(11, 16)} - ${log.endTime ? log.endTime.slice(11, 16) : 'running'}`.padEnd(20);
    if (quiet) {
      output.output(`${idCol} ${nameCol} ${timeRange} ${durStr}`.trimEnd());
    } else {
      output.output(`│ ${idCol} │ ${nameCol} │ ${timeRange} │ ${durStr} │`);
    }
  }
  if (!quiet) {
    output.info('└──────┴────────────────────────────────┴──────────────────────┴──────────┘');
  }

  if (!quiet && totalMatched > visibleLogs.length) {
    const notShown = totalMatched - visibleLogs.length;
    output.info(SANDBOX_LOGS_TRUNCATED_FOOTER.replace('{}', String(notShown)));
  }
}

export function handleLogAdd(
  positionals: string[],
  flags: Record<string, string | boolean>,
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

  const isStrict = isStrictResolution(flags);
  const tasks = store.getTasks();
  const resolve = resolveEntity(tasks, target, 'Task', (t) => t.id, (t) => t.name, isStrict);
  if (!resolve.entity) {
    reportResolveFailure(resolve, output);
    return;
  }

  const task = resolve.entity;
  const durSecs = durationStr ? parseDurationToSeconds(durationStr) : 1800;
  const log = store.handleAddLog(task.id, durSecs, note);
  const formattedDur = durationStr || formatSeconds(durSecs);
  emitMutationResult(flags, output, log.id, `Logged ${formattedDur} to '${task.name}' [ID: ${log.id}]`);
}

export function handleLogRemove(
  positionals: string[],
  flags: Record<string, string | boolean>,
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
  emitMutationResult(flags, output, logId, `Deleted time log: ${logId}`);
}
