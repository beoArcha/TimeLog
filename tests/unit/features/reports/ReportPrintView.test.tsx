// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportView from '@features/reports/ReportView';
import { GuiState } from '@layouts/hooks/useGuiLogic';
import { PlatformCapabilitiesContext, PlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';

describe('Unit Tests: ReportPrintView and Capabilities Badge', () => {
  const mockGuiState: GuiState = {
    projects: [
      { id: 'p1', name: 'Proj Alpha', color: 'indigo', createdAt: '2026-06-15T00:00:00Z', archived: false, description: null, icon: null, tags: null }
    ],
    tasks: [
      { id: 't1', projectId: 'p1', name: 'Task Alpha', completed: false, createdAt: '2026-06-15T00:00:00Z', status: null, parentTaskId: null }
    ],
    logs: [
      { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T13:00:00Z', note: 'Sprint retrospective', editHistory: null }
    ],
    nowIso: '2026-06-15T14:00:00Z',
    locale: 'en',
    customTranslations: {},
    theme: 'dark',
    activeLog: null,
    holidays: [],
    setHolidays: vi.fn(),
    sysSettings: { autoStart: false, includePatchesInReports: false, activeSinks: [] },
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
    showDbInspector: false,
    setShowDbInspector: vi.fn(),
    activeLargeTab: 'reports',
    activeView: 'reports',
    patches: [],
    reportPeriod: 'all',
    setReportPeriod: vi.fn(),
    reportSort: 'duration',
    setReportSort: vi.fn()
  } as unknown as GuiState;

  const createCapabilities = (overrides: Partial<PlatformCapabilities> = {}): PlatformCapabilities => ({
    dragRegionProps: {},
    canInspectDatabase: false,
    supportedLayouts: ['compact', 'medium', 'full'],
    defaultLayout: 'full',
    supportsTray: false,
    supportsAlwaysOnTop: false,
    supportsAutoStart: false,
    isPwaInstallable: false,
    hasNativeDaemon: false,
    canUseCli: false,
    storageEngineName: 'localStorage',
    isDesktop: false,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render print button in ViewHeader with printer icon and proper testid', () => {
    // Arrange & Act
    render(
      <PlatformCapabilitiesContext.Provider value={createCapabilities({ isDesktop: true })}>
        <ReportView state={mockGuiState} />
      </PlatformCapabilitiesContext.Provider>
    );

    // Assert
    const printBtn = screen.getByTestId('report-print-button');
    expect(printBtn).toBeDefined();
    expect(printBtn.textContent).toContain('Print / PDF');
  });

  it('should invoke window.print when print button is clicked', () => {
    // Arrange
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(
      <PlatformCapabilitiesContext.Provider value={createCapabilities({ isDesktop: true })}>
        <ReportView state={mockGuiState} />
      </PlatformCapabilitiesContext.Provider>
    );

    // Act
    const printBtn = screen.getByTestId('report-print-button');
    fireEvent.click(printBtn);

    // Assert
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  it('should render SqlAnalyticsEngine badge when isDesktop is true', () => {
    // Arrange & Act
    render(
      <PlatformCapabilitiesContext.Provider value={createCapabilities({ isDesktop: true, storageEngineName: 'sqlite' })}>
        <ReportView state={mockGuiState} />
      </PlatformCapabilitiesContext.Provider>
    );

    // Assert: in English, SqlAnalyticsEngine translates to "SQL Analytics engine"
    expect(screen.getByText('SQL Analytics engine')).toBeDefined();
    expect(screen.queryByText('Analytics engine')).toBeNull();
  });

  it('should render AnalyticsEngine badge without SQL when isDesktop is false in browser/PWA', () => {
    // Arrange & Act
    render(
      <PlatformCapabilitiesContext.Provider value={createCapabilities({ isDesktop: false, storageEngineName: 'localStorage' })}>
        <ReportView state={mockGuiState} />
      </PlatformCapabilitiesContext.Provider>
    );

    // Assert: in English, AnalyticsEngine translates to "Analytics engine"
    expect(screen.getByText('Analytics engine')).toBeDefined();
    expect(screen.queryByText('SQL Analytics engine')).toBeNull();
  });

  it('should attach print:hidden and no-print classes to period selector for clean PDF output', () => {
    // Arrange & Act
    render(
      <PlatformCapabilitiesContext.Provider value={createCapabilities({ isDesktop: true })}>
        <ReportView state={mockGuiState} />
      </PlatformCapabilitiesContext.Provider>
    );

    // Assert
    const periodSelector = screen.getByTestId('report-period-selector');
    expect(periodSelector.className).toContain('no-print');
    expect(periodSelector.className).toContain('print:hidden');
  });

  it('should attach print:hidden and no-print classes to header action buttons', () => {
    // Arrange & Act
    render(
      <PlatformCapabilitiesContext.Provider value={createCapabilities({ isDesktop: true })}>
        <ReportView state={mockGuiState} />
      </PlatformCapabilitiesContext.Provider>
    );

    // Assert
    const printBtn = screen.getByTestId('report-print-button');
    const actionsContainer = printBtn.parentElement;
    expect(actionsContainer).not.toBeNull();
    expect(actionsContainer?.className).toContain('no-print');
    expect(actionsContainer?.className).toContain('print:hidden');
  });

  it('should render print-only period header in ReportView with correct preset label', () => {
    // Arrange & Act
    render(
      <PlatformCapabilitiesContext.Provider value={createCapabilities({ isDesktop: true })}>
        <ReportView state={{ ...mockGuiState, reportPeriod: 'today' }} />
      </PlatformCapabilitiesContext.Provider>
    );

    // Assert
    const periodHeader = screen.getByTestId('report-print-period-header');
    expect(periodHeader).not.toBeNull();
    expect(periodHeader.className).toContain('hidden');
    expect(periodHeader.className).toContain('print:flex');
    expect(periodHeader.textContent).toContain('Today');
  });

  it('should render custom date range in print-only period header when period is custom', () => {
    // Arrange & Act
    render(
      <PlatformCapabilitiesContext.Provider value={createCapabilities({ isDesktop: true })}>
        <ReportView
          state={{
            ...mockGuiState,
            reportPeriod: 'custom',
            customFrom: '2026-06-01',
            customTo: '2026-06-15',
          }}
        />
      </PlatformCapabilitiesContext.Provider>
    );

    // Assert
    const periodHeader = screen.getByTestId('report-print-period-header');
    expect(periodHeader).not.toBeNull();
    expect(periodHeader.textContent).toContain('06/01/2026 — 06/15/2026');
  });
});

