// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ProjectHeaderCard from '../../../../src/features/tasks/components/ProjectHeaderCard';
import { getScaleStyles } from '@/src/layouts/parts/LayoutStyles';
import { Project } from '@bindings/Project';
import { ProjectStatistics } from '@bindings/ProjectStatistics';

describe('Unit Tests: ProjectHeaderCard', () => {
  afterEach(() => {
    cleanup();
  });

  const selectedProject: Project = {
    id: 'proj_1',
    name: 'Project Alpha',
    color: 'rose',
    createdAt: '2026-06-12T00:00:00Z'
  };

  const sc = getScaleStyles('medium');

  it('Given ProjectHeaderCard rendered, When selectedProject details provided, Then it should show name and duration', () => {
    const setNewTaskNameSpy = vi.fn();
    const onAddTaskSubmitSpy = vi.fn();

    render(
      <ProjectHeaderCard
        selectedProject={selectedProject}
        projectDurationSeconds={3600}
        isCondensed={false}
        theme="dark"
        locale="en"
        customTranslations={{}}
        sc={sc}
        stats={null}
        loading={false}
        newTaskName="New Task"
        setNewTaskName={setNewTaskNameSpy}
        onAddTaskSubmit={onAddTaskSubmitSpy}
      />
    );

    expect(screen.getByText('Project Alpha')).toBeTruthy();
    expect(screen.getByText('01:00:00')).toBeTruthy();
  });

  it('Given input element, When new task name changed, Then it should call setNewTaskName', () => {
    const setNewTaskNameSpy = vi.fn();
    const onAddTaskSubmitSpy = vi.fn();

    render(
      <ProjectHeaderCard
        selectedProject={selectedProject}
        projectDurationSeconds={0}
        isCondensed={false}
        theme="dark"
        locale="en"
        customTranslations={{}}
        sc={sc}
        stats={null}
        loading={false}
        newTaskName=""
        setNewTaskName={setNewTaskNameSpy}
        onAddTaskSubmit={onAddTaskSubmitSpy}
      />
    );

    const input = screen.getByPlaceholderText(/Enter main task name/i);
    fireEvent.change(input, { target: { value: 'Buy Groceries' } });

    expect(setNewTaskNameSpy).toHaveBeenCalledWith('Buy Groceries');
  });

  it('Given isCondensed true, When selectedProject details provided, Then it should render in condensed mode', () => {
    const projectWithoutColor: Project = {
      id: 'proj_2',
      name: 'Project Beta',
      color: undefined as any,
      createdAt: '2026-06-12T00:00:00Z'
    };

    render(
      <ProjectHeaderCard
        selectedProject={projectWithoutColor}
        projectDurationSeconds={1800}
        isCondensed={true}
        theme="light"
        locale="en"
        customTranslations={{}}
        sc={sc}
        stats={null}
        loading={false}
        newTaskName=""
        setNewTaskName={vi.fn()}
        onAddTaskSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('Project Beta')).toBeTruthy();
    expect(screen.getByText('00:30:00')).toBeTruthy();
  });

  it('Given loading true, When project stats are loading, Then it should show skeletons', () => {
    render(
      <ProjectHeaderCard
        selectedProject={selectedProject}
        projectDurationSeconds={0}
        isCondensed={false}
        theme="light"
        locale="en"
        customTranslations={{}}
        sc={sc}
        stats={null}
        loading={true}
        newTaskName=""
        setNewTaskName={vi.fn()}
        onAddTaskSubmit={vi.fn()}
      />
    );

    const skeletons = screen.getByTestId('stats-skeleton-grid');
    expect(skeletons).toBeTruthy();
  });

  it('Given stats provided, When not loading, Then it should render duration, total tasks, and completion ratio', () => {
    const mockStats: ProjectStatistics = {
      totalDurationSec: 5400n,
      totalTasks: 5,
      completedTasks: 2
    };

    render(
      <ProjectHeaderCard
        selectedProject={selectedProject}
        projectDurationSeconds={5400}
        isCondensed={false}
        theme="high-contrast"
        locale="en"
        customTranslations={{}}
        sc={sc}
        stats={mockStats}
        loading={false}
        newTaskName=""
        setNewTaskName={vi.fn()}
        onAddTaskSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('Total Duration')).toBeTruthy();
    expect(screen.getAllByText('01:30:00').length).toBe(2);
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('40%')).toBeTruthy();
  });

  it('Given zero tasks in stats, When rendered, Then it should not show completion percentage', () => {
    const mockStats: ProjectStatistics = {
      totalDurationSec: 0n,
      totalTasks: 0,
      completedTasks: 0
    };

    render(
      <ProjectHeaderCard
        selectedProject={selectedProject}
        projectDurationSeconds={0}
        isCondensed={false}
        theme="dark"
        locale="en"
        customTranslations={{}}
        sc={sc}
        stats={mockStats}
        loading={false}
        newTaskName=""
        setNewTaskName={vi.fn()}
        onAddTaskSubmit={vi.fn()}
      />
    );

    expect(screen.queryByText('%')).toBeNull();
  });
});
