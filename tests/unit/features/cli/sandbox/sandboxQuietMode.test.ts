import { describe, it, expect, beforeEach } from 'vitest';
import { SandboxEmulatorStore } from '@features/cli/sandbox/sandboxEmulatorStore';
import { SandboxCommandRouter, parseFlags } from '@features/cli/sandbox/sandboxCommandRouter';
import { TerminalOutput } from '@features/cli/utils/terminalOutput';

describe('Unit Tests: SandboxCommandRouter quiet mode', () => {
  let store: SandboxEmulatorStore;

  beforeEach(() => {
    SandboxEmulatorStore.resetInstanceForTesting();
    store = SandboxEmulatorStore.getInstance();
  });

  describe('parseFlags', () => {
    it('should keep the positional after -q as the command argument when quiet precedes it', () => {
      // Arrange
      const tokens = ['add', '-q', 'ParityQuiet'];

      // Act
      const parsed = parseFlags(tokens);

      // Assert
      expect(parsed.positionals).toEqual(['add', 'ParityQuiet']);
      expect(parsed.flags['q']).toBe(true);
    });

    it('should treat the long --quiet flag as a presence-only switch', () => {
      // Arrange
      const tokens = ['--quiet', 'ParityQuiet'];

      // Act
      const parsed = parseFlags(tokens);

      // Assert
      expect(parsed.positionals).toEqual(['ParityQuiet']);
      expect(parsed.flags['quiet']).toBe(true);
    });
  });

  describe('Task mutations in quiet mode', () => {
    it('should print only the new task identifier when executing task add with -q', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      SandboxCommandRouter.route(['task', 'add', 'Quiet Sandbox Task', '-p', 'sb_p1', '-q'], store, output);

      // Assert
      const lines = output.getLines();
      const created = store.getTasks().find((t) => t.name === 'Quiet Sandbox Task');
      expect(created).toBeDefined();
      expect(lines).toHaveLength(1);
      expect(lines[0].type).toBe('output');
      expect(lines[0].text).toBe(created?.id);
    });

    it('should print the human confirmation when executing task add without quiet', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      SandboxCommandRouter.route(['task', 'add', 'Verbose Sandbox Task', '-p', 'sb_p1'], store, output);

      // Assert
      const text = output.getLines().map((l) => l.text).join('\n');
      expect(text).toContain('Task created');
    });

    it('should print only the task identifier when executing task done with --quiet', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      SandboxCommandRouter.route(['task', 'done', 'sb_t1', '--quiet'], store, output);

      // Assert
      const lines = output.getLines();
      expect(lines).toHaveLength(1);
      expect(lines[0].text).toBe('sb_t1');
    });

    it('should still report an error on stderr when quiet mode targets a missing task', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      SandboxCommandRouter.route(['task', 'done', 'sb_missing', '-q'], store, output);

      // Assert
      const errorLine = output.getLines().find((l) => l.type === 'error');
      expect(errorLine).toBeDefined();
      expect(errorLine?.exitCode).toBe(4);
    });
  });

  describe('Project mutations in quiet mode', () => {
    it('should print only the new project identifier when executing project add with -q', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      SandboxCommandRouter.route(['project', 'add', 'Quiet Project', '-q'], store, output);

      // Assert
      const created = store.getProjects().find((p) => p.name === 'Quiet Project');
      const lines = output.getLines();
      expect(lines).toHaveLength(1);
      expect(lines[0].text).toBe(created?.id);
    });
  });

  describe('List output in quiet mode', () => {
    it('should render project rows without table borders or headers when executing project ls with -q', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      SandboxCommandRouter.route(['project', 'ls', '-q'], store, output);

      // Assert
      const lines = output.getLines();
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.every((l) => l.type === 'output')).toBe(true);
      expect(lines.some((l) => l.text.includes('Total Time') || l.text.includes('┌'))).toBe(false);
    });

    it('should render task rows without project labels or table borders when executing task ls with -q', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      SandboxCommandRouter.route(['task', 'ls', '-q'], store, output);

      // Assert
      const lines = output.getLines();
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.some((l) => l.text.startsWith('Project:'))).toBe(false);
      expect(lines.some((l) => l.text.includes('┌') || l.text.includes('Task Title'))).toBe(false);
    });

    it('should render log rows without table borders or footers when executing log ls with -q', () => {
      // Arrange
      store.handleAddLog('sb_t1', 900, null, new Date().toISOString());
      const output = new TerminalOutput();

      // Act
      SandboxCommandRouter.route(['log', 'ls', '-q'], store, output);

      // Assert
      const lines = output.getLines();
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.some((l) => l.text.includes('┌') || l.text.includes('Time (Start'))).toBe(false);
      expect(lines.some((l) => l.text.includes('more entries not shown'))).toBe(false);
    });

    it('should print nothing when executing project ls with -q on an empty sandbox', () => {
      // Arrange
      store.seedForTesting({
        projects: [],
        tasks: [],
        logs: [],
        activeLog: null,
        selectedTaskId: null,
      });
      const output = new TerminalOutput();

      // Act
      SandboxCommandRouter.route(['project', 'ls', '-q'], store, output);

      // Assert
      expect(output.getLines()).toHaveLength(0);
    });
  });
});
