// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Sidebar from '@/src/layouts/parts/Sidebar';
import { SidebarHeader } from '@/src/layouts/parts/sidebar/SidebarHeader';
import { SidebarProjectForm } from '@/src/layouts/parts/sidebar/SidebarProjectForm';
import { SidebarProjectItem } from '@/src/layouts/parts/sidebar/SidebarProjectItem';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject } from '@tests/shared/builders/entity-builders';
import { GuiState } from '@/src/layouts/hooks/useGuiLogic';

describe('Sidebar', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockProject1 = aProject({ id: 'proj-1', name: 'Alpha Project', color: 'blue' });
  const mockProject2 = aProject({ id: 'proj-2', name: 'Beta Project', color: 'violet', archived: true });

  const createMockGuiState = (overrides?: Partial<GuiState>): GuiState => ({
    projects: [mockProject1, mockProject2],
    tasks: [],
    timeLogs: [],
    metrics: {
      projects: {
        'proj-1': { totalElapsedSeconds: 3600, todayElapsedSeconds: 1800, weekElapsedSeconds: 3600 },
        'proj-2': { totalElapsedSeconds: 0, todayElapsedSeconds: 0, weekElapsedSeconds: 0 },
      },
      tasks: {},
    },
    locale: 'en',
    customTranslations: {},
    selectedProjectId: 'proj-1',
    setSelectedProjectId: vi.fn(),
    onAddProject: vi.fn(),
    onUpdateProject: vi.fn(),
    onRenameProject: vi.fn(),
    onToggleProjectArchive: vi.fn(),
    isLoading: false,
    ...overrides,
  } as unknown as GuiState);

  it('should render projects list and header when state is provided', () => {
    // Arrange
    const state = createMockGuiState();

    // Act
    render(
      <MockProviders>
        <Sidebar state={state} />
      </MockProviders>
    );

    // Assert
    expect(screen.getByRole('complementary').getAttribute('id')).toBe('projects-sidebar');
    expect(document.getElementById('project-item-proj-1')).not.toBeNull();
    expect(document.getElementById('project-item-proj-2')).not.toBeNull();
  });

  it('should trigger project selection when item is clicked', () => {
    // Arrange
    const onSelect = vi.fn();
    const state = createMockGuiState({ setSelectedProjectId: onSelect });

    // Act
    render(
      <MockProviders>
        <Sidebar state={state} />
      </MockProviders>
    );
    const item2 = document.getElementById('project-item-proj-2');
    if (item2) fireEvent.click(item2);

    // Assert
    expect(onSelect).toHaveBeenCalledWith('proj-2');
  });

  it('should submit new project when form inputs are filled and submitted', () => {
    // Arrange
    const onAddProject = vi.fn();
    const state = createMockGuiState({ onAddProject });

    // Act
    render(
      <MockProviders>
        <Sidebar state={state} />
      </MockProviders>
    );
    const input = document.getElementById('new-project-input') as HTMLInputElement;
    const addBtn = document.getElementById('add-project-btn') as HTMLButtonElement;

    fireEvent.change(input, { target: { value: 'Delta Project' } });
    fireEvent.click(addBtn);

    // Assert
    expect(onAddProject).toHaveBeenCalledWith('Delta Project', 'violet', null, null, null);
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
    render(
      <MockProviders>
        <SidebarProjectForm onAddProject={onAdd} locale="en" />
      </MockProviders>
    );
    const input = document.getElementById('new-project-input') as HTMLInputElement;
    const colorBtn = document.getElementById('color-picker-emerald') as HTMLButtonElement;
    const addBtn = document.getElementById('add-project-btn') as HTMLButtonElement;

    fireEvent.change(input, { target: { value: 'Gamma' } });
    if (colorBtn) fireEvent.click(colorBtn);
    fireEvent.click(addBtn);

    // Assert
    expect(onAdd).toHaveBeenCalledWith('Gamma', 'emerald', null, null, null);
  });
});

describe('SidebarProjectItem', () => {
  afterEach(cleanup);

  it('should trigger archive toggle when archive button is clicked', () => {
    // Arrange
    const onArchive = vi.fn();
    const project = aProject({ id: 'p-test', name: 'Test Proj', archived: false });

    // Act
    render(
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
    const archiveBtn = document.getElementById('archive-project-btn-p-test');
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
    render(
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
    const upBtn = document.getElementById('move-up-project-btn-p-test');
    const downBtn = document.getElementById('move-down-project-btn-p-test');

    if (upBtn) fireEvent.click(upBtn);
    if (downBtn) fireEvent.click(downBtn);

    // Assert
    expect(onMoveUp).toHaveBeenCalledWith('p-test');
    expect(onMoveDown).toHaveBeenCalledWith('p-test');
  });
});
