import { CliErrorEnvelope } from '@bindings/CliErrorEnvelope';
import { CliErrorDetails } from '@bindings/CliErrorDetails';
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

/**
 * Builds a structured error envelope matching CliErrorEnvelope on the Rust backend.
 * Omit details completely when empty, and omit individual detail members when absent.
 */
export function buildErrorEnvelope(
  code: string,
  technical: string,
  exitCode: number,
  details?: CliErrorDetails | null,
  nowMs: number = Date.now()
): CliErrorEnvelope {
  let cleanDetails: CliErrorDetails | undefined;
  if (details) {
    const d: Record<string, unknown> = {};
    if (details.candidates && details.candidates.length > 0) {
      d.candidates = details.candidates;
    }
    if (details.suggestion) {
      d.suggestion = details.suggestion;
    }
    if (details.field) {
      d.field = details.field;
    }
    if (details.value) {
      d.value = details.value;
    }
    if (Object.keys(d).length > 0) {
      cleanDetails = d as CliErrorDetails;
    }
  }

  const category = code.startsWith('DOM_ENTITY_')
    ? 'entity'
    : code.startsWith('DOM_BUSINESS_')
      ? 'business'
      : code.startsWith('CLI_SYNTAX_')
        ? 'syntax'
        : code.startsWith('ENG_')
          ? 'engine'
          : code.startsWith('STO_')
            ? 'storage'
            : 'system';

  const envelope: CliErrorEnvelope = {
    code,
    category,
    exit_code: exitCode,
    timestamp: formatUtc(nowMs),
    technical,
    user: null,
  };

  if (cleanDetails) {
    envelope.details = cleanDetails;
  }

  return envelope;
}

export function emitErrorEnvelope(
  output: TerminalOutput,
  code: string,
  technical: string,
  exitCode: number,
  details?: CliErrorDetails | null
): void {
  const envelope = buildErrorEnvelope(code, technical, exitCode, details);
  output.error(JSON.stringify(envelope), code, exitCode);
}

