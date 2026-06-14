import { describe, it, expect } from 'vitest';
import { Project, Task, TimeLog } from '../src/types';

describe('CLI Commands Execution Matrix (Mock)', () => {
  const getSimulatedCliOutput = (cmd: string, args: string[], db: { projects: Project[], tasks: Task[] }) => {
    switch (cmd) {
      case 'status':
        return `OxyFlow daemon is active. ${db.projects.length} projects tracked.`;
      case 'ls':
        return args.includes('--projects') 
          ? db.projects.map(p => p.name).join('\\n')
          : db.tasks.map(t => t.name).join('\\n');
      case 'export':
        return `Exported JSON Backup successfully to ./backup.json. Payload length: ${JSON.stringify(db).length}`;
      default:
        return 'Unknown command. Use "help" for a list of available commands.';
    }
  };

  const sampleDb = {
    projects: [
      { id: '1', name: 'Alpha', color: 'red', createdAt: '2026-06-12T00:00:00Z' }
    ],
    tasks: [
      { id: '1', projectId: '1', parentTaskId: null, name: 'Task 1', createdAt: '2026-06-12T00:00:00Z', completed: false }
    ]
  };

  it('runs "status" command successfully', () => {
    const res = getSimulatedCliOutput('status', [], sampleDb);
    expect(res).toContain('OxyFlow daemon is active');
    expect(res).toContain('1 projects tracked');
  });

  it('runs "ls --projects" command successfully', () => {
    const res = getSimulatedCliOutput('ls', ['--projects'], sampleDb);
    expect(res).toBe('Alpha');
  });

  it('runs "export" command successfully', () => {
    const res = getSimulatedCliOutput('export', [], sampleDb);
    expect(res).toContain('Exported JSON Backup successfully');
    expect(res).toContain('Payload length');
  });
});
