import { type SetStateAction } from 'react';
import { TimeLog } from '@bindings/TimeLog';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { EngineRouter } from '@common/engine/EngineRouter';
import { ApiPayload } from '@common/persistence/IPersistence';
import { RepositoryStateHook } from './useRepositoryState';
import { AsyncActionRunnerHook } from './useAsyncActionRunner';

export interface UseTimerManagerOptions {
  repositoryState: RepositoryStateHook;
  actionRunner: AsyncActionRunnerHook;
  pushToApi: (payload: ApiPayload, logMsg: string) => void;
  refreshComputedMetrics: (nowIso?: string) => Promise<unknown>;
}

export const useTimerManager = ({
  repositoryState,
  actionRunner,
  pushToApi,
  refreshComputedMetrics,
}: UseTimerManagerOptions) => {
  const notifyActiveLogChanges = (prevLogs: TimeLog[], nextLogs: TimeLog[]) => {
    const prevActive = prevLogs.filter(l => !l.endTime);
    const nextActive = nextLogs.filter(l => !l.endTime);

    for (const prev of prevActive) {
      if (!nextActive.some(n => n.id === prev.id)) {
        const stopped = nextLogs.find(l => l.id === prev.id) ?? {
          ...prev,
          endTime: new Date().toISOString(),
        };
        pushToApi({ event: 'TERMINATE', log: stopped }, `Terminating ${stopped.id}`);
      }
    }

    for (const next of nextActive) {
      if (!prevActive.some(p => p.id === next.id)) {
        pushToApi({ event: 'START', log: next }, `Starting ${next.id}`);
      }
    }
  };

  const handleStartTimer = async (taskId: string) => {
    await actionRunner.runAction('Failed to start timer', async () => {
      const prevLogs = repositoryState.logs;
      try {
        await EngineRouter.getInstance().timer.startTimer(taskId);
      } finally {
        const nextState = await PersistenceRouter.getInstance().core.load();

        if (nextState) {
          repositoryState.setLogsState(nextState.logs);
          repositoryState.setActiveLogState(nextState.activeLog);
          repositoryState.setActiveLogsState(nextState.activeLogs ?? (nextState.activeLog ? [nextState.activeLog] : []));
          await refreshComputedMetrics();
          notifyActiveLogChanges(prevLogs, nextState.logs);
        }
      }
    });
  };

  const handleStopTimer = async (specificProjectId?: string) => {
    await actionRunner.runAction('Failed to stop timer', async () => {
      const prevLogs = repositoryState.logs;
      try {
        await EngineRouter.getInstance().timer.stopTimer(specificProjectId);
      } finally {
        const nextState = await PersistenceRouter.getInstance().core.load();

        if (nextState) {
          repositoryState.setLogsState(nextState.logs);
          repositoryState.setActiveLogState(nextState.activeLog);
          repositoryState.setActiveLogsState(nextState.activeLogs ?? (nextState.activeLog ? [nextState.activeLog] : []));
          await refreshComputedMetrics();
          notifyActiveLogChanges(prevLogs, nextState.logs);
        }
      }
    });
  };

  const handleEditTimeLog = async (
    id: string,
    taskId: string,
    startTime: string,
    endTime: string | null,
    note: string | null,
    reason: string | null,
    auditSource?: string | null
  ): Promise<{ saved: boolean; synchronized: boolean }> => {
    const mutationResult = await actionRunner.runAction(
      'Failed to edit time log',
      async () => {
        if (auditSource !== undefined) {
          await EngineRouter.getInstance().timeLogs.editTimeLog(id, taskId, startTime, endTime, note, reason, auditSource);
        } else {
          await EngineRouter.getInstance().timeLogs.editTimeLog(id, taskId, startTime, endTime, note, reason);
        }
        return true;
      },
      { errorCode: 'ERR_REPOSITORY_EDIT_TIME_LOG', rethrow: true }
    );

    if (mutationResult !== true) {
      return { saved: false, synchronized: false };
    }

    // Keep persistence mutation and in-memory synchronization separate. A failed
    // reload must not make the caller retry the already committed audit mutation.
    const synchronizationResult = await actionRunner.runAction(
      'Failed to synchronize time log after edit',
      async () => {
        const nextState = await PersistenceRouter.getInstance().core.load();
        if (!nextState) {
          throw new Error('Repository state unavailable after editing time log');
        }

        repositoryState.setLogsState(nextState.logs);
        repositoryState.setActiveLogState(nextState.activeLog);
        repositoryState.setActiveLogsState(nextState.activeLogs ?? (nextState.activeLog ? [nextState.activeLog] : []));
        await refreshComputedMetrics();
        return true;
      },
      { errorCode: 'ERR_REPOSITORY_SYNC_TIME_LOG', rethrow: false }
    );

    return { saved: true, synchronized: synchronizationResult === true };
  };

  const setLogs = async (action: SetStateAction<TimeLog[]>) => {
    await actionRunner.runAction(
      'Failed to set logs',
      async () => {
        const resolved = typeof action === 'function' ? action(repositoryState.logs) : action;
        const nextState = await PersistenceRouter.getInstance().core.overrideState({ logs: resolved });
        repositoryState.setLogsState(nextState.logs);
        await refreshComputedMetrics();
      },
      { withLoading: false }
    );
  };

  const setActiveLog = async (action: SetStateAction<TimeLog | null>) => {
    await actionRunner.runAction(
      'Failed to set active log',
      async () => {
        const resolved = typeof action === 'function' ? action(repositoryState.activeLog) : action;
        const nextState = await PersistenceRouter.getInstance().core.overrideState({ activeLog: resolved });
        repositoryState.setActiveLogState(nextState.activeLog);
        await refreshComputedMetrics();
      },
      { withLoading: false }
    );
  };

  const handleDeleteTimeLog = async (
    id: string
  ): Promise<{ deleted: boolean; synchronized: boolean }> => {
    const mutationResult = await actionRunner.runAction(
      'Failed to delete time log',
      async () => {
        await PersistenceRouter.getInstance().timeLogs.delete(id);
        return true;
      },
      { errorCode: 'ERR_REPOSITORY_DELETE_TIME_LOG', rethrow: true }
    );

    if (mutationResult !== true) {
      return { deleted: false, synchronized: false };
    }

    const synchronizationResult = await actionRunner.runAction(
      'Failed to synchronize time logs after delete',
      async () => {
        const nextState = await PersistenceRouter.getInstance().core.load();
        if (!nextState) {
          throw new Error('Repository state unavailable after deleting time log');
        }

        repositoryState.setLogsState(nextState.logs);
        repositoryState.setActiveLogState(nextState.activeLog);
        repositoryState.setActiveLogsState(nextState.activeLogs ?? (nextState.activeLog ? [nextState.activeLog] : []));
        await refreshComputedMetrics();
        return true;
      },
      { errorCode: 'ERR_REPOSITORY_SYNC_TIME_LOG', rethrow: false }
    );

    return { deleted: true, synchronized: synchronizationResult === true };
  };

  const handleInsertTimeLog = async (
    id: string,
    taskId: string,
    startTime: string,
    endTime?: string | null,
    note?: string | null
  ): Promise<void> => {
    await actionRunner.runAction('Failed to insert time log', async () => {
      await PersistenceRouter.getInstance().timeLogs.insert(id, taskId, startTime);
      if (endTime || note) {
        await EngineRouter.getInstance().timeLogs.editTimeLog(
          id,
          taskId,
          startTime,
          endTime ?? null,
          note || null,
          'Manual insertion'
        );
      }
      const nextState = await PersistenceRouter.getInstance().core.load();
      if (nextState) {
        repositoryState.setLogsState(nextState.logs);
        repositoryState.setActiveLogState(nextState.activeLog);
        await refreshComputedMetrics();
      }
    });
  };

  return {
    logs: repositoryState.logs,
    activeLog: repositoryState.activeLog,
    setLogs,
    setActiveLog,
    handleStartTimer,
    handleStopTimer,
    handleEditTimeLog,
    handleDeleteTimeLog,
    handleInsertTimeLog,
    notifyActiveLogChanges,
  };
};

export type TimerManagerHook = ReturnType<typeof useTimerManager>;
