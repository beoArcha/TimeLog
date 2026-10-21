// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import StackedBarActivityChart from '@features/reports/components/StackedBarActivityChart';
import { aProject, aClampedTimeLog } from '@tests/shared/builders/entity-builders';

describe('Unit Tests: StackedBarActivityChart', () => {
  afterEach(() => {
    cleanup();
  });

  const mockProjects = [
    aProject({ id: 'p1', name: 'Alpha Project', color: 'rose' }),
    aProject({ id: 'p2', name: 'Beta Project', color: 'teal' }),
  ];

  it('should render empty state when clampedLogs is empty', () => {
    // Arrange & Act
    render(
      <StackedBarActivityChart
        clampedLogs={[]}
        projects={mockProjects}
      />
    );

    // Assert
    expect(screen.getByTestId('stacked-chart-empty')).not.toBeNull();
  });

  it('should render stacked bar activity chart when logs are provided', () => {
    // Arrange
    const logs = [
      aClampedTimeLog({
        id: 'cl1',
        projectId: 'p1',
        clampedStartTime: '2026-06-15T10:00:00.000Z',
        clampedDurationSeconds: 3600,
      }),
      aClampedTimeLog({
        id: 'cl2',
        projectId: 'p2',
        clampedStartTime: '2026-06-15T11:00:00.000Z',
        clampedDurationSeconds: 7200,
      }),
    ];

    // Act
    render(
      <StackedBarActivityChart
        clampedLogs={logs}
        projects={mockProjects}
      />
    );

    // Assert
    expect(screen.getByTestId('stacked-bar-activity-chart')).not.toBeNull();
    expect(screen.queryByTestId('stacked-chart-empty')).toBeNull();
  });

  it('should toggle content visibility when collapsible header is clicked', () => {
    // Arrange
    render(
      <StackedBarActivityChart
        clampedLogs={[]}
        projects={mockProjects}
      />
    );
    const header = screen.getByTestId('stacked-activity-chart-header');
    expect(screen.getByTestId('stacked-chart-empty')).not.toBeNull();

    // Act
    fireEvent.click(header);

    // Assert
    expect(screen.queryByTestId('stacked-chart-empty')).toBeNull();
  });
});
