// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ReportLogList from '@features/reports/components/ReportLogList';

describe('Unit Tests: ReportLogList', () => {
  const mockProps = {
    filteredLogs: [
      { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T13:00:00Z', note: 'Completed Task note' }
    ],
    projectChart: [
      { id: 'p1', name: 'Proj A', color: 'indigo', seconds: 3600, tasks: [] }
    ],
    maxSec: 3600,
    displayLogs: [
      { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T13:00:00Z', note: 'Completed Task note' }
    ],
    projects: [
      { id: 'p1', name: 'Proj A', color: 'indigo', createdAt: '2026-06-15' }
    ],
    tasks: [
      { id: 't1', projectId: 'p1', name: 'Task One', completed: false, createdAt: '2026-06-15' }
    ],
    nowIso: '2026-06-15T14:00:00Z',
    theme: 'dark',
    locale: 'en' as const,
    customTranslations: {},
    th: {}
  };

  it('should render log list items', () => {
    render(<ReportLogList {...mockProps} />);
    expect(screen.getByText(/Task One/i)).not.toBeNull();
  });
});
