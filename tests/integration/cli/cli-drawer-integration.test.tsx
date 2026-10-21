import React from 'react';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';
import { CliSessionProvider } from '@features/cli/context/CliSessionProvider';
import { useCliSession } from '@features/cli/context/CliSessionContext';
import { useGlobalShortcuts } from '@common/hooks/useGlobalShortcuts';
import { CliDrawer } from '@features/cli/CliDrawer';
import CliInterface from '@features/cli/CliInterface';
import { SandboxEmulatorStore } from '@features/cli/sandbox/sandboxEmulatorStore';
import { SettingsContext, SettingsState } from '@common/hooks/SettingsContext';

describe('Given CliSessionContext with live business data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SandboxEmulatorStore.resetInstanceForTesting();
  });

  afterEach(() => {
    cleanup();
  });

  describe('When a command is executed in CliSession', () => {
    it('Then it should update timer tracking and reflect across both CliDrawer and CliInterface', async () => {
      // Given
      const startTimerMock = vi.fn();
      const testProject = aProject({ id: 'p1', name: 'Alpha Project' });
      const testTask = aTask({ id: 't101', projectId: 'p1', name: 'Develop Feature' });

      const { container } = render(
        <MockProviders
          dataState={{
            projects: [testProject],
            tasks: [testTask],
            handleStartTimer: startTimerMock,
            selectedTaskId: 't101',
          }}
        >
          <CliSessionProvider initialDrawerOpen={true}>
            <CliDrawer />
            <CliInterface />
          </CliSessionProvider>
        </MockProviders>
      );

      const drawerInput = container.querySelector('#cli-drawer-container #cli-input-field') as HTMLInputElement;
      const drawerSubmit = container.querySelector('#cli-drawer-container #cli-submit-btn');
      expect(drawerInput).not.toBeNull();
      expect(drawerSubmit).not.toBeNull();

      // When
      fireEvent.change(drawerInput, { target: { value: 'start t101' } });
      fireEvent.click(drawerSubmit!);

      // Then
      await waitFor(() => {
        expect(startTimerMock).toHaveBeenCalledWith('t101');
        const interfaceTerminal = container.querySelector('#cli-interface #terminal-history');
        expect(interfaceTerminal?.textContent).toContain('start t101');
      });
    });
  });
});

describe('Given Sandbox Emulator mode activated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SandboxEmulatorStore.resetInstanceForTesting();
  });

  afterEach(() => {
    cleanup();
  });

  describe('When a new project is created via CLI in sandbox mode', () => {
    it('Then it should isolate data in memory and keep persistent DataContext untouched', async () => {
      // Given
      const liveProject = aProject({ id: 'live_1', name: 'Production Database Project' });
      const addProjectMock = vi.fn();

      const { container } = render(
        <MockProviders
          dataState={{
            projects: [liveProject],
            handleAddProject: addProjectMock,
          }}
        >
          <CliSessionProvider initialDrawerOpen={true} initialSandbox={true}>
            <CliDrawer />
          </CliSessionProvider>
        </MockProviders>
      );

      const input = container.querySelector('#cli-drawer-container #cli-input-field') as HTMLInputElement;
      const submit = container.querySelector('#cli-drawer-container #cli-submit-btn');

      // When
      fireEvent.change(input, { target: { value: 'addproject "Isolated Sandbox Proj"' } });
      fireEvent.click(submit!);

      // Then
      await waitFor(() => {
        const sandboxProjects = SandboxEmulatorStore.getInstance().getProjects();
        expect(sandboxProjects.some(p => p.name === 'Isolated Sandbox Proj')).toBe(true);
      });

      expect(addProjectMock).not.toHaveBeenCalled();
    });
  });
});

describe('Given CliDrawer open in windowed mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SandboxEmulatorStore.resetInstanceForTesting();
  });

  afterEach(() => {
    cleanup();
  });

  describe('When Escape key is pressed', () => {
    it('Then it should dismiss the drawer and remove the dialog from the DOM', async () => {
      // Given
      const onCloseMock = vi.fn();

      const { container } = render(
        <MockProviders>
          <CliSessionProvider initialDrawerOpen={true}>
            <CliDrawer onClose={onCloseMock} />
          </CliSessionProvider>
        </MockProviders>
      );

      expect(container.querySelector('#cli-drawer-container')).not.toBeNull();

      // When
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      // Then
      await waitFor(() => {
        expect(onCloseMock).toHaveBeenCalled();
      });
    });
  });
});

describe('Given application running in CompactLayout mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SandboxEmulatorStore.resetInstanceForTesting();
  });

  afterEach(() => {
    cleanup();
  });

  describe('When CliDrawer is toggled open via global shortcut', () => {
    it('Then it should automatically expand the layout to MediumLayout and open the drawer', async () => {
      // Given
      const setLayoutVariantMock = vi.fn();
      const mockSettings = {
        layoutVariant: 'compact',
        setLayoutVariant: setLayoutVariantMock,
      } as unknown as SettingsState;

      const TestHarness = () => {
        const { toggleDrawer } = useCliSession();
        useGlobalShortcuts({
          onToggleTimer: vi.fn(),
          onToggleCliDrawer: toggleDrawer,
        });
        return <CliDrawer />;
      };

      const { container } = render(
        <MockProviders>
          <SettingsContext.Provider value={mockSettings}>
            <CliSessionProvider initialDrawerOpen={false}>
              <TestHarness />
            </CliSessionProvider>
          </SettingsContext.Provider>
        </MockProviders>
      );

      expect(container.querySelector('#cli-drawer-container')).toBeNull();

      // When
      fireEvent.keyDown(window, {
        key: '`',
        code: 'Backquote',
        ctrlKey: true,
      });

      // Then
      await waitFor(() => {
        expect(setLayoutVariantMock).toHaveBeenCalledWith('medium');
      });
    });
  });
});

describe('Given an active timer running on a task', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SandboxEmulatorStore.resetInstanceForTesting();
  });

  afterEach(() => {
    cleanup();
  });

  describe('When atomic switch command is executed for another task', () => {
    it('Then it should stop the previous timer and start tracking the new task', async () => {
      // Given
      const stopTimerMock = vi.fn();
      const startTimerMock = vi.fn();
      const proj = aProject({ id: 'p1', name: 'Project Alpha' });
      const task1 = aTask({ id: 't1', projectId: 'p1', name: 'First Task' });
      const task2 = aTask({ id: 't2', projectId: 'p1', name: 'Second Task' });

      const { container } = render(
        <MockProviders
          dataState={{
            projects: [proj],
            tasks: [task1, task2],
            handleStopTimer: stopTimerMock,
            handleStartTimer: startTimerMock,
          }}
        >
          <CliSessionProvider initialDrawerOpen={true}>
            <CliDrawer />
          </CliSessionProvider>
        </MockProviders>
      );

      const input = container.querySelector('#cli-drawer-container #cli-input-field') as HTMLInputElement;
      const submit = container.querySelector('#cli-drawer-container #cli-submit-btn');

      // When
      fireEvent.change(input, { target: { value: 'switch t2' } });
      fireEvent.click(submit!);

      // Then
      await waitFor(() => {
        expect(stopTimerMock).toHaveBeenCalled();
        expect(startTimerMock).toHaveBeenCalledWith('t2');
      });
    });
  });
});
