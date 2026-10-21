import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNavigationController } from '@layouts/hooks/useNavigationController';

describe('useNavigationController', () => {
  it('should initialize with default tab when no controlled tab is provided', () => {
    // Arrange & Act
    const { result } = renderHook(() => useNavigationController());

    // Assert
    expect(result.current.activeTab).toBe('tasks');
    expect(result.current.activeView).toBe('tasks');
    expect(result.current.showDbInspector).toBe(false);
  });

  it('should switch tab when setActiveTab is called in uncontrolled mode', () => {
    // Arrange
    const { result } = renderHook(() => useNavigationController());

    // Act
    act(() => {
      result.current.setActiveTab('reports');
    });

    // Assert
    expect(result.current.activeTab).toBe('reports');
    expect(result.current.activeView).toBe('reports');
  });

  it('should delegate to controlled setter when activeLargeTab is controlled', () => {
    // Arrange
    const setActiveLargeTab = vi.fn();
    const { result } = renderHook(() =>
      useNavigationController({
        activeLargeTab: 'tasks',
        setActiveLargeTab,
      })
    );

    // Act
    act(() => {
      result.current.setActiveTab('cli');
    });

    // Assert
    expect(setActiveLargeTab).toHaveBeenCalledWith('cli');
  });

  it('should switch tab by index when layout variant is full', () => {
    // Arrange
    const { result } = renderHook(() =>
      useNavigationController({
        layoutVariant: 'full',
      })
    );

    // Act
    act(() => {
      result.current.switchTabByIndex(1);
    });

    // Assert
    expect(result.current.activeTab).toBe('reports');
  });

  it('should ignore index switch when index is out of bounds', () => {
    // Arrange
    const { result } = renderHook(() => useNavigationController());

    // Act
    act(() => {
      result.current.switchTabByIndex(999);
    });

    // Assert
    expect(result.current.activeTab).toBe('tasks');
  });

  it('should toggle showDbInspector when setShowDbInspector is called', () => {
    // Arrange
    const { result } = renderHook(() => useNavigationController());

    // Act
    act(() => {
      result.current.setShowDbInspector(true);
    });

    // Assert
    expect(result.current.showDbInspector).toBe(true);
  });
});
