import { describe, it, expect } from 'vitest';
import { localDateOfRange } from '@common/engine/range/logRange';
import { resolveSandboxRange, resolveSandboxToday } from '@features/cli/sandbox/router/sandboxRange';
import { TerminalOutput } from '@features/cli/utils/terminalOutput';

// Wednesday 2026-11-11 23:30 UTC is already Thursday 2026-11-12 in Warsaw (UTC+1).
const NOW = new Date('2026-11-11T23:30:00Z');

function firstError(output: TerminalOutput) {
  return output.getLines().find((line) => line.type === 'error');
}

describe('resolveSandboxRange', () => {
  it('should resolve the Monday-start week when --week is given', () => {
    // Arrange
    const output = new TerminalOutput();

    // Act
    const range = resolveSandboxRange({ week: true, tz: 'UTC' }, output, NOW);

    // Assert
    expect(range).toMatchObject({ from: '2026-11-09T00:00:00Z', to: '2026-11-16T00:00:00Z' });
  });

  it('should map --last-month to the previous calendar month', () => {
    // Arrange
    const output = new TerminalOutput();

    // Act
    const range = resolveSandboxRange({ 'last-month': true, tz: 'UTC' }, output, NOW);

    // Assert
    expect(range).toMatchObject({ from: '2026-10-01T00:00:00Z', to: '2026-11-01T00:00:00Z' });
  });

  it('should resolve yesterday on the local calendar of the --tz zone', () => {
    // Arrange
    const output = new TerminalOutput();

    // Act
    const range = resolveSandboxRange({ yesterday: true, tz: 'Europe/Warsaw' }, output, NOW);

    // Assert
    expect(range).toMatchObject({ from: '2026-11-10T23:00:00Z', to: '2026-11-11T23:00:00Z' });
  });

  it('should leave the range unbounded when no period flag is given', () => {
    // Arrange
    const output = new TerminalOutput();

    // Act
    const range = resolveSandboxRange({}, output, NOW);

    // Assert
    expect(range?.from).toBeUndefined();
    expect(range?.to).toBeUndefined();
  });

  it('should treat a date-only --to as exclusive of the following day', () => {
    // Arrange
    const output = new TerminalOutput();

    // Act
    const range = resolveSandboxRange({ from: '2026-10-14', to: '2026-10-14', tz: 'UTC' }, output, NOW);

    // Assert
    expect(range).toMatchObject({ from: '2026-10-14T00:00:00Z', to: '2026-10-15T00:00:00Z' });
  });

  it('should reject two presets with a syntax error', () => {
    // Arrange
    const output = new TerminalOutput();

    // Act
    const range = resolveSandboxRange({ today: true, week: true }, output, NOW);

    // Assert
    expect(range).toBeNull();
    expect(firstError(output)).toMatchObject({ errorCode: 'CLI_SYNTAX_INVALID_ARGS', exitCode: 2 });
  });

  it('should reject a preset combined with --from with a syntax error', () => {
    // Arrange
    const output = new TerminalOutput();

    // Act
    const range = resolveSandboxRange({ month: true, from: '2026-10-01' }, output, NOW);

    // Assert
    expect(range).toBeNull();
    expect(firstError(output)).toMatchObject({ errorCode: 'CLI_SYNTAX_INVALID_ARGS', exitCode: 2 });
  });

  it('should reject an unknown timezone with a syntax error', () => {
    // Arrange
    const output = new TerminalOutput();

    // Act
    const range = resolveSandboxRange({ week: true, tz: 'Mars/Olympus' }, output, NOW);

    // Assert
    expect(range).toBeNull();
    expect(firstError(output)).toMatchObject({ errorCode: 'CLI_SYNTAX_INVALID_ARGS', exitCode: 2 });
    expect(firstError(output)?.text.toLowerCase()).toContain('invalid timezone');
  });

  it('should reject --tz given without a value', () => {
    // Arrange
    const output = new TerminalOutput();

    // Act
    const range = resolveSandboxRange({ week: true, tz: true }, output, NOW);

    // Assert
    expect(range).toBeNull();
    expect(firstError(output)).toMatchObject({ exitCode: 2 });
  });

  it('should reject an inverted custom range with a syntax error', () => {
    // Arrange
    const output = new TerminalOutput();

    // Act
    const range = resolveSandboxRange({ from: '2026-10-31', to: '2026-10-01', tz: 'UTC' }, output, NOW);

    // Assert
    expect(range).toBeNull();
    expect(firstError(output)).toMatchObject({ errorCode: 'CLI_SYNTAX_INVALID_ARGS', exitCode: 2 });
  });
});

describe('resolveSandboxToday', () => {
  it('should resolve today on the --tz calendar day', () => {
    // Arrange
    const output = new TerminalOutput();

    // Act
    const range = resolveSandboxToday({ tz: 'Europe/Warsaw' }, output, NOW);

    // Assert
    expect(range).not.toBeNull();
    expect(localDateOfRange(range!)).toBe('2026-11-12');
  });

  it('should reject an unknown timezone with a syntax error', () => {
    // Arrange
    const output = new TerminalOutput();

    // Act
    const range = resolveSandboxToday({ tz: 'Mars/Olympus' }, output, NOW);

    // Assert
    expect(range).toBeNull();
    expect(firstError(output)).toMatchObject({ exitCode: 2 });
  });
});
