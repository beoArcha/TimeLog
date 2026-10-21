import { ITimeLogsEngine } from '@common/engine/IEngine';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { EntityNotFoundException, EngineException, ErrorHandler } from '@common/exceptions';
import { validateTimeLog } from '../validation';

export class BrowserTimeLogsEngine implements ITimeLogsEngine {
  private persistence: PersistenceRouter;

  constructor(persistence?: PersistenceRouter) {
    this.persistence = persistence ?? PersistenceRouter.getInstance();
  }

  async editTimeLog(
    id: string,
    taskId: string,
    startTime: string,
    endTime: string | null,
    note: string | null,
    reason: string | null
  ): Promise<void> {
    const state = await this.persistence.core.load();
    if (!state) {
      const err = new EngineException('Database state not initialized', undefined, 'ERR_ENGINE_STATE');
      ErrorHandler.handle(err);
      throw err;
    }

    const currentLog = state.logs.find((l) => l.id === id);
    if (!currentLog) {
      throw new EntityNotFoundException(`Time log ${id} not found`);
    }

    try {
      validateTimeLog(id, startTime, endTime, state.logs);
    } catch (err) {
      ErrorHandler.handle(err);
      throw err;
    }

    const prevStartTime = currentLog.startTime !== startTime ? currentLog.startTime : undefined;
    const prevEndTime = currentLog.endTime !== endTime ? currentLog.endTime || undefined : undefined;
    const prevNote = currentLog.note !== note ? currentLog.note || undefined : undefined;

    const historyItem = {
      editedAt: new Date().toISOString(),
      prevStartTime,
      prevEndTime,
      prevNote,
      reason: reason || undefined,
    };

    const updatedHistory = currentLog.editHistory ? [...currentLog.editHistory, historyItem] : [historyItem];

    state.logs = state.logs.map((l) => {
      if (l.id === id) {
        return {
          ...l,
          taskId,
          startTime,
          endTime: endTime || undefined,
          note: note || undefined,
          editHistory: updatedHistory,
        };
      }
      return l;
    });

    if (state.activeLog && state.activeLog.id === id) {
      state.activeLog = {
        ...state.activeLog,
        taskId,
        startTime,
        endTime: endTime || undefined,
        note: note || undefined,
        editHistory: updatedHistory,
      };
    }

    await this.persistence.core.overrideState(state);
  }
}
