import { AbstractException } from './AbstractException';
import { ErrorLevel } from './ErrorLevel';
import type { IpcErrorPayload } from '@bindings/IpcErrorPayload';

export class ContextException extends AbstractException {
  constructor(message: string, code?: string, cause?: unknown) {
    super(message, 'FATAL', code, cause);
  }
}

export class TauriInteropException extends AbstractException {
  public readonly ipcError?: IpcErrorPayload;

  constructor(message: string, cause?: unknown, code?: string) {
    let resolvedCode = code;
    let resolvedMessage = message;
    let ipcError: IpcErrorPayload | undefined;

    if (cause && typeof cause === 'object' && 'code' in cause && 'message' in cause) {
      ipcError = cause as IpcErrorPayload;
      resolvedCode = resolvedCode ?? ipcError.code;
      resolvedMessage = `${message}: ${ipcError.message}`;
    }

    super(resolvedMessage, 'ERROR', resolvedCode, cause);
    this.ipcError = ipcError;
  }
}

export class NetworkException extends AbstractException {
  constructor(message: string, cause?: unknown, code?: string) {
    super(message, 'ERROR', code, cause);
  }
}

export class RepositoryException extends AbstractException {
  constructor(message: string, cause?: unknown, code?: string) {
    super(message, 'ERROR', code, cause);
  }
}

export class PersistenceException extends AbstractException {
  constructor(message: string, cause?: unknown, code?: string, level: ErrorLevel = 'ERROR') {
    super(message, level, code, cause);
  }
}

export class EntityNotFoundException extends AbstractException {
  constructor(message: string, code?: string, cause?: unknown) {
    super(message, 'ERROR', code, cause);
  }
}

export class EngineException extends AbstractException {
  constructor(message: string, cause?: unknown, code?: string, level: ErrorLevel = 'ERROR') {
    super(message, level, code, cause);
  }
}

export class EngineValidationException extends EngineException {
  constructor(message: string, cause?: unknown, code: string = 'ERR_ENGINE_VALIDATION') {
    super(message, cause, code, 'ERROR');
  }
}

export const EngineError = EngineException;
export type EngineError = EngineException;

export const EngineValidationError = EngineValidationException;
export type EngineValidationError = EngineValidationException;

export class BackupValidationException extends AbstractException {
  constructor(message: string, cause?: unknown, code: string = 'ERR_BACKUP_VALIDATION') {
    super(message, 'ERROR', code, cause);
  }
}

export class WorkflowException extends AbstractException {
  constructor(message: string, cause?: unknown, code: string = 'ERR_WORKFLOW', level: ErrorLevel = 'ERROR') {
    super(message, level, code, cause);
  }
}
