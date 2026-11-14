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

  it('should trigger onClearProjects when clear filter button is clicked', () => {
    // Arrange
    const onClearProjects = vi.fn();
    render(
      <ProjectDonutChart
        projectChart={mockProjectChart}
        selectedProjectIds={['p1']}
        onClearProjects={onClearProjects}
      />
    );

    // Act
    const clearButton = screen.getByTestId('clear-project-filter');
    fireEvent.click(clearButton);

    // Assert
    expect(onClearProjects).toHaveBeenCalledTimes(1);
  });

  it('should render the project name badge and the clear control when exactly one project is selected', () => {
    // Arrange & Act
    render(
      <ProjectDonutChart
        projectChart={mockProjectChart}
        selectedProjectIds={['p1']}
        onClearProjects={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByTestId('project-donut-selected-name').textContent).toBe('Alpha Project');
    expect(screen.getByTestId('clear-project-filter')).not.toBeNull();
  });

  it('should render only the clear control when several projects are selected', () => {
    // Arrange & Act
    render(
      <ProjectDonutChart
        projectChart={mockProjectChart}
        selectedProjectIds={['p1', 'p2']}
        onClearProjects={vi.fn()}
      />
    );

    // Assert
    expect(screen.queryByTestId('project-donut-selected-name')).toBeNull();
    expect(screen.getByTestId('clear-project-filter')).not.toBeNull();
  });

  it('should render only the clear control when the single selected project has no data in the period', () => {
    // Arrange & Act
    render(
      <ProjectDonutChart
        projectChart={mockProjectChart}
        selectedProjectIds={['p-without-data']}
        onClearProjects={vi.fn()}
      />
    );

    // Assert
    expect(screen.queryByTestId('project-donut-selected-name')).toBeNull();
    expect(screen.getByTestId('clear-project-filter')).not.toBeNull();
  });

  it('should render neither the name badge nor the clear control when no project is selected', () => {
    // Arrange & Act
    render(<ProjectDonutChart projectChart={mockProjectChart} selectedProjectIds={[]} />);

    // Assert
    expect(screen.queryByTestId('project-donut-selected-name')).toBeNull();
    expect(screen.queryByTestId('clear-project-filter')).toBeNull();
  });

  it('should toggle content visibility when collapsible header is clicked', () => {
    // Arrange
    render(
      <ProjectDonutChart
        projectChart={[]}
      />
    );
    const header = screen.getByTestId('project-donut-chart-header');
    expect(header.getAttribute('aria-expanded')).toBe('true');

    // Act
    fireEvent.click(header);

    // Assert
    expect(header.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByTestId('donut-chart-empty').closest('[hidden]')).not.toBeNull();
  });
});
