// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DbInspector from '@features/db-explorer/components/DbInspector';
import { GuiState } from '@layouts/hooks/useGuiLogic';

describe('Unit Tests: DbInspector', () => {
  const getMockGuiState = (): GuiState => ({
    projects: [
      { id: 'p1', name: 'Proj 1', color: 'red', createdAt: '2026-06-15T00:00:00Z', archived: false, description: null, icon: null, tags: null }
    ],
    tasks: [
      { id: 't1', projectId: 'p1', name: 'Task 1', completed: false, createdAt: '2026-06-15T00:00:00Z', status: null, parentTaskId: null }
    ],
    logs: [
      { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T13:00:00Z', note: 'test', editHistory: null }
    ],
    nowIso: '2026-06-15T14:00:00Z',
    locale: 'en',
    customTranslations: {},
    theme: 'dark',
    activeLog: null,
    holidays: [],
    setHolidays: vi.fn(),
    sysSettings: { autoStart: false, autoPauseOnSleep: true, includePatchesInReports: false, activeSinks: [] },
    selectedTaskId: null,
    setSelectedTaskId: vi.fn(),
    onAddProject: vi.fn(),
    onAddTask: vi.fn(),
    onRenameProject: vi.fn(),
    onRenameTask: vi.fn(),
    onUpdateProject: vi.fn(),
    onUpdateTask: vi.fn(),
    onToggleTaskComplete: vi.fn(),
    onDeleteTask: vi.fn(),
    onStartTimer: vi.fn(),
    onStopTimer: vi.fn(),
    onToggleProjectArchive: vi.fn(),
    showDbInspector: true,
    setShowDbInspector: vi.fn(),
    activeLargeTab: 'db',
    activeView: 'tasks',
    patches: []
  } as unknown as GuiState);


  it('should render the SQLite Client header and tables', () => {
    const state = getMockGuiState();
    render(<DbInspector state={state} isCondensed={false} />);

    expect(screen.getByText(/oxytime.db • SQLite Client/i)).not.toBeNull();
    expect(screen.getByText(/TABLE projects/i)).not.toBeNull();
    expect(screen.getByText(/TABLE tasks/i)).not.toBeNull();
  });

  it('should toggle db inspector on button click', () => {
    const state = getMockGuiState();
    const { container } = render(<DbInspector state={state} isCondensed={false} />);

    const buttons = container.getElementsByTagName('button');
    const toggleBtn = Array.from(buttons).find(b => b.id === 'toggle-db-inspector-btn');

    expect(toggleBtn).not.toBeUndefined();
    fireEvent.click(toggleBtn!);

    expect(state.setShowDbInspector).toHaveBeenCalledWith(false);
  });
});
