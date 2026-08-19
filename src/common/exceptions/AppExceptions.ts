import { AbstractException } from './AbstractException';
import { ErrorLevel } from './ErrorLevel';

export class ContextException extends AbstractException {
  constructor(message: string, code?: string, cause?: unknown) {
    super(message, 'FATAL', code, cause);
  }
}

export class TauriInteropException extends AbstractException {
  constructor(message: string, cause?: unknown, code?: string) {
    super(message, 'ERROR', code, cause);
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


