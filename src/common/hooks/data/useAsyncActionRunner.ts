import { useState } from 'react';
import { ErrorHandler, RepositoryException } from '@common/exceptions';

export interface RunActionOptions {
  errorCode?: string;
  rethrow?: boolean;
  withLoading?: boolean;
}

export const useAsyncActionRunner = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [repositoryError, setRepositoryError] = useState<string | null>(null);

  const runAction = async <T>(
    errorMessage: string,
    action: () => Promise<T>,
    options?: RunActionOptions
  ): Promise<T | undefined> => {
    const withLoading = options?.withLoading ?? true;
    try {
      if (withLoading) {
        setIsLoading(true);
      }
      setRepositoryError(null);
      return await action();
    } catch (err) {
      const code = options?.errorCode ?? 'ERR_REPOSITORY';
      ErrorHandler.handle(new RepositoryException(errorMessage, err, code));
      setRepositoryError(err instanceof Error ? err.message : errorMessage);
      if (options?.rethrow) {
        throw err;
      }
      return undefined;
    } finally {
      if (withLoading) {
        setIsLoading(false);
      }
    }
  };

  return {
    isLoading,
    setIsLoading,
    repositoryError,
    setRepositoryError,
    runAction,
  };
};

export type AsyncActionRunnerHook = ReturnType<typeof useAsyncActionRunner>;
