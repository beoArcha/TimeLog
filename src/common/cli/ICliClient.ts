import { CliExecutionResult } from '@bindings/CliExecutionResult';

/**
 * Contract for native and emulator CLI execution clients.
 */
export interface ICliClient {
  execute(commandLine: string): Promise<CliExecutionResult>;
}
