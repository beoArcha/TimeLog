import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGuiLogic } from '@layouts/hooks/useGuiLogic';
import { LayoutCommonProps } from '@layouts/types/LayoutCommonProps';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';

describe('useGuiLogic', () => {
  const p1 = aProject({ id: 'p1', name: 'Alpha' });
  const p2 = aProject({ id: 'p2', name: 'Beta' });
  const t1 = aTask({ id: 't1', projectId: 'p1', name: 'Task Alpha 1' });
  const t2 = aTask({ id: 't2', projectId: 'p2', name: 'Task Beta 1' });

  const mockProps: LayoutCommonProps = {
    projects: [p1, p2],
    tasks: [t1, t2],
    logs: [],
    activeLog: null,
    holidays: [],
    onAddProject: vi.fn(),
    onAddTask: vi.fn(),
    onToggleTaskComplete: vi.fn(),
    onStartTimer: vi.fn(),
    onStopTimer: vi.fn(),
    setHolidays: vi.fn(),
    locale: 'en',
    selectedTaskId: null,
    setSelectedTaskId: vi.fn(),
  };

  it('should initialize with first project and filtered tasks', () => {
    // Arrange & Act
    const { result } = renderHook(() => useGuiLogic(mockProps));

    // Assert
    expect(result.current.selectedProjectId).toBe('p1');
    expect(result.current.selectedProject?.name).toBe('Alpha');
    expect(result.current.projectTasks).toHaveLength(1);
    expect(result.current.projectTasks[0].id).toBe('t1');
    expect(result.current.rootTasks).toHaveLength(1);
    expect(result.current.showDbInspector).toBe(false);
  });

  it('should update filtered tasks when selectedProjectId changes', () => {
    // Arrange
    const { result } = renderHook(() => useGuiLogic(mockProps));

    // Act
    act(() => {
      result.current.setSelectedProjectId('p2');
    });

    // Assert
    expect(result.current.selectedProjectId).toBe('p2');
    expect(result.current.selectedProject?.name).toBe('Beta');
    expect(result.current.projectTasks).toHaveLength(1);
    expect(result.current.projectTasks[0].id).toBe('t2');
  });

  it('should update report filter options and custom date ranges', () => {
    // Arrange
    const { result } = renderHook(() => useGuiLogic(mockProps));

    // Act
    act(() => {
      result.current.setReportPeriod('month');
      result.current.setReportSort('date');
      result.current.setCustomFrom('2026-01-01');
      result.current.setCustomTo('2026-01-31');
    });

    // Assert
    expect(result.current.reportPeriod).toBe('month');
    expect(result.current.reportSort).toBe('date');
    expect(result.current.customFrom).toBe('2026-01-01');
    expect(result.current.customTo).toBe('2026-01-31');
  });

  it('should toggle showDbInspector', () => {
    // Arrange
    const { result } = renderHook(() => useGuiLogic(mockProps));

    // Act
    act(() => {
      result.current.setShowDbInspector(true);
    });

    // Assert
    expect(result.current.showDbInspector).toBe(true);
  });
});
