import { describe, it, expect, vi } from 'vitest';
import { executeCliCommand } from '@features/cli/utils/CliEngine';
import { CliEngineContext } from '@features/cli/utils/Commands';

describe('Unit Tests: CliEngine', () => {
  const mockContext: CliEngineContext = {
    projects: [
      { id: 'p1', name: 'Project One', color: 'indigo', createdAt: '2026-06-15T00:00:00Z', archived: false, description: null, icon: null, tags: null }
    ],
    tasks: [
      { id: 't1', projectId: 'p1', name: 'Task One', completed: false, createdAt: '2026-06-15T00:00:00Z', status: null, parentTaskId: null }
    ],
    logs: [],
    activeLog: null,
    onAddProject: vi.fn(),
    onAddTask: vi.fn(),
    onToggleTaskComplete: vi.fn(),
    onStartTimer: vi.fn(),
    onStopTimer: vi.fn(),
    nowIso: '2026-06-15T12:00:00Z',
    locale: 'en',
    customTranslations: {},
    holidays: [],
    setHolidays: vi.fn(),
    selectedTaskId: null,
    setSelectedTaskId: vi.fn(),
  };

  it('should return empty lines if command is empty or whitespace', () => {
    expect(executeCliCommand('', mockContext)).toEqual([]);
    expect(executeCliCommand('   ', mockContext)).toEqual([]);
  });

  it('should execute help command', () => {
    const res = executeCliCommand('help', mockContext);
    expect(res.length).toBeGreaterThan(2);
    expect(res[0].type).toBe('input');
    expect(res[1].type).toBe('info'); // title
  });

  it('should return clear token for clear command', () => {
    const res = executeCliCommand('clear', mockContext);
    expect(res).toEqual([{ text: '__CLEAR__', type: 'info' }]);
  });

  it('should return error output for unknown commands', () => {
    const res = executeCliCommand('unknowncmd', mockContext);
    expect(res.some(line => line.type === 'error' && line.text.includes('Nieznane polecenie'))).toBe(true);
  });

  it('should parse double and single quoted arguments correctly', () => {
    // We can spy on runAddProjectCommand or verify via the parsed arguments
    const addProjMock = vi.fn();
    const customCtx = { ...mockContext, onAddProject: addProjMock };
    executeCliCommand('addproject "My Special Project"', customCtx);
    expect(addProjMock).toHaveBeenCalledWith('My Special Project', 'indigo');
  });
});
