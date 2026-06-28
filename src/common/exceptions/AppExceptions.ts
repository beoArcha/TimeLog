import { AbstractException } from './AbstractException';

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
  constructor(message: string, cause?: unknown, code?: string) {
    super(message, 'ERROR', code, cause);
  }
}
