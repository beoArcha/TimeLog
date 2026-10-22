import { useState, useEffect } from 'react';
import { TimeLog } from '@bindings/TimeLog';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { ErrorHandler } from '@common/exceptions/ErrorHandler';

export function useLastTrackedTask(activeLog?: TimeLog | null) {
  const [persistedTaskId, setPersistedTaskId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    PersistenceRouter.getInstance()
      .uiState.getLastTrackedTaskId()
      .then((id) => {
        if (isMounted && id) {
          setPersistedTaskId(id);
        }
      })
      .catch(ErrorHandler.handle);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeLog?.taskId) {
      PersistenceRouter.getInstance()
        .uiState.saveLastTrackedTaskId(activeLog.taskId)
        .catch(ErrorHandler.handle);
    }
  }, [activeLog?.taskId]);

  return {
    lastTrackedTaskId: activeLog?.taskId ?? persistedTaskId,
  };
}
