import { invoke } from '@tauri-apps/api/core';
import { CliExecutionResult } from '@bindings/CliExecutionResult';
import { ICliClient } from '@common/cli/ICliClient';

function formatErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  return JSON.stringify(err);
}

export class TauriCliClient implements ICliClient {
  async execute(commandLine: string): Promise<CliExecutionResult> {
    try {
      return await invoke<CliExecutionResult>('cli_execute', { commandLine });
    } catch (err: unknown) {
      // Tauri serializes Err(CliExecutionResult) directly into the rejected promise payload.
      if (err && typeof err === 'object' && 'exit_code' in err && 'stdout' in err) {
        return err as CliExecutionResult;
      }

      return {
        success: false,
        stdout: formatErrorMessage(err),
        exit_code: 1,
        envelope: null,
      };
    }
  }
}
