// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import GuiInterface from '@/src/components/GuiInterface';
import { LocaleProvider } from '@/src/providers/LocaleProvider';
import { Settings as AppSettings, Project, Task, TimeLog, HolidayLeave, PatchLog } from '@/src/types';

describe('Interface isolation tests', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders GuiInterface correctly with mock data without crashing', () => {
    const mockProjects: Project[] = [
      { id: '1', name: 'Alpha', color: 'rose', createdAt: '2026-06-14T10:00:00Z', archived: false }
    ];
    const mockTasks: Task[] = [
      { id: 't1', projectId: '1', name: 'Setup', parentTaskId: null, completed: false, createdAt: '2026-06-14T10:00:00Z' }
    ];
    
    render(
      <LocaleProvider>
        <GuiInterface
          projects={mockProjects}
          tasks={mockTasks}
          logs={[]}
          activeLog={null}
          onAddProject={vi.fn()}
          onAddTask={vi.fn()}
          onToggleTaskComplete={vi.fn()}
          onStartTimer={vi.fn()}
          onStopTimer={vi.fn()}
          onToggleProjectArchive={vi.fn()}
          theme="light"
          holidays={[]}
          setHolidays={vi.fn()}
          selectedTaskId={null}
          setSelectedTaskId={vi.fn()}
          nowIso="2026-06-14T12:00:00Z"
          locale="en"
        />
      </LocaleProvider>
    );

    // Should display the project name
    expect(screen.getAllByText('Alpha').length).toBeGreaterThan(0);
    // Should display the task name
    expect(screen.getAllByText('Setup').length).toBeGreaterThan(0);
  });
});

