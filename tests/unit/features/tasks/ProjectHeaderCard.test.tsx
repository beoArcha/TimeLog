// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ProjectHeaderCard from '../../../../src/features/tasks/components/ProjectHeaderCard';
import { getScaleStyles } from '@/src/layouts/parts/GuiStyles';
import { Project } from '@bindings/Project';

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
});
