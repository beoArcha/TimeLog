import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CliRouter } from '@common/cli/CliRouter';
import { ICliClient } from '@common/cli/ICliClient';
import { CliExecutionResult } from '@bindings/CliExecutionResult';

describe('CliRouter', () => {
  beforeEach(() => {
    CliRouter.resetForTesting();
  });

  it('should delegate execution when implementation is set for testing', async () => {
    // Arrange
    const router = CliRouter.getInstance();
    const expectedResult: CliExecutionResult = {
      success: true,
      stdout: 'Executed successfully',
      exit_code: 0,
      envelope: null,
    };
    const mockClient: ICliClient = {
      execute: vi.fn().mockResolvedValue(expectedResult),
    };
    router.setImplementationForTesting(mockClient);

    // Act
    const result = await router.execute('status');

    // Assert
    expect(router.hasNativeCli()).toBe(true);
    expect(mockClient.execute).toHaveBeenCalledWith('status');
    expect(result).toEqual(expectedResult);
  });

  it('should throw error when execute is called in browser runtime without implementation', async () => {
    // Arrange
    const router = CliRouter.getInstance();

    // Act & Assert
    await expect(router.execute('status')).rejects.toThrow(
      'Native CLI execution is not available in browser runtime'
    );
  });
});
