import type { RangePreset } from '@bindings/RangePreset';
import type { RangeRequest } from '@bindings/RangeRequest';
import type { ResolvedRange } from '@bindings/ResolvedRange';
import { resolveRangeAt } from '@common/engine/range/resolveRange';
import { resolveTimezone } from '@common/engine/range/timezone';
import { localDateAt } from '@common/engine/range/zonedTime';
import { EngineValidationException } from '@common/exceptions';
import { TerminalOutput } from '../../utils/terminalOutput';

type Flags = Record<string, string | boolean>;

const SYNTAX_ERROR_CODE = 'CLI_SYNTAX_INVALID_ARGS';
const SYNTAX_EXIT_CODE = 2;

/** Flag spellings follow the clap long names of the native CLI. */
const PRESET_FLAGS: ReadonlyArray<readonly [flag: string, preset: RangePreset]> = [
  ['today', 'today'],
  ['yesterday', 'yesterday'],
  ['week', 'week'],
  ['last-week', 'lastWeek'],
  ['month', 'month'],
  ['last-month', 'lastMonth'],
];

const BOUND_FLAGS: ReadonlyArray<readonly [flag: string, placeholder: string]> = [
  ['from', '<FROM>'],
  ['to', '<TO>'],
];

function isSet(flags: Flags, name: string): boolean {
  return flags[name] !== undefined && flags[name] !== false;
}

// Mirrors the clap ArgGroup that makes presets exclusive with each other and with --from/--to.
function findConflict(flags: Flags): string | null {
  const presets = PRESET_FLAGS.filter(([flag]) => isSet(flags, flag));
  if (presets.length > 1) {
    return `the argument '--${presets[0][0]}' cannot be used with '--${presets[1][0]}'`;
  }

  const bound = BOUND_FLAGS.find(([flag]) => isSet(flags, flag));
  if (presets.length === 1 && bound) {
    return `the argument '--${presets[0][0]}' cannot be used with '--${bound[0]} ${bound[1]}'`;
  }
  return null;
}

function findMissingValue(flags: Flags): string | null {
  const missing = [...BOUND_FLAGS, ['tz', '<TZ>'] as const].find(
    ([flag]) => isSet(flags, flag) && typeof flags[flag] !== 'string'
  );
  return missing ? `a value is required for '--${missing[0]} ${missing[1]}' but none was supplied` : null;
}

function stringFlag(flags: Flags, name: string): string | undefined {
  const value = flags[name];
  return typeof value === 'string' ? value : undefined;
}

function buildRequest(flags: Flags): RangeRequest {
  const from = stringFlag(flags, 'from');
  const to = stringFlag(flags, 'to');
  const chosen = PRESET_FLAGS.find(([flag]) => isSet(flags, flag));
  const preset = chosen?.[1] ?? (from === undefined && to === undefined ? 'all' : undefined);
  return { preset, from, to, timezone: stringFlag(flags, 'tz') };
}

function reportSyntaxError(output: TerminalOutput, message: string): null {
  output.error(`Error: ${message}`, SYNTAX_ERROR_CODE, SYNTAX_EXIT_CODE);
  return null;
}

function resolveRequest(request: RangeRequest, output: TerminalOutput, now: Date): ResolvedRange | null {
  try {
    const timeZone = resolveTimezone(request.timezone, null);
    return resolveRangeAt(request, now, timeZone);
  } catch (error) {
    if (error instanceof EngineValidationException) return reportSyntaxError(output, error.message);
    throw error;
  }
}

/**
 * Resolves the period flags of `log ls` through the browser engine's `resolveRangeAt`; reports a
 * syntax error and returns `null` when the flags are invalid.
 */
export function resolveSandboxRange(
  flags: Flags,
  output: TerminalOutput,
  now: Date = new Date()
): ResolvedRange | null {
  const invalid = findConflict(flags) ?? findMissingValue(flags);
  if (invalid) return reportSyntaxError(output, invalid);
  return resolveRequest(buildRequest(flags), output, now);
}

/** `today` accepts only `--tz`; its period is fixed to the current local day. */
export function resolveSandboxToday(
  flags: Flags,
  output: TerminalOutput,
  now: Date = new Date()
): ResolvedRange | null {
  const invalid = findMissingValue({ tz: flags['tz'] ?? false });
  if (invalid) return reportSyntaxError(output, invalid);
  return resolveRequest({ preset: 'today', timezone: stringFlag(flags, 'tz') }, output, now);
}

/** Half-open `[from, to)` check; an unbounded range keeps every log. */
export function isStartInRange(startTime: string, range: ResolvedRange): boolean {
  const startMs = Date.parse(startTime);
  const afterFrom = range.from === undefined || startMs >= Date.parse(range.from);
  const beforeTo = range.to === undefined || startMs < Date.parse(range.to);
  return afterFrom && beforeTo;
}

/** Calendar day (`YYYY-MM-DD`) in which the range begins, in the range's own timezone. */
export function localDateOfRange(range: ResolvedRange): string {
  const { year, month, day } = localDateAt(Date.parse(range.from ?? ''), range.timezone);
  const pad = (value: number, width: number) => String(value).padStart(width, '0');
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}
