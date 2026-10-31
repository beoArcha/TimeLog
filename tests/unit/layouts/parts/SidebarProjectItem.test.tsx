// @vitest-environment jsdom
import React from 'react';
import { render, cleanup, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SidebarProjectItem } from '@layouts/parts/sidebar/SidebarProjectItem';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { Project } from '@bindings/Project';

describe('SidebarProjectItem', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const createBaseProject = (overrides?: Partial<Project>): Project => ({
    id: 'p-1',
    name: 'Test Project',
    color: 'teal',
    description: 'Description',
    icon: undefined,
    tags: [],
    archived: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  const defaultProps = {
    isSelected: false,
    locale: 'en' as const,
    isFirst: false,
    isLast: false,
    isEditingInline: false,
    inlineEditName: '',
    onSelect: vi.fn(),
    onEditDialog: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    onInlineNameChange: vi.fn(),
    onCommitInlineRename: vi.fn(),
    onCancelInlineRename: vi.fn(),
  };

  it('should render color dot with Tailwind bg class for palette color', () => {
    // Arrange
    const project = createBaseProject({ color: 'teal', icon: null });

    // Act
    render(
      <MockProviders>
        <SidebarProjectItem {...defaultProps} project={project} />
      </MockProviders>
    );

    // Assert
    const dot = screen.getByTestId('project-color-dot-p-1');
    expect(dot.className).toContain('bg-teal-500');
    expect(dot.style.backgroundColor).toBe('');
  });

  it('should render color dot with inline style for arbitrary 6-character HEX color', () => {
    // Arrange
    const project = createBaseProject({ color: '#3b82f6', icon: null });

    // Act
    render(
      <MockProviders>
        <SidebarProjectItem {...defaultProps} project={project} />
      </MockProviders>
    );

    // Assert
    const dot = screen.getByTestId('project-color-dot-p-1');
    expect(dot.className).not.toContain('bg-rose-500');
    // jsdom normalizes hex colors in style to rgb
    expect(dot.style.backgroundColor).toBe('rgb(59, 130, 246)');
  });

  it('should render color dot with inline style for arbitrary 3-character HEX color', () => {
    // Arrange
    const project = createBaseProject({ color: '#f40', icon: null });

    // Act
    render(
      <MockProviders>
        <SidebarProjectItem {...defaultProps} project={project} />
      </MockProviders>
    );

    // Assert
    const dot = screen.getByTestId('project-color-dot-p-1');
    expect(dot.className).not.toContain('bg-rose-500');
    expect(dot.style.backgroundColor).toBe('rgb(255, 68, 0)');
  });

  it('should fallback to rose-500 class when project color is invalid', () => {
    // Arrange
    const project = createBaseProject({ color: 'invalid-nonexistent-color', icon: null });

    // Act
    render(
      <MockProviders>
        <SidebarProjectItem {...defaultProps} project={project} />
      </MockProviders>
    );

    // Assert
    const dot = screen.getByTestId('project-color-dot-p-1');
    expect(dot.className).toContain('bg-rose-500');
  });

  it('should render emoji icon instead of color dot when icon is present', () => {
    // Arrange
    const project = createBaseProject({ color: '#3b82f6', icon: '🚀' });

    // Act
    render(
      <MockProviders>
        <SidebarProjectItem {...defaultProps} project={project} />
      </MockProviders>
    );

    // Assert
    expect(screen.queryByTestId('project-color-dot-p-1')).toBeNull();
    expect(screen.getByText('🚀')).not.toBeNull();
  });

  it('should render delete-project-btn and NOT archive-project-btn for project with 0 seconds logged', () => {
    const project = createBaseProject();

    const { container } = render(
      <MockProviders>
        <SidebarProjectItem {...defaultProps} project={project} totalSeconds={0} />
      </MockProviders>
    );

    expect(container.querySelector('#delete-project-btn-p-1')).not.toBeNull();
    expect(container.querySelector('#archive-project-btn-p-1')).toBeNull();
  });

  it('should render archive-project-btn and NOT delete-project-btn for project with totalSeconds > 0', () => {
    const project = createBaseProject();

    const { container } = render(
      <MockProviders>
        <SidebarProjectItem {...defaultProps} project={project} totalSeconds={120} />
      </MockProviders>
    );

    expect(container.querySelector('#archive-project-btn-p-1')).not.toBeNull();
    expect(container.querySelector('#delete-project-btn-p-1')).toBeNull();
  });

  it('should render archive-project-btn and NOT delete-project-btn when timer is running for project', () => {
    const project = createBaseProject();
    const activeLog = {
      id: 'log-1',
      projectId: 'p-1',
      taskId: 'task-1',
      startTime: new Date().toISOString(),
      endTime: null,
      note: null,
    };

    const { container } = render(
      <MockProviders>
        <SidebarProjectItem {...defaultProps} project={project} totalSeconds={0} activeLog={activeLog} />
      </MockProviders>
    );

    expect(container.querySelector('#archive-project-btn-p-1')).not.toBeNull();
    expect(container.querySelector('#delete-project-btn-p-1')).toBeNull();
  });

  it('should open confirm dialog with title and destructive styling when delete-project-btn is clicked', () => {
    const project = createBaseProject();

    const { container } = render(
      <MockProviders>
        <SidebarProjectItem {...defaultProps} project={project} totalSeconds={0} />
      </MockProviders>
    );

    const deleteBtn = container.querySelector('#delete-project-btn-p-1') as HTMLButtonElement;
    expect(deleteBtn).not.toBeNull();
    fireEvent.click(deleteBtn);

    expect(screen.getByRole('alertdialog')).not.toBeNull();
    expect(screen.getByText('Delete Project')).not.toBeNull();
  });

  it('should show DeleteProjectWarningTasks with interpolated count in confirm dialog when project has tasks', () => {
    const project = createBaseProject();

    const { container } = render(
      <MockProviders>
        <SidebarProjectItem {...defaultProps} project={project} totalSeconds={0} taskCount={3} />
      </MockProviders>
    );

    const deleteBtn = container.querySelector('#delete-project-btn-p-1') as HTMLButtonElement;
    fireEvent.click(deleteBtn);

    expect(
      screen.getByText(/This project contains 3 task\(s\)\. Are you sure you want to delete this project and all its tasks\?/)
    ).not.toBeNull();
  });

  it('should show standard DeleteConfirmProject in confirm dialog when project has 0 tasks', () => {
    const project = createBaseProject();

    const { container } = render(
      <MockProviders>
        <SidebarProjectItem {...defaultProps} project={project} totalSeconds={0} taskCount={0} />
      </MockProviders>
    );

    const deleteBtn = container.querySelector('#delete-project-btn-p-1') as HTMLButtonElement;
    fireEvent.click(deleteBtn);

    expect(
      screen.getByText('Are you sure you want to delete this project and all its tasks and logs?')
    ).not.toBeNull();
  });

  it('should invoke onDeleteProject when deletion is confirmed in dialog', async () => {
    const onDeleteProject = vi.fn();
    const project = createBaseProject();

    const { container } = render(
      <MockProviders>
        <SidebarProjectItem
          {...defaultProps}
          project={project}
          totalSeconds={0}
          onDeleteProject={onDeleteProject}
        />
      </MockProviders>
    );

    const deleteBtn = container.querySelector('#delete-project-btn-p-1') as HTMLButtonElement;
    fireEvent.click(deleteBtn);

    const confirmBtn = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmBtn);

    expect(onDeleteProject).toHaveBeenCalledWith('p-1');
  });

  it('should invoke handleDeleteProject from DataContext when confirmed without explicit onDeleteProject prop', async () => {
    const handleDeleteProject = vi.fn();
    const project = createBaseProject();

    const { container } = render(
      <MockProviders dataState={{ handleDeleteProject }}>
        <SidebarProjectItem {...defaultProps} project={project} totalSeconds={0} />
      </MockProviders>
    );

    const deleteBtn = container.querySelector('#delete-project-btn-p-1') as HTMLButtonElement;
    fireEvent.click(deleteBtn);

    const confirmBtn = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmBtn);

    expect(handleDeleteProject).toHaveBeenCalledWith('p-1');
  });
});
