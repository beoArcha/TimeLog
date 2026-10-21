import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCliSession, useCliSessionSafe } from '@features/cli/context/CliSessionContext';
import { CliSessionProvider } from '@features/cli/context/CliSessionProvider';
import { SandboxEmulatorStore } from '@features/cli/sandbox/sandboxEmulatorStore';
import { SettingsContext, SettingsState } from '@common/hooks/SettingsContext';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';

describe('Unit Tests: CliSessionContext (Strict AAA)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SandboxEmulatorStore.resetInstanceForTesting();
  });

  it('should return null when useCliSessionSafe is called outside provider', () => {
    // Arrange & Act
    const { result } = renderHook(() => useCliSessionSafe());

    // Assert
    expect(result.current).toBeNull();
  });

  it('should throw error when useCliSession is called outside provider', () => {
    // Arrange & Act & Assert
    expect(() => {
      renderHook(() => useCliSession());
    }).toThrow('useCliSession must be used within a CliSessionProvider');
  });

  it('should provide default initial history and active session state', () => {
    // Arrange
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockProviders>
        <CliSessionProvider>{children}</CliSessionProvider>
      </MockProviders>
    );

    // Act
    const { result } = renderHook(() => useCliSession(), { wrapper });

    // Assert
    expect(result.current.terminalHistory.length).toBeGreaterThan(0);
    expect(result.current.isDrawerOpen).toBe(false);
    expect(result.current.commandHistory).toEqual([]);
    expect(result.current.isSandbox).toBe(false);
  });

  it('should toggle drawer state and automatically expand compact layout to medium', () => {
    // Arrange
    const setLayoutVariantMock = vi.fn();
    const mockSettings = {
      layoutVariant: 'compact',
      setLayoutVariant: setLayoutVariantMock,
    } as unknown as SettingsState;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockProviders>
        <SettingsContext.Provider value={mockSettings}>
          <CliSessionProvider>{children}</CliSessionProvider>
        </SettingsContext.Provider>
      </MockProviders>
    );
    const { result } = renderHook(() => useCliSession(), { wrapper });

    // Act
    act(() => {
      result.current.toggleDrawer();
    });

    // Assert
    expect(result.current.isDrawerOpen).toBe(true);
    expect(setLayoutVariantMock).toHaveBeenCalledWith('medium');
  });

  it('should allow setting drawer open explicitly', () => {
    // Arrange
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockProviders>
        <CliSessionProvider initialDrawerOpen={false}>{children}</CliSessionProvider>
      </MockProviders>
    );
    const { result } = renderHook(() => useCliSession(), { wrapper });

    // Act
    act(() => {
      result.current.setDrawerOpen(true);
    });

    // Assert
    expect(result.current.isDrawerOpen).toBe(true);
  });

  it('should execute command and append lines to history and commandHistory', async () => {
    // Arrange
    const project = aProject({ id: 'p1', name: 'Alpha Project' });
    const task = aTask({ id: 't1', projectId: 'p1', name: 'Alpha Task' });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockProviders dataState={{ projects: [project], tasks: [task] }}>
        <CliSessionProvider>{children}</CliSessionProvider>
      </MockProviders>
    );
    const { result } = renderHook(() => useCliSession(), { wrapper });

    // Act
    await act(async () => {
      await result.current.executeCommand('help');
    });

    // Assert
    expect(result.current.commandHistory).toContain('help');
    expect(result.current.terminalHistory.some(line => line.text.includes('help'))).toBe(true);
  });

  it('should clear terminal history when clear command is executed', async () => {
    // Arrange
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockProviders>
        <CliSessionProvider>{children}</CliSessionProvider>
      </MockProviders>
    );
    const { result } = renderHook(() => useCliSession(), { wrapper });

    // Act
    await act(async () => {
      await result.current.executeCommand('clear');
    });

    // Assert
    expect(result.current.terminalHistory).toEqual([]);
  });

  it('should navigate command history up and down', async () => {
    // Arrange
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockProviders>
        <CliSessionProvider>{children}</CliSessionProvider>
      </MockProviders>
    );
    const { result } = renderHook(() => useCliSession(), { wrapper });

    await act(async () => {
      await result.current.executeCommand('status');
      await result.current.executeCommand('projects');
    });

    // Act
    let cmdUp1 = '';
    let cmdUp2 = '';
    let cmdDown = '';
    act(() => {
      cmdUp1 = result.current.navigateHistory('up', 'current draft');
      cmdUp2 = result.current.navigateHistory('up', cmdUp1);
      cmdDown = result.current.navigateHistory('down', cmdUp2);
    });

    // Assert
    expect(cmdUp1).toBe('projects');
    expect(cmdUp2).toBe('status');
    expect(cmdDown).toBe('projects');
  });

  it('should toggle sandbox mode and update emulator store', () => {
    // Arrange
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockProviders>
        <CliSessionProvider>{children}</CliSessionProvider>
      </MockProviders>
    );
    const { result } = renderHook(() => useCliSession(), { wrapper });

    // Act
    act(() => {
      result.current.setSandboxMode(true);
    });

    // Assert
    expect(result.current.isSandbox).toBe(true);
    expect(SandboxEmulatorStore.getInstance().isActive()).toBe(true);
  });
});
