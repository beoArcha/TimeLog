import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandler, ContextException, PersistenceException } from '@common/exceptions';

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log ContextException with FATAL prefix when handled', () => {
    // Arrange
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ex = new ContextException('State corrupted', 'ERR_CONTEXT_MIGRATION', new Error('Underlying DB error'));

    // Act
    ErrorHandler.handle(ex);

    // Assert
    expect(errorSpy).toHaveBeenCalled();
    const firstArg = errorSpy.mock.calls[0][0];
    expect(firstArg).toContain('[FATAL]');
    expect(firstArg).toContain('[ERR_CONTEXT_MIGRATION]');
  });

  it('should log PersistenceException with WARN level to console.warn when handled', () => {
    // Arrange
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ex = new PersistenceException('Disk full warning', undefined, 'ERR_DISK_WARN', 'WARN');

    // Act
    ErrorHandler.handle(ex);

    // Assert
    expect(warnSpy).toHaveBeenCalled();
    const firstArg = warnSpy.mock.calls[0][0];
    expect(firstArg).toContain('[WARN]');
    expect(firstArg).toContain('[ERR_DISK_WARN]');
  });

  it('should log PersistenceException with INFO level to console.info when handled', () => {
    // Arrange
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const ex = new PersistenceException('Database sync started', undefined, 'ERR_SYNC_INFO', 'INFO');

    // Act
    ErrorHandler.handle(ex);

    // Assert
    expect(infoSpy).toHaveBeenCalled();
    const firstArg = infoSpy.mock.calls[0][0];
    expect(firstArg).toContain('[INFO]');
    expect(firstArg).toContain('[ERR_SYNC_INFO]');
  });

  it('should log unhandled standard Error to console.error with UNHANDLED prefix', () => {
    // Arrange
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('Generic failure');

    // Act
    ErrorHandler.handle(err);

    // Assert
    expect(errorSpy).toHaveBeenCalledWith('[UNHANDLED ERROR]', 'Generic failure', err);
  });

  it('should log primitive or unknown value to console.error with UNKNOWN prefix', () => {
    // Arrange
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    ErrorHandler.handle('Weird string error');

    // Assert
    expect(errorSpy).toHaveBeenCalledWith('[UNKNOWN ERROR]', 'Weird string error');
  });
});
