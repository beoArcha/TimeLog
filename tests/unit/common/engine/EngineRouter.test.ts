import { describe, it, expect, vi } from 'vitest';
import { EngineRouter } from '@common/engine/EngineRouter';
import { IEngine } from '@common/engine/IEngine';

describe('Unit Tests: EngineRouter', () => {
  it('should delegate all calls to the active implementation', async () => {
    const mockImplementation: IEngine = {
      startTimer: vi.fn().mockResolvedValue(undefined),
      stopTimer: vi.fn().mockResolvedValue(undefined),
    };

    const router = EngineRouter.getInstance();
    router.setImplementationForTesting(mockImplementation);

    await router.startTimer('task-123');
    expect(mockImplementation.startTimer).toHaveBeenCalledWith('task-123');

    await router.stopTimer('project-456');
    expect(mockImplementation.stopTimer).toHaveBeenCalledWith('project-456');
  });
});
