import { describe, it, expect, vi } from 'vitest';
import {
  runLogsCommand,
  runReportCommand,
  runTimeCommand
} from '@features/cli/utils/ReportCommands';
import { TerminalLine, CliEngineContext } from '@features/cli/utils/Commands';

describe('Unit Tests: ReportCommands', () => {
  const getMockContext = (): CliEngineContext => ({
    projects: [
      { id: 'p1', name: 'Project 1', color: 'indigo', createdAt: '2026-06-15T00:00:00Z', archived: false, description: null, icon: null, tags: null }
    ],
    tasks: [
      { id: 't1', projectId: 'p1', name: 'Task 1', completed: false, createdAt: '2026-06-15T00:00:00Z', status: null, parentTaskId: null }
    ],
    logs: [
      { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T13:00:00Z', note: null, editHistory: null },
      { id: 'l2', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T14:00:00Z', endTime: null, note: null, editHistory: null }
    ],
    activeLog: null,
    onAddProject: vi.fn(),
    onAddTask: vi.fn(),
    onToggleTaskComplete: vi.fn(),
    onStartTimer: vi.fn(),
    onStopTimer: vi.fn(),
    nowIso: '2026-06-15T15:00:00Z',
    locale: 'en',
    customTranslations: {},
    holidays: [],
    setHolidays: vi.fn(),
    selectedTaskId: null,
    setSelectedTaskId: vi.fn(),
  });

  it('runLogsCommand should list all logs', () => {
    const outputs: TerminalLine[] = [];
    runLogsCommand([], getMockContext(), outputs);
    expect(outputs.some(o => o.text.includes('l1') || o.text.includes('l2'))).toBe(true);
  });

  it('runLogsCommand should filter logs by running status', () => {
    const outputs: TerminalLine[] = [];
    runLogsCommand(['running'], getMockContext(), outputs);
    // Should contain the running log (l2)
    expect(outputs.some(o => o.text.includes('l2'))).toBe(true);
    // Should NOT contain captured log (l1) in success/output status (running are success/output depending on end time)
    expect(outputs.some(o => o.text.includes('l1'))).toBe(false);
  });

  it('runReportCommand should generate project duration report', () => {
    const outputs: TerminalLine[] = [];
    runReportCommand(['today'], getMockContext(), outputs);
    expect(outputs.some(o => o.text.includes('Project 1'))).toBe(true);
    expect(outputs.some(o => o.text.includes('█'))).toBe(true);
  });

  it('runTimeCommand should display project profile time', () => {
    const outputs: TerminalLine[] = [];
    runTimeCommand(['profile', 'p1'], getMockContext(), outputs);
    expect(outputs.some(o => o.text.includes('Project 1') || o.text.includes('p1'))).toBe(true);
  });

  it('runTimeCommand should display task elapsed time', () => {
    const outputs: TerminalLine[] = [];
    runTimeCommand(['task', 't1'], getMockContext(), outputs);
    expect(outputs.some(o => o.text.includes('Task 1') || o.text.includes('t1'))).toBe(true);
  });
});
