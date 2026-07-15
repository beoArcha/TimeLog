import { ErrorLevel } from './ErrorLevel';

export abstract class AbstractException extends Error {
  public readonly level: ErrorLevel;
  public readonly code?: string;
  public readonly cause?: unknown;

  constructor(message: string, level: ErrorLevel, code?: string, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.level = level;
    this.code = code;
    this.cause = cause;

    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
