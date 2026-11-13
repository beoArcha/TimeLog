import type { CliErrorEnvelope } from '@bindings/CliErrorEnvelope';
import type { CliErrorDetails } from '@bindings/CliErrorDetails';
import { SuccessEnvelope } from '@bindings/SuccessEnvelope';
import { formatUtc } from '@common/engine/range/formatUtc';
import { GENERATOR_NAME, GENERATOR_VERSION } from '@common/engine/reports/constants';
import { TerminalOutput } from '../../utils/terminalOutput';

export interface EnvelopeSchema {
  name: string;
  version: number;
}

/**
 * Mirrors the schema names and versions declared by the native handlers in src-tauri/src/cli/handlers/.
 */
export const SCHEMA_START: EnvelopeSchema = { name: 'oxy.start', version: 1 };
export const SCHEMA_STOP: EnvelopeSchema = { name: 'oxy.stop', version: 1 };
export const SCHEMA_SWITCH: EnvelopeSchema = { name: 'oxy.switch', version: 1 };
export const SCHEMA_STATUS: EnvelopeSchema = { name: 'oxy.status', version: 1 };
export const SCHEMA_TODAY: EnvelopeSchema = { name: 'oxy.today', version: 1 };

export const SCHEMA_PROJECT_LIST: EnvelopeSchema = { name: 'oxy.project.list', version: 1 };
export const SCHEMA_PROJECT_ADD: EnvelopeSchema = { name: 'oxy.project.add', version: 1 };
export const SCHEMA_PROJECT_RENAME: EnvelopeSchema = { name: 'oxy.project.rename', version: 1 };
export const SCHEMA_PROJECT_ARCHIVE: EnvelopeSchema = { name: 'oxy.project.archive', version: 1 };

export const SCHEMA_TASK_LIST: EnvelopeSchema = { name: 'oxy.task.list', version: 1 };
export const SCHEMA_TASK_ADD: EnvelopeSchema = { name: 'oxy.task.add', version: 1 };
export const SCHEMA_TASK_DONE: EnvelopeSchema = { name: 'oxy.task.done', version: 1 };
export const SCHEMA_TASK_RENAME: EnvelopeSchema = { name: 'oxy.task.rename', version: 1 };
export const SCHEMA_TASK_RATE: EnvelopeSchema = { name: 'oxy.task.rate', version: 1 };
export const SCHEMA_TASK_ARCHIVE: EnvelopeSchema = { name: 'oxy.task.archive', version: 1 };

export const SCHEMA_LOG_LIST: EnvelopeSchema = { name: 'oxy.log.list', version: 1 };
export const SCHEMA_LOG_ADD: EnvelopeSchema = { name: 'oxy.log.add', version: 1 };
export const SCHEMA_LOG_EDIT: EnvelopeSchema = { name: 'oxy.log.edit', version: 1 };
export const SCHEMA_LOG_REMOVE: EnvelopeSchema = { name: 'oxy.log.remove', version: 1 };

export function isMachineMode(flags: Record<string, string | boolean>): boolean {
  return Boolean(flags['json'] || flags['machine']);
}

export function buildEnvelope(schema: EnvelopeSchema, data: unknown, nowMs: number = Date.now()): SuccessEnvelope {
  return {
    schema: schema.name,
    schemaVersion: schema.version,
    data,
    meta: {
      generatedAt: formatUtc(nowMs),
      generator: { name: GENERATOR_NAME, version: GENERATOR_VERSION },
    },
  };
}

/**
 * The sandbox has no TTY, so like a piped native `--json` it always prints one compact line.
 */
export function emitEnvelope(output: TerminalOutput, schema: EnvelopeSchema, data: unknown): void {
  output.output(JSON.stringify(buildEnvelope(schema, data)));
}

// Mirrors CliErrorCode::category() in src-tauri/src/cli/error/codes.rs.
const ERROR_CATEGORY_BY_PREFIX: ReadonlyArray<readonly [string, string]> = [
  ['CLI_SYNTAX_', 'syntax'],
  ['DOM_ENTITY_', 'entity'],
  ['DOM_BUSINESS_', 'business'],
  ['STO_', 'storage'],
  ['ENG_', 'engine'],
  ['SNK_', 'sink'],
  ['MSK_', 'mask'],
];

function errorCategory(code: string): string {
  return ERROR_CATEGORY_BY_PREFIX.find(([prefix]) => code.startsWith(prefix))?.[1] ?? 'business';
}

function hasDetails(details: CliErrorDetails): boolean {
  return Boolean(
    (details.candidates && details.candidates.length > 0) ||
      details.suggestion ||
      details.field ||
      details.value
  );
}

/**
 * Like the native machine mode, the envelope has no localized `user` layer and omits empty `details`.
 */
export function buildErrorEnvelope(
  code: string,
  technical: string,
  exitCode: number,
  details?: CliErrorDetails,
  nowMs: number = Date.now()
): CliErrorEnvelope {
  const envelope: CliErrorEnvelope = {
    code,
    category: errorCategory(code),
    exit_code: exitCode,
    timestamp: formatUtc(nowMs),
    technical,
  };
  if (details && hasDetails(details)) {
    envelope.details = details;
  }
  return envelope;
}
