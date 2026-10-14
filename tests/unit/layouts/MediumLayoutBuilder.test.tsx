// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MediumLayoutBuilder from '@layouts/builders/MediumLayoutBuilder';

vi.mock('@layouts/parts/ActiveTimerBanner', () => ({
  default: () => <div data-testid="mock-active-timer-banner">Active Timer Banner</div>
}));

vi.mock('@features/tasks/TaskListView', () => ({
  default: () => <div data-testid="mock-task-list-view">Task List View</div>
}));

vi.mock('@features/reports/ReportView', () => ({
  default: () => <div data-testid="mock-report-view">Report View</div>
}));

vi.mock('@features/db-explorer/components/DbInspector', () => ({
  default: () => <div data-testid="mock-db-inspector">Db Inspector</div>
}));

vi.mock('@features/settings/SettingsTab', () => ({
  default: () => <div data-testid="mock-settings-tab">Settings Tab</div>
}));

describe('Unit Tests: MediumLayoutBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const mockState: any = {
    theme: 'dark',
    locale: 'pl',
    projects: [
      { id: 'p1', name: 'Projekt Alfa', color: 'orange', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'p2', name: 'Projekt Beta', color: 'teal', createdAt: '2026-01-02T00:00:00Z' }
    ],
    selectedProjectId: 'p1',
    setSelectedProjectId: vi.fn(),
    tasks: [
      { id: 't1', projectId: 'p1', name: 'Zadanie 1', createdAt: '2026-01-01T00:00:00Z', completed: false }
    ],
    logs: [],
    nowIso: '2026-01-01T12:00:00Z',
    onAddProject: vi.fn(),
    customTranslations: {}
  };

  it('Given MediumLayoutBuilder rendered, Then it should show project name, tasks view and bottom nav', () => {
    render(<MediumLayoutBuilder state={mockState} />);

    expect(screen.getByTestId('medium-layout')).not.toBeNull();
    expect(screen.getByText('Projekt Alfa')).not.toBeNull();
    expect(screen.getByTestId('mock-active-timer-banner')).not.toBeNull();
    expect(screen.getByTestId('mock-task-list-view')).not.toBeNull();
  });

  it('Given user clicks project selector, Then it should open dropdown with projects list', () => {
    render(<MediumLayoutBuilder state={mockState} />);

    const projectTrigger = screen.getByTitle('Zmień projekt');
    fireEvent.click(projectTrigger);

    expect(screen.getByText('Projekt Beta')).not.toBeNull();
    expect(screen.getByText('Nowy projekt')).not.toBeNull();

    // Click on Projekt Beta
    fireEvent.click(screen.getByText('Projekt Beta'));
    expect(mockState.setSelectedProjectId).toHaveBeenCalledWith('p2');
  });

  it('Given user clicks bottom navigation tabs, Then it should switch views to reports and settings', () => {
    render(<MediumLayoutBuilder state={mockState} />);

    // Initially in tasks view
    expect(screen.getByTestId('mock-task-list-view')).not.toBeNull();

    // Click Raporty tab
    const reportsBtn = screen.getByTestId('medium-tab-reports');
    fireEvent.click(reportsBtn);

    expect(screen.getByTestId('mock-report-view')).not.toBeNull();
    expect(screen.queryByTestId('mock-task-list-view')).toBeNull();

    // Click Ustawienia tab
    const settingsBtn = screen.getByTestId('medium-tab-settings');
    fireEvent.click(settingsBtn);

    expect(screen.getByTestId('mock-settings-tab')).not.toBeNull();
    expect(screen.getByTestId('mock-db-inspector')).not.toBeNull();
    expect(screen.queryByTestId('mock-report-view')).toBeNull();
  });

  it('Given dock button clicked on PC, Then it should toggle dock position', () => {
    render(<MediumLayoutBuilder state={mockState} />);

    const dockBtn = screen.getByLabelText('Przełącz stronę dokowania');
    expect(dockBtn).not.toBeNull();

    // Click to toggle dock
    fireEvent.click(dockBtn);
    expect(localStorage.getItem('oxy_medium_dock_pos')).toBe('left');

    fireEvent.click(dockBtn);
    expect(localStorage.getItem('oxy_medium_dock_pos')).toBe('right');
  });
});
