// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ProjectDonutChart from '@features/reports/components/ProjectDonutChart';
import { ProjectChartItem } from '@features/reports/types';

describe('Unit Tests: ProjectDonutChart', () => {
  afterEach(() => {
    cleanup();
  });

  const mockProjectChart: ProjectChartItem[] = [
    {
      id: 'p1',
      name: 'Alpha Project',
      color: 'rose',
      seconds: 7200,
      tasks: [],
    },
    {
      id: 'p2',
      name: 'Beta Project',
      color: 'teal',
      seconds: 3600,
      tasks: [],
    },
  ];

  it('should render empty state when projectChart has no recorded seconds', () => {
    // Arrange & Act
    render(
      <ProjectDonutChart
        projectChart={[]}
      />
    );

    // Assert
    expect(screen.getByTestId('donut-chart-empty')).not.toBeNull();
  });

  it('should render donut chart container when items are provided', () => {
    // Arrange & Act
    render(
      <ProjectDonutChart
        projectChart={mockProjectChart}
      />
    );

    // Assert
    expect(screen.getByTestId('project-donut-chart')).not.toBeNull();
    expect(screen.queryByTestId('donut-chart-empty')).toBeNull();
  });

  it('should trigger onSelectProject with null when clear filter button is clicked', () => {
    // Arrange
    const onSelectProject = vi.fn();
    render(
      <ProjectDonutChart
        projectChart={mockProjectChart}
        selectedProjectId="p1"
        onSelectProject={onSelectProject}
      />
    );

    // Act
    const clearButton = screen.getByTestId('clear-project-filter');
    fireEvent.click(clearButton);

    // Assert
    expect(onSelectProject).toHaveBeenCalledWith(null);
  });

  it('should toggle content visibility when collapsible header is clicked', () => {
    // Arrange
    render(
      <ProjectDonutChart
        projectChart={[]}
      />
    );
    const header = screen.getByTestId('project-donut-chart-header');
    expect(screen.getByTestId('donut-chart-empty')).not.toBeNull();

    // Act
    fireEvent.click(header);

    // Assert
    expect(screen.queryByTestId('donut-chart-empty')).toBeNull();
  });
});
