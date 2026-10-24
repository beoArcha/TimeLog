import { describe, it, expect, beforeEach } from 'vitest';
import { SandboxEmulatorStore } from '@features/cli/sandbox/sandboxEmulatorStore';
import {
  SandboxCommandRouter,
  normalizeLegacyCommand,
  parseFlags,
} from '@features/cli/sandbox/sandboxCommandRouter';
import { TerminalOutput } from '@features/cli/utils/terminalOutput';

describe('Unit Tests: SandboxCommandRouter', () => {
  let store: SandboxEmulatorStore;

  beforeEach(() => {
    SandboxEmulatorStore.resetInstanceForTesting();
    store = SandboxEmulatorStore.getInstance();
  });

  describe('normalizeLegacyCommand', () => {
    it('should map addproject alias to canonical project add', () => {
      // Arrange
      const input = ['addproject', 'Mobile App'];

      // Act
      const result = normalizeLegacyCommand(input);

      // Assert
      expect(result).toEqual(['project', 'add', 'Mobile App']);
    });

    it('should map renameproject alias to canonical project rename', () => {
      // Arrange
      const input = ['renameproject', 'sb_p1', 'Brand Refresh'];

      // Act
      const result = normalizeLegacyCommand(input);

      // Assert
      expect(result).toEqual(['project', 'rename', 'sb_p1', 'Brand Refresh']);
    });

    it('should map addtask alias to canonical task add with -p flag', () => {
      // Arrange
      const input = ['addtask', 'sb_p1', 'Create Wireframes'];

      // Act
      const result = normalizeLegacyCommand(input);

      // Assert
      expect(result).toEqual(['task', 'add', 'Create Wireframes', '-p', 'sb_p1']);
    });

    it('should map addsubtask alias to canonical task add with -P flag', () => {
      // Arrange
      const input = ['addsubtask', 'sb_t1', 'Refine Palette'];

      // Act
      const result = normalizeLegacyCommand(input);

      // Assert
      expect(result).toEqual(['task', 'add', 'Refine Palette', '-P', 'sb_t1']);
    });

    it('should map complete alias to canonical task done', () => {
      // Arrange
      const input = ['complete', 'sb_t1'];

      // Act
      const result = normalizeLegacyCommand(input);

      // Assert
      expect(result).toEqual(['task', 'done', 'sb_t1']);
    });

    it('should map renametask alias to canonical task rename', () => {
      // Arrange
      const input = ['renametask', 'sb_t1', 'New Heading'];

      // Act
      const result = normalizeLegacyCommand(input);

      // Assert
      expect(result).toEqual(['task', 'rename', 'sb_t1', 'New Heading']);
    });

    it('should map tasks alias to canonical task list', () => {
      // Arrange
      const inputWithProj = ['tasks', 'sb_p1'];
      const inputWithoutProj = ['tasks'];

      // Act
      const resultWithProj = normalizeLegacyCommand(inputWithProj);
      const resultWithoutProj = normalizeLegacyCommand(inputWithoutProj);

      // Assert
      expect(resultWithProj).toEqual(['task', 'list', '-p', 'sb_p1']);
      expect(resultWithoutProj).toEqual(['task', 'list']);
    });

    it('should map projects alias to canonical project list', () => {
      // Arrange
      const input = ['projects'];

      // Act
      const result = normalizeLegacyCommand(input);

      // Assert
      expect(result).toEqual(['project', 'list']);
    });
  });

  describe('parseFlags', () => {
    it('should separate positional tokens and flags correctly', () => {
      // Arrange
      const tokens = ['add', 'My Task', '-p', 'p1', '-P', 't1', '--all'];

      // Act
      const parsed = parseFlags(tokens);

      // Assert
      expect(parsed.positionals).toEqual(['add', 'My Task']);
      expect(parsed.flags['p']).toBe('p1');
      expect(parsed.flags['P']).toBe('t1');
      expect(parsed.flags['all']).toBe(true);
    });

    it('should handle key=value formatted long flags', () => {
      // Arrange
      const tokens = ['create', '--color=emerald', 'App Project'];

      // Act
      const parsed = parseFlags(tokens);

      // Assert
      expect(parsed.positionals).toEqual(['create', 'App Project']);
      expect(parsed.flags['color']).toBe('emerald');
    });
  });

  describe('Project commands routing', () => {
    it('should list projects when executing project list', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      const handled = SandboxCommandRouter.route(['project', 'list'], store, output);

      // Assert
      expect(handled).toBe(true);
      const lines = output.getLines();
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.some((l) => l.text.includes('Total Time'))).toBe(true);
    });

    it('should add a new project when executing project add', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      const handled = SandboxCommandRouter.route(
        ['project', 'add', 'Router Test Project', '-c', 'rose'],
        store,
        output
      );

      // Assert
      expect(handled).toBe(true);
      const created = store.getProjects().find((p) => p.name === 'Router Test Project');
      expect(created).toBeDefined();
      expect(created?.color).toBe('rose');
    });

    it('should rename existing project when executing project rename', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      const handled = SandboxCommandRouter.route(
        ['project', 'rename', 'sb_p1', 'Renamed Sandbox Proj'],
        store,
        output
      );

      // Assert
      expect(handled).toBe(true);
      const renamed = store.getProjects().find((p) => p.id === 'sb_p1');
      expect(renamed?.name).toBe('Renamed Sandbox Proj');
    });

    it('should toggle archive state when executing project archive', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      const handled = SandboxCommandRouter.route(['project', 'archive', 'sb_p1'], store, output);

      // Assert
      expect(handled).toBe(true);
      const proj = store.getProjects().find((p) => p.id === 'sb_p1');
      expect(proj?.archived).toBe(true);
    });
  });

  describe('Task commands routing', () => {
    it('should list tasks when executing task list', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      const handled = SandboxCommandRouter.route(['task', 'list'], store, output);

      // Assert
      expect(handled).toBe(true);
      const lines = output.getLines();
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should create root task and subtask via task add', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act (root task)
      const handledRoot = SandboxCommandRouter.route(
        ['task', 'add', 'New Root Task', '-p', 'sb_p1'],
        store,
        output
      );

      // Assert (root task)
      expect(handledRoot).toBe(true);
      const rootTask = store.getTasks().find((t) => t.name === 'New Root Task');
      expect(rootTask).toBeDefined();
      expect(rootTask?.parentTaskId).toBeNull();

      // Act (subtask)
      const handledSub = SandboxCommandRouter.route(
        ['task', 'add', 'New Child Subtask', '-P', rootTask!.id],
        store,
        output
      );

      // Assert (subtask)
      expect(handledSub).toBe(true);
      const subTask = store.getTasks().find((t) => t.name === 'New Child Subtask');
      expect(subTask).toBeDefined();
      expect(subTask?.parentTaskId).toBe(rootTask!.id);
    });

    it('should toggle task completion state when executing task done', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      const handled = SandboxCommandRouter.route(['task', 'done', 'sb_t1'], store, output);

      // Assert
      expect(handled).toBe(true);
      const task = store.getTasks().find((t) => t.id === 'sb_t1');
      expect(task?.completed).toBe(true);
    });

    it('should rename task when executing task rename', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      const handled = SandboxCommandRouter.route(
        ['task', 'rename', 'sb_t1', 'Renamed Sandbox Task'],
        store,
        output
      );

      // Assert
      expect(handled).toBe(true);
      const task = store.getTasks().find((t) => t.id === 'sb_t1');
      expect(task?.name).toBe('Renamed Sandbox Task');
    });

    it('should archive task when executing task archive', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      const handled = SandboxCommandRouter.route(['task', 'archive', 'sb_t1'], store, output);

      // Assert
      expect(handled).toBe(true);
      const task = store.getTasks().find((t) => t.id === 'sb_t1');
      expect(task?.archived).toBe(true);
    });
  });

  describe('Timer and status routing', () => {
    it('should return idle status when no timer is active', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      const handled = SandboxCommandRouter.route(['status'], store, output);

      // Assert
      expect(handled).toBe(true);
      const lines = output.getLines();
      expect(lines.some((l) => l.text.toLowerCase().includes('idle'))).toBe(true);
    });

    it('should start timer when executing start on valid task', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      const handled = SandboxCommandRouter.route(['start', 'sb_t1'], store, output);

      // Assert
      expect(handled).toBe(true);
      expect(store.getActiveLog()?.taskId).toBe('sb_t1');
    });

    it('should return error when start is executed without target and timer is idle', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      const handled = SandboxCommandRouter.route(['start'], store, output);

      // Assert
      expect(handled).toBe(true);
      const hasError = output.getLines().some((l) => l.type === 'error');
      expect(hasError).toBe(true);
    });

    it('should return error when stop is executed on inactive timer', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      const handled = SandboxCommandRouter.route(['stop'], store, output);

      // Assert
      expect(handled).toBe(true);
      const hasError = output.getLines().some((l) => l.type === 'error');
      expect(hasError).toBe(true);
    });

    it('should stop running timer when stop is executed', () => {
      // Arrange
      store.handleStartTimer('sb_t1');
      const output = new TerminalOutput();

      // Act
      const handled = SandboxCommandRouter.route(['stop'], store, output);

      // Assert
      expect(handled).toBe(true);
      expect(store.getActiveLog()).toBeNull();
    });

    it('should atomically switch timer when switch is executed', () => {
      // Arrange
      store.handleStartTimer('sb_t1');
      const output = new TerminalOutput();

      // Act
      const handled = SandboxCommandRouter.route(['switch', 'sb_t2'], store, output);

      // Assert
      expect(handled).toBe(true);
      expect(store.getActiveLog()?.taskId).toBe('sb_t2');
    });

    it('should display progress when today command is executed', () => {
      // Arrange
      const output = new TerminalOutput();

      // Act
      const handled = SandboxCommandRouter.route(['today'], store, output);

      // Assert
      expect(handled).toBe(true);
      const lines = output.getLines();
      expect(lines.length).toBeGreaterThan(0);
    });
  });
});
