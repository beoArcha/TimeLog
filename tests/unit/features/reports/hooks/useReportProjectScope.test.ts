// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  resolveReportProjectScope,
  useReportProjectScope,
} from '@features/reports/hooks/useReportProjectScope';
import { aProject } from '@tests/shared/builders/entity-builders';

describe('resolveReportProjectScope', () => {
  const projects = [
    aProject({ id: 'p1' }),
    aProject({ id: 'p2', archived: true }),
    aProject({ id: 'p3' }),
  ];

  it('should keep archived project ids and drop deleted ones when resolving the scope', () => {
    // Arrange
    const requested = ['p1', 'p2', 'ghost', 'p3'];

    // Act
    const result = resolveReportProjectScope(requested, projects);

    // Assert
    expect(result).toEqual(['p1', 'p2', 'p3']);
  });
});

describe('useReportProjectScope', () => {
  const projects = [aProject({ id: 'p1' }), aProject({ id: 'p2' }), aProject({ id: 'p3' })];

  it('should start with an empty scope meaning all projects', () => {
    // Arrange & Act
    const { result } = renderHook(() => useReportProjectScope(projects));

    // Assert
    expect(result.current.reportProjectIds).toEqual([]);
  });

  it('should add and remove a project when it is toggled twice', () => {
    // Arrange
    const { result } = renderHook(() => useReportProjectScope(projects));

    // Act
    act(() => result.current.toggleReportProject('p1'));
    act(() => result.current.toggleReportProject('p3'));
    const afterAdd = result.current.reportProjectIds;
    act(() => result.current.toggleReportProject('p1'));

    // Assert
    expect(afterAdd).toEqual(['p1', 'p3']);
    expect(result.current.reportProjectIds).toEqual(['p3']);
  });

  it('should return to all projects when the scope is cleared', () => {
    // Arrange
    const { result } = renderHook(() => useReportProjectScope(projects));
    act(() => result.current.toggleReportProject('p1'));
    act(() => result.current.toggleReportProject('p2'));

    // Act
    act(() => result.current.clearReportProjects());

    // Assert
    expect(result.current.reportProjectIds).toEqual([]);
  });

  it('should keep an explicit selection of every project without collapsing it to all', () => {
    // Arrange
    const { result } = renderHook(() => useReportProjectScope(projects));

    // Act
    act(() => result.current.toggleReportProject('p1'));
    act(() => result.current.toggleReportProject('p2'));
    act(() => result.current.toggleReportProject('p3'));

    // Assert
    expect(result.current.reportProjectIds).toEqual(['p1', 'p2', 'p3']);
  });

  it('should drop a scoped project when it is deleted', () => {
    // Arrange
    const { result, rerender } = renderHook(({ list }) => useReportProjectScope(list), {
      initialProps: { list: projects },
    });
    act(() => result.current.toggleReportProject('p1'));
    act(() => result.current.toggleReportProject('p2'));

    // Act
    rerender({ list: [aProject({ id: 'p1' }), aProject({ id: 'p3' })] });

    // Assert
    expect(result.current.reportProjectIds).toEqual(['p1']);
  });

  it('should keep a scoped project when it gets archived', () => {
    // Arrange
    const { result, rerender } = renderHook(({ list }) => useReportProjectScope(list), {
      initialProps: { list: projects },
    });
    act(() => result.current.toggleReportProject('p1'));

    // Act
    rerender({ list: [aProject({ id: 'p1', archived: true }), aProject({ id: 'p3' })] });

    // Assert
    expect(result.current.reportProjectIds).toEqual(['p1']);
  });

  it('should add an archived project to the scope when it is toggled', () => {
    // Arrange
    const withArchived = [aProject({ id: 'p1' }), aProject({ id: 'p2', archived: true })];
    const { result } = renderHook(() => useReportProjectScope(withArchived));

    // Act
    act(() => result.current.toggleReportProject('p2'));

    // Assert
    expect(result.current.reportProjectIds).toEqual(['p2']);
  });
});
