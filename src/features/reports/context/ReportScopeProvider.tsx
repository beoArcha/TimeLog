import React, { useContext, useMemo, useCallback } from 'react';
import { Project } from '@bindings/Project';
import { DataContext } from '@common/hooks/DataContext';
import { useReportProjectScope } from '../hooks/useReportProjectScope';
import { ReportScopeContext, ReportScopeContextValue } from './ReportScopeContext';

export interface ReportScopeProviderProps {
  children: React.ReactNode;
  projects?: readonly Project[];
  initialProjectIds?: readonly string[];
}

export function ReportScopeProvider({
  children,
  projects: propProjects,
  initialProjectIds = [],
}: ReportScopeProviderProps) {
  const dataContext = useContext(DataContext);
  const resolvedProjects = propProjects ?? dataContext?.projects ?? [];

  const scope = useReportProjectScope(resolvedProjects, initialProjectIds);

  const isProjectSelected = useCallback(
    (projectId: string) => scope.reportProjectIds.includes(projectId),
    [scope.reportProjectIds]
  );

  const isAllSelected = scope.reportProjectIds.length === 0;

  const value = useMemo<ReportScopeContextValue>(
    () => ({
      reportProjectIds: scope.reportProjectIds,
      toggleReportProject: scope.toggleReportProject,
      clearReportProjects: scope.clearReportProjects,
      isProjectSelected,
      isAllSelected,
    }),
    [scope.reportProjectIds, scope.toggleReportProject, scope.clearReportProjects, isProjectSelected, isAllSelected]
  );

  return (
    <ReportScopeContext.Provider value={value}>
      {children}
    </ReportScopeContext.Provider>
  );
}
