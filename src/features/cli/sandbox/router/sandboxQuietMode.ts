import { TerminalOutput } from '../../utils/terminalOutput';

/**
 * Mirrors the native `-q` / `--quiet` contract in src-tauri/src/cli/shared/output.rs.
 */
export function isQuietMode(flags: Record<string, string | boolean>): boolean {
  return Boolean(flags['q'] || flags['quiet']);
}

/**
 * Quiet mutations print only the affected entity ID so scripts can capture it;
 * the human confirmation message is otherwise shown.
 */
export function emitMutationResult(
  flags: Record<string, string | boolean>,
  output: TerminalOutput,
  entityId: string,
  message: string
): void {
  if (isQuietMode(flags)) {
    output.output(entityId);
    return;
  }
  output.success(message);
}
