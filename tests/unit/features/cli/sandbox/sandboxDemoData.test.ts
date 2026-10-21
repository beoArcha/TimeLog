import { describe, it, expect } from 'vitest';
import {
  createDemoProjects,
  createDemoTasks,
  createDemoLogs,
  createDemoHolidays,
} from '@features/cli/sandbox/sandboxDemoData';

describe('Unit Tests: sandboxDemoData', () => {
  it('should generate valid initial demo entities with sandbox id prefixes', () => {
    // Arrange & Act
    const projects = createDemoProjects();
    const tasks = createDemoTasks();
    const logs = createDemoLogs();
    const holidays = createDemoHolidays();

    // Assert
    expect(projects.every(p => p.id.startsWith('sb_p'))).toBe(true);
    expect(tasks.every(t => t.id.startsWith('sb_t'))).toBe(true);
    expect(logs.every(l => l.id.startsWith('sb_l'))).toBe(true);
    expect(holidays.every(h => h.id.startsWith('sb_hol'))).toBe(true);
  });
});
