import { useState, type SetStateAction } from 'react';
import { PatchLog } from '@bindings/PatchLog';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { ErrorHandler, RepositoryException } from '@common/exceptions';

export interface UsePatchesManagerOptions {
  onError?: (error: string | null) => void;
}

export const usePatchesManager = (options?: UsePatchesManagerOptions) => {
  const [patches, setPatchesState] = useState<PatchLog[]>([]);

  const setPatches = async (action: SetStateAction<PatchLog[]>) => {
    try {
      options?.onError?.(null);
      const resolved = typeof action === 'function' ? action(patches) : action;
      await PersistenceRouter.getInstance().patches.save(resolved);
      setPatchesState(resolved);
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to set patches', err, 'ERR_REPOSITORY'));
      options?.onError?.(err instanceof Error ? err.message : 'Failed to set patches');
    }
  };

  return {
    patches,
    setPatchesState,
    setPatches,
  };
};
