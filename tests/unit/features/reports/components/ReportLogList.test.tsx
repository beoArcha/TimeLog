// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import ReportLogList from '@features/reports/components/ReportLogList';

describe('Unit Tests: ReportLogList', () => {
  afterEach(() => {
    cleanup();
  });
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

  it('should apply print:max-h-none and print:overflow-visible to prevent print clipping', () => {
    render(<ReportLogList {...mockProps} />);
    const scrollContainer = screen.getByTestId('report-log-list-scroll-container');
    expect(scrollContainer).not.toBeNull();
    // Normal screen constraints
    expect(scrollContainer.className).toContain('max-h-[250px]');
    expect(scrollContainer.className).toContain('overflow-y-auto');
    // Print unclip constraints
    expect(scrollContainer.className).toContain('print:max-h-none');
    expect(scrollContainer.className).toContain('print:overflow-visible');
  });

  it('should render all entries in DOM when log list exceeds container height (multi-entry report)', () => {
    const largeLogsCount = 40;
    const tasks = Array.from({ length: largeLogsCount }, (_, idx) => ({
      id: `task-${idx}`,
      projectId: 'p1',
      name: `Dedicated Task ${idx}`,
      completed: false,
      createdAt: '2026-06-15',
    }));

    const largeLogs = Array.from({ length: largeLogsCount }, (_, idx) => ({
      id: `log-${idx}`,
      taskId: `task-${idx}`,
      projectId: 'p1',
      startTime: `2026-06-15T${String(8 + Math.floor(idx / 4)).padStart(2, '0')}:${String((idx % 4) * 15).padStart(2, '0')}:00Z`,
      endTime: `2026-06-15T${String(8 + Math.floor(idx / 4)).padStart(2, '0')}:${String((idx % 4) * 15 + 10).padStart(2, '0')}:00Z`,
      note: `Log entry item ${idx}`,
    }));

    render(
      <ReportLogList
        {...mockProps}
        tasks={tasks}
        displayLogs={largeLogs}
        filteredLogs={largeLogs}
      />
    );

    const scrollContainer = screen.getByTestId('report-log-list-scroll-container');
    expect(scrollContainer).not.toBeNull();
    expect(scrollContainer.children.length).toBe(largeLogsCount);

    // Ensure all 40 elements are rendered in DOM without truncation
    for (let i = 0; i < largeLogsCount; i++) {
      expect(screen.getByText(`"Dedicated Task ${i}"`)).not.toBeNull();
    }
    // Verify print unclip classes are present for entire set
    expect(scrollContainer.className).toContain('print:max-h-none');
    expect(scrollContainer.className).toContain('print:overflow-visible');
  });
});

