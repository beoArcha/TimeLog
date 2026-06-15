import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SmallGuiWidget from '../src/components/SmallGuiWidget';
import TrayWidget from '../src/components/TrayWidget';
import * as useOxyFlowHook from '../src/hooks/useOxyFlow';

vi.mock('../src/hooks/useOxyFlow');

describe('Widgets Tests', () => {
  const mockProjects = [
    { id: 'proj-1', name: 'Project One', color: 'blue', isArchived: false, createdIso: new Date().toISOString(), defaultArchived: false },
  ];
  const mockTasks = [
    { id: 'task-1', projectId: 'proj-1', parentTaskId: null, name: 'Task One', completed: false, createdIso: new Date().toISOString() },
    { id: 'task-2', projectId: 'proj-1', parentTaskId: 'task-1', name: 'Subtask One', completed: false, createdIso: new Date().toISOString() },
  ];
  const mockLogs = [
    { id: 'log-1', taskId: 'task-1', projectId: 'proj-1', startTime: new Date().toISOString(), endTime: null },
  ];

  const mockUseOxyFlow = {
    projects: mockProjects,
    tasks: mockTasks,
    logs: mockLogs,
    activeLog: mockLogs[0],
    setLogs: vi.fn(),
    setActiveLog: vi.fn(),
    resolvedTheme: 'light',
    locale: 'en',
    customTranslations: {},
    nowIso: new Date().toISOString(),
    enginePID: 1234,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    useOxyFlowHook.useOxyFlow.mockReturnValue(mockUseOxyFlow);
  });

  describe('SmallGuiWidget', () => {
    it('renders and interacts correctly', () => {
      const setAlwaysOnTop = vi.fn();
      const setIsSmallExpanded = vi.fn();
      const showToast = vi.fn();
      const handleMinimizeToTray = vi.fn();
      const setGuiVariant = vi.fn();

      render(
        <SmallGuiWidget
          alwaysOnTop={true}
          setAlwaysOnTop={setAlwaysOnTop}
          isSmallExpanded={false}
          setIsSmallExpanded={setIsSmallExpanded}
          showToast={showToast}
          handleMinimizeToTray={handleMinimizeToTray}
          setGuiVariant={setGuiVariant}
          currentProjectId="proj-1"
        />
      );

      // Verify title is rendered
      expect(screen.getByText('Project One')).toBeTruthy();

      // Check always on top toggle
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
      fireEvent.click(checkbox);
      expect(setAlwaysOnTop).toHaveBeenCalledWith(false);
      expect(showToast).toHaveBeenCalled();

      // Expand to check tasks
      const expandBtn = screen.getByRole('button', { name: /show/i });
      fireEvent.click(expandBtn);
      expect(setIsSmallExpanded).toHaveBeenCalledWith(true);
    });

    it('shows tasks when expanded', () => {
        render(
            <SmallGuiWidget
              alwaysOnTop={true}
              setAlwaysOnTop={vi.fn()}
              isSmallExpanded={true}
              setIsSmallExpanded={vi.fn()}
              showToast={vi.fn()}
              handleMinimizeToTray={vi.fn()}
              setGuiVariant={vi.fn()}
              currentProjectId="proj-1"
            />
          );
        
        expect(screen.getByText('Task One')).toBeTruthy();
        expect(screen.getByText('↳ Subtask One')).toBeTruthy();
    });
  });

  describe('TrayWidget', () => {
    it('renders and handles interactions', () => {
      const onRestore = vi.fn();
      const onStopAll = vi.fn();
      const showToast = vi.fn();

      render(
        <TrayWidget
          onRestore={onRestore}
          onStopAll={onStopAll}
          showToast={showToast}
        />
      );

      expect(screen.getByText('OxyFlow Engine')).toBeTruthy();
      expect(screen.getAllByText('Task One').length).toBeGreaterThan(0);

      const restoreBtn = document.getElementById('tray-restore-btn');
      fireEvent.click(restoreBtn!);
      expect(onRestore).toHaveBeenCalled();

      const pauseBtn = document.getElementById('tray-kill-all-btn');
      fireEvent.click(pauseBtn!);
      expect(onStopAll).toHaveBeenCalled();
    });
  });
});
