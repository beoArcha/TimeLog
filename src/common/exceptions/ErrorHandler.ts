import { AbstractException } from './AbstractException';

export class ErrorHandler {
  static handle(error: unknown): void {
    if (error instanceof AbstractException) {
      this.logAbstractException(error);
    } else if (error instanceof Error) {
      console.error('[UNHANDLED ERROR]', error.message, error);
    } else {
      console.error('[UNKNOWN ERROR]', error);
    }
  }

  private static logAbstractException(error: AbstractException): void {
    const logPrefix = `[${error.level}]${error.code ? ` [${error.code}]` : ''} ${error.name}:`;
    
    switch (error.level) {
      case 'FATAL':
      case 'ERROR':
        console.error(logPrefix, error.message, '\nCause:', error.cause, '\nStack:', error.stack);
        break;
      case 'WARN':
        console.warn(logPrefix, error.message, '\nCause:', error.cause);
        break;
      case 'INFO':
        console.info(logPrefix, error.message, '\nCause:', error.cause);
        break;
    }
  }
}
