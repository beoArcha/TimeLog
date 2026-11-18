// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  ReportScopeProvider,
  useReportScope,
  useReportScopeSafe,
} from '@features/reports/context';
import { DataContext, DataState } from '@common/hooks/DataContext';
import { aProject } from '@tests/shared/builders/entity-builders';

describe('ReportScopeContext and Provider', () => {
  const projects = [
    aProject({ id: 'p1', name: 'Alpha' }),
    aProject({ id: 'p2', name: 'Beta' }),
    aProject({ id: 'p3', name: 'Gamma' }),
  ];

  it('should initialize with all projects selected when no initial scope is provided', () => {
    // Arrange & Act
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ReportScopeProvider projects={projects}>{children}</ReportScopeProvider>
    );
    const { result } = renderHook(() => useReportScope(), { wrapper });

    // Assert
    expect(result.current.reportProjectIds).toEqual([]);
    expect(result.current.isAllSelected).toBe(true);
    expect(result.current.isProjectSelected('p1')).toBe(false);
  });

  it('should toggle a project into the scope and update isProjectSelected and isAllSelected', () => {
    // Arrange
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ReportScopeProvider projects={projects}>{children}</ReportScopeProvider>
    );
    const { result } = renderHook(() => useReportScope(), { wrapper });

    // Act
    act(() => {
      result.current.toggleReportProject('p1');
    });

    // Assert
    expect(result.current.reportProjectIds).toEqual(['p1']);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.isProjectSelected('p1')).toBe(true);
    expect(result.current.isProjectSelected('p2')).toBe(false);
  });

  it('should allow multi-selecting several projects and remove a project on second toggle', () => {
    // Arrange
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ReportScopeProvider projects={projects}>{children}</ReportScopeProvider>
    );
    const { result } = renderHook(() => useReportScope(), { wrapper });

    // Act
    act(() => {
      result.current.toggleReportProject('p1');
      result.current.toggleReportProject('p2');
    });

    // Assert
    expect(result.current.reportProjectIds).toEqual(['p1', 'p2']);
    expect(result.current.isProjectSelected('p1')).toBe(true);
    expect(result.current.isProjectSelected('p2')).toBe(true);

    // Act
    act(() => {
      result.current.toggleReportProject('p1');
    });

    // Assert
    expect(result.current.reportProjectIds).toEqual(['p2']);
    expect(result.current.isProjectSelected('p1')).toBe(false);
    expect(result.current.isProjectSelected('p2')).toBe(true);
  });

  it('should reset to all projects when clearReportProjects is called', () => {
    // Arrange
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ReportScopeProvider projects={projects}>{children}</ReportScopeProvider>
    );
    const { result } = renderHook(() => useReportScope(), { wrapper });
    act(() => {
      result.current.toggleReportProject('p1');
      result.current.toggleReportProject('p2');
    });
    expect(result.current.isAllSelected).toBe(false);

    // Act
    act(() => {
      result.current.clearReportProjects();
    });

    // Assert
    expect(result.current.reportProjectIds).toEqual([]);
    expect(result.current.isAllSelected).toBe(true);
  });

  it('should resolve projects from DataContext when prop projects is not provided', () => {
    // Arrange
    const mockDataState = {
      projects,
    } as unknown as DataState;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DataContext.Provider value={mockDataState}>
        <ReportScopeProvider>{children}</ReportScopeProvider>
      </DataContext.Provider>
    );

    // Act
    const { result } = renderHook(() => useReportScope(), { wrapper });
    act(() => {
      result.current.toggleReportProject('p2');
    });

    // Assert
    expect(result.current.reportProjectIds).toEqual(['p2']);
    expect(result.current.isProjectSelected('p2')).toBe(true);
  });

  it('should throw ContextException when useReportScope is called outside provider', () => {
    // Arrange & Act & Assert
    expect(() => renderHook(() => useReportScope())).toThrowError(
      /useReportScope must be used within a ReportScopeProvider/
    );
  });

  it('should return null when useReportScopeSafe is called outside provider', () => {
    // Arrange & Act
    const { result } = renderHook(() => useReportScopeSafe());

    // Assert
    expect(result.current).toBeNull();
  });
});
