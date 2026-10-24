import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TauriCliClient } from '@common/tauri/TauriCliClient';
import { invoke } from '@tauri-apps/api/core';
import { CliExecutionResult } from '@bindings/CliExecutionResult';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('TauriCliClient', () => {
  let client: TauriCliClient;
  const mockInvoke = vi.mocked(invoke);

  beforeEach(() => {
    vi.clearAllMocks();
    client = new TauriCliClient();
  });

  it('should return successful result when invoke resolves', async () => {
    // Arrange
    const expectedResult: CliExecutionResult = {
      success: true,
      stdout: 'Started task_1',
      exit_code: 0,
      envelope: null,
    };
    mockInvoke.mockResolvedValueOnce(expectedResult);

    // Act
    const result = await client.execute('start task_1');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('cli_execute', { commandLine: 'start task_1' });
    expect(result).toEqual(expectedResult);
  });

  it('should return error result when invoke rejects with serialized CliExecutionResult', async () => {
    // Arrange
    const errorPayload: CliExecutionResult = {
      success: false,
      stdout: 'Error: No active timer',
      exit_code: 5,
      envelope: {
        code: 'ENG_TIMER_INACTIVE',
        category: 'ENGINE_CONFLICT',
        exit_code: 5,
        timestamp: '2026-10-24T20:00:00Z',
        technical: 'No active timer found',
        user: null,
      },
    };
    mockInvoke.mockRejectedValueOnce(errorPayload);

    // Act
    const result = await client.execute('stop');

    // Assert
    expect(result).toEqual(errorPayload);
  });

  it('should return fallback error result when invoke rejects with generic error', async () => {
    // Arrange
    mockInvoke.mockRejectedValueOnce(new Error('IPC transport failed'));

    // Act
    const result = await client.execute('status');

    // Assert
    expect(result.success).toBe(false);
    expect(result.exit_code).toBe(1);
    expect(result.stdout).toContain('IPC transport failed');
  });
});
