import { SuccessEnvelope } from '@bindings/SuccessEnvelope';
import { formatUtc } from '@common/engine/range/formatUtc';
import { GENERATOR_NAME, GENERATOR_VERSION } from '@common/engine/reports/constants';
import { TerminalOutput } from '../../utils/terminalOutput';

export interface EnvelopeSchema {
  name: string;
  version: number;
}

/**
 * Mirrors the schema names and versions declared in src-tauri/src/cli/handlers/flow_handler.rs.
 */
export const SCHEMA_START: EnvelopeSchema = { name: 'oxy.start', version: 1 };
export const SCHEMA_STOP: EnvelopeSchema = { name: 'oxy.stop', version: 1 };
export const SCHEMA_SWITCH: EnvelopeSchema = { name: 'oxy.switch', version: 1 };
export const SCHEMA_STATUS: EnvelopeSchema = { name: 'oxy.status', version: 1 };

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
