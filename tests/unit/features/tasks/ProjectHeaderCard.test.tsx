// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ProjectHeaderCard from '@features/tasks/components/ProjectHeaderCard';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { aProject } from '@tests/shared/builders/entity-builders';

describe('Unit Tests: ProjectHeaderCard', () => {
  const selectedProject = aProject({
    id: 'proj_1',
    name: 'Project Alpha',
    color: 'rose',
    createdAt: '2026-06-12T00:00:00Z',
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should display project name and formatted duration when rendered with project details', () => {
    // Arrange & Act
    render(
      <ProjectHeaderCard
        selectedProject={selectedProject}
        projectDurationSeconds={3600}
        isCondensed={false}
        stats={null}
        loading={false}
        newTaskName="New Task"
        setNewTaskName={vi.fn()}
        onAddTaskSubmit={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByText('Project Alpha')).toBeTruthy();
    expect(screen.getByText('01:00:00')).toBeTruthy();
  });

  it('should call setNewTaskName when task name input text changes', () => {
    // Arrange
    const setNewTaskNameSpy = vi.fn();
    const { container } = render(
      <ProjectHeaderCard
        selectedProject={selectedProject}
        projectDurationSeconds={0}
        isCondensed={false}
        stats={null}
        loading={false}
        newTaskName=""
        setNewTaskName={setNewTaskNameSpy}
        onAddTaskSubmit={vi.fn()}
      />
    );

    // Act
    const input = (container.querySelector('#new-task-input') ?? screen.getByRole('textbox')) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Buy Groceries' } });

    // Assert
    expect(setNewTaskNameSpy).toHaveBeenCalledWith('Buy Groceries');
  });

  it('should render condensed total badge when isCondensed is true', () => {
    // Arrange
    const projectBeta = aProject({
      id: 'proj_2',
      name: 'Project Beta',
      color: undefined as unknown as string,
    });

    // Act
    render(
      <ProjectHeaderCard
        selectedProject={projectBeta}
        projectDurationSeconds={1800}
        isCondensed={true}
        stats={null}
        loading={false}
        newTaskName=""
        setNewTaskName={vi.fn()}
        onAddTaskSubmit={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByText('Project Beta')).toBeTruthy();
    expect(screen.getByText('00:30:00')).toBeTruthy();
  });

  it('should render stats skeleton grid when loading is true', () => {
    // Arrange & Act
    render(
      <ProjectHeaderCard
        selectedProject={selectedProject}
        projectDurationSeconds={0}
        isCondensed={false}
        stats={null}
        loading={true}
        newTaskName=""
        setNewTaskName={vi.fn()}
        onAddTaskSubmit={vi.fn()}
      />
    );

    // Assert
    const skeletons = screen.getByTestId('stats-skeleton-grid');
    expect(skeletons).toBeTruthy();
  });

  it('should render duration, total tasks, and completion ratio inside stats cards grid', () => {
    // Arrange
    const mockStats: ProjectStatistics = {
      totalDurationSec: 5400,
      totalTasks: 5,
      completedTasks: 2,
    };

    // Act
    render(
      <ProjectHeaderCard
        selectedProject={selectedProject}
        projectDurationSeconds={5400}
        isCondensed={false}
        stats={mockStats}
        loading={false}
        newTaskName=""
        setNewTaskName={vi.fn()}
        onAddTaskSubmit={vi.fn()}
      />
    );

    // Assert
    const statsGrid = screen.getByTestId('stats-cards-grid');
    expect(statsGrid).toBeTruthy();
    expect(statsGrid.textContent).toContain('01:30:00');
    expect(statsGrid.textContent).toContain('5');
    expect(statsGrid.textContent).toContain('40%');
  });

  it('should not show completion percentage badge when total tasks is zero', () => {
    // Arrange
    const mockStats: ProjectStatistics = {
      totalDurationSec: 0,
      totalTasks: 0,
      completedTasks: 0,
    };

    // Act
    render(
      <ProjectHeaderCard
        selectedProject={selectedProject}
        projectDurationSeconds={0}
        isCondensed={false}
        stats={mockStats}
        loading={false}
        newTaskName=""
        setNewTaskName={vi.fn()}
        onAddTaskSubmit={vi.fn()}
      />
    );

    // Assert
    expect(screen.queryByText(/%/)).toBeNull();
  });
});

