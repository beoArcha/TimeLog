import { describe, it, expect, vi } from 'vitest';
import { EngineRouter } from '@common/engine/EngineRouter';
import { IEngine } from '@common/engine/IEngine';

describe('Unit Tests: EngineRouter', () => {
  it('should delegate all calls to the active implementation', async () => {
    const mockImplementation: IEngine = {
      startTimer: vi.fn().mockResolvedValue(undefined),
      stopTimer: vi.fn().mockResolvedValue(undefined),
      editTimeLog: vi.fn().mockResolvedValue(undefined),
      getProjectStatistics: vi.fn().mockResolvedValue({ totalDurationSec: BigInt(0), totalTasks: 0, completedTasks: 0 }),
    };

    const router = EngineRouter.getInstance();
    router.setImplementationForTesting(mockImplementation);

    await router.startTimer('task-123');
    expect(mockImplementation.startTimer).toHaveBeenCalledWith('task-123');

    await router.stopTimer('project-456');
    expect(mockImplementation.stopTimer).toHaveBeenCalledWith('project-456');

    await router.editTimeLog('id-1', 'task-1', 'start', 'end', 'note', 'reason');
    expect(mockImplementation.editTimeLog).toHaveBeenCalledWith('id-1', 'task-1', 'start', 'end', 'note', 'reason');

    await router.getProjectStatistics('project-456');
    expect(mockImplementation.getProjectStatistics).toHaveBeenCalledWith('project-456');
  });
});
