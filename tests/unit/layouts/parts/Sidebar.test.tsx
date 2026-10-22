// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Sidebar from '@layouts/parts/Sidebar';
import { SidebarHeader } from '@layouts/parts/sidebar/SidebarHeader';
import { SidebarProjectForm } from '@layouts/parts/sidebar/SidebarProjectForm';
import { SidebarProjectItem } from '@layouts/parts/sidebar/SidebarProjectItem';
import { GuiState } from '@layouts/hooks/useGuiLogic';
import { aProject } from '@tests/shared/builders/entity-builders';
import { MockProviders } from '@tests/shared/mocks/MockProviders';

function createMockGuiState(overrides: Partial<GuiState> = {}): GuiState {
  const p1 = aProject({ id: 'proj-1', name: 'Alpha Project', color: 'orange' });
  const p2 = aProject({ id: 'proj-2', name: 'Beta Project', color: 'blue' });

  return {
    projects: [p1, p2],
    tasks: [],
    logs: [],
    activeLog: null,
    holidays: [],
    metrics: null,
    nowIso: '2026-06-15T12:00:00Z',
    locale: 'en',
    selectedProjectId: 'proj-1',
    setSelectedProjectId: vi.fn(),
    onAddProject: vi.fn(),
    onUpdateProject: vi.fn(),
    onRenameProject: vi.fn(),
    onToggleProjectArchive: vi.fn(),
    isLoading: false,
    onAddTask: vi.fn(),
    onToggleTaskComplete: vi.fn(),
    onStartTimer: vi.fn(),
    onStopTimer: vi.fn(),
    setHolidays: vi.fn(),
    selectedTaskId: null,
    ...overrides,
  } as unknown as GuiState;
}

describe('Sidebar', () => {
  afterEach(cleanup);

  it('should render projects list and header when state is provided', () => {
    // Arrange
    const state = createMockGuiState();

    // Act
    const { container } = render(
      <MockProviders>
        <Sidebar state={state} />
      </MockProviders>
    );

    // Assert
    expect(screen.getByRole('complementary').getAttribute('id')).toBe('projects-sidebar');
    expect(container.querySelector('#project-item-proj-1')).not.toBeNull();
    expect(container.querySelector('#project-item-proj-2')).not.toBeNull();
  });

  it('should trigger project selection when item is clicked', () => {
    // Arrange
    const onSelect = vi.fn();
    const state = createMockGuiState({ setSelectedProjectId: onSelect });

    // Act
    const { container } = render(
      <MockProviders>
        <Sidebar state={state} />
      </MockProviders>
    );
    const item2 = container.querySelector('#project-item-proj-2');
    if (item2) fireEvent.click(item2);

    // Assert
    expect(onSelect).toHaveBeenCalledWith('proj-2');
  });

  it('should submit new project when form inputs are filled and submitted', () => {
    // Arrange
    const onAddProject = vi.fn();
    const state = createMockGuiState({ onAddProject });

    // Act
    const { container } = render(
      <MockProviders>
        <Sidebar state={state} />
      </MockProviders>
    );
    const input = container.querySelector('#new-project-input') as HTMLInputElement;
    const addBtn = container.querySelector('#add-project-btn') as HTMLButtonElement;

    fireEvent.change(input, { target: { value: 'Delta Project' } });
    fireEvent.click(addBtn);

    // Assert
    expect(onAddProject).toHaveBeenCalledWith('Delta Project', 'violet', null, null, null, false);
  });
});

describe('SidebarHeader', () => {
  afterEach(cleanup);

  it('should display project count badge and header title', () => {
    // Arrange & Act
    render(
      <MockProviders>
        <SidebarHeader count={5} locale="en" />
      </MockProviders>
    );

    // Assert
    expect(screen.getByText(/MicroORM Tables/i)).not.toBeNull();
  });
});

describe('SidebarProjectForm', () => {
  afterEach(cleanup);

  it('should update color and submit payload when form is submitted', () => {
    // Arrange
    const onAdd = vi.fn();

    // Act
    const { container } = render(
      <MockProviders>
        <SidebarProjectForm onAddProject={onAdd} locale="en" />
      </MockProviders>
    );
    const input = container.querySelector('#new-project-input') as HTMLInputElement;
    const colorBtn = container.querySelector('#color-picker-emerald') as HTMLButtonElement;
    const addBtn = container.querySelector('#add-project-btn') as HTMLButtonElement;

    fireEvent.change(input, { target: { value: 'Gamma' } });
    if (colorBtn) fireEvent.click(colorBtn);
    fireEvent.click(addBtn);

    // Assert
    expect(onAdd).toHaveBeenCalledWith('Gamma', 'emerald', null, null, null, false);
  });
});

describe('SidebarProjectItem', () => {
  afterEach(cleanup);

  it('should trigger archive toggle when archive button is clicked', () => {
    // Arrange
    const onArchive = vi.fn();
    const project = aProject({ id: 'p-test', name: 'Test Proj', archived: false });

    // Act
    const { container } = render(
      <MockProviders>
        <SidebarProjectItem
          project={project}
          isSelected={false}
          totalSeconds={120}
          locale="en"
          isFirst={false}
          isLast={false}
          isEditingInline={false}
          inlineEditName=""
          onSelect={vi.fn()}
          onEditDialog={vi.fn()}
          onToggleArchive={onArchive}
          onMoveUp={vi.fn()}
          onMoveDown={vi.fn()}
          onInlineNameChange={vi.fn()}
          onCommitInlineRename={vi.fn()}
          onCancelInlineRename={vi.fn()}
        />
      </MockProviders>
    );
    const archiveBtn = container.querySelector('#archive-project-btn-p-test');
    if (archiveBtn) fireEvent.click(archiveBtn);

    // Assert
    expect(onArchive).toHaveBeenCalledWith('p-test');
  });

  it('should trigger move up and move down callbacks when reorder buttons clicked', () => {
    // Arrange
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();
    const project = aProject({ id: 'p-test', name: 'Test Proj' });

    // Act
    const { container } = render(
      <MockProviders>
        <SidebarProjectItem
          project={project}
          isSelected={true}
          totalSeconds={60}
          locale="en"
          isFirst={false}
          isLast={false}
          isEditingInline={false}
          inlineEditName=""
          onSelect={vi.fn()}
          onEditDialog={vi.fn()}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onInlineNameChange={vi.fn()}
          onCommitInlineRename={vi.fn()}
          onCancelInlineRename={vi.fn()}
        />
      </MockProviders>
    );
    const upBtn = container.querySelector('#move-up-project-btn-p-test');
    const downBtn = container.querySelector('#move-down-project-btn-p-test');

    if (upBtn) fireEvent.click(upBtn);
    if (downBtn) fireEvent.click(downBtn);

    // Assert
    expect(onMoveUp).toHaveBeenCalledWith('p-test');
    expect(onMoveDown).toHaveBeenCalledWith('p-test');
  });
});
