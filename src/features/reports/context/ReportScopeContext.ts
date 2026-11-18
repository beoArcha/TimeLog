import { createContext, useContext } from 'react';
import { ContextException } from '@common/exceptions';

export interface ReportScopeContextValue {
  reportProjectIds: readonly string[];
  toggleReportProject: (projectId: string) => void;
  clearReportProjects: () => void;
  isProjectSelected: (projectId: string) => boolean;
  isAllSelected: boolean;
}

export const ReportScopeContext = createContext<ReportScopeContextValue | null>(null);

export function useReportScope(): ReportScopeContextValue {
  const context = useContext(ReportScopeContext);
  if (!context) {
    throw new ContextException('useReportScope must be used within a ReportScopeProvider', 'ERR_REPORT_SCOPE_CONTEXT');
  }
  return context;
}

export function useReportScopeSafe(): ReportScopeContextValue | null {
  return useContext(ReportScopeContext);
}



