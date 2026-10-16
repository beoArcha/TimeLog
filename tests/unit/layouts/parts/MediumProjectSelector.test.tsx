// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import MediumProjectSelector from '@layouts/parts/MediumProjectSelector';
import type { GuiState } from '@layouts/hooks/useGuiLogic';
import type { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';
import { MockProviders } from '@tests/shared/mocks/MockProviders';

describe('MediumProjectSelector', () => {
  const project1 = aProject({ id: 'p1', name: 'Alpha Project', color: 'orange' });
  const project2 = aProject({ id: 'p2', name: 'Beta Project', color: 'teal' });
  const task1 = aTask({ id: 't1', projectId: 'p1', name: 'Task Alpha 1' });
  const task2 = aTask({ id: 't2', projectId: 'p1', name: 'Task Alpha 2' });
  const task3 = aTask({ id: 't3', projectId: 'p2', name: 'Task Beta 1' });

  let mockSetSelectedProjectId: Mock<(id: string) => void>;
  let mockOnAddProject: Mock<(name: string, color: string, description: string | null, icon: string | null, tags: string[] | null) => void>;
  let mockOnToggleDock: Mock<() => void>;

  const createMockState = (overrides?: Partial<GuiState>): GuiState => ({
    projects: [project1, project2],
    tasks: [task1, task2, task3],
    selectedProjectId: 'p1',
    selectedProject: project1,
    setSelectedProjectId: mockSetSelectedProjectId,
    onAddProject: mockOnAddProject,
    locale: 'en',
    customTranslations: {},
    metrics: {
      projects: {
        p1: { totalElapsedSeconds: 3661 },
        p2: { totalElapsedSeconds: 120 },
      },
    },
    ...overrides,
  } as unknown as GuiState);

  beforeEach(() => {
    mockSetSelectedProjectId = vi.fn();
    mockOnAddProject = vi.fn();
    mockOnToggleDock = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (
    state: GuiState,
    dockPosition: 'right' | 'left' = 'right'
  ) => {
    return render(
      <MockProviders state={state}>
        <MediumProjectSelector
          state={state}
          dockPosition={dockPosition}
          onToggleDock={() => mockOnToggleDock()}
        />
      </MockProviders>
    );
  };

  it('should render selected project name, formatted elapsed time, and task count', () => {
    // Arrange
    const state = createMockState();

    // Act
    renderComponent(state);

    // Assert
    expect(screen.getByText('Alpha Project')).not.toBeNull();
    expect(screen.getByText('01:01:01')).not.toBeNull();
    expect(screen.getByText(/2/)).not.toBeNull();
  });

  it('should toggle dropdown open and closed when dropdown trigger button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const state = createMockState();
    renderComponent(state);

    const dropdownBtn = screen.getByTestId('medium-project-dropdown-btn');
    expect(dropdownBtn.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByTestId(`medium-project-item-${project2.id}`)).toBeNull();

    // Act: Open
    await user.click(dropdownBtn);

    // Assert: Opened
    expect(dropdownBtn.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId(`medium-project-item-${project2.id}`)).not.toBeNull();

    // Act: Close
    await user.click(dropdownBtn);

    // Assert: Closed
    expect(dropdownBtn.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByTestId(`medium-project-item-${project2.id}`)).toBeNull();
  });

  it('should select project and close dropdown when a project item is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const state = createMockState();
    renderComponent(state);

    const dropdownBtn = screen.getByTestId('medium-project-dropdown-btn');
    await user.click(dropdownBtn);

    const targetProjectItem = screen.getByTestId(`medium-project-item-${project2.id}`);

    // Act
    await user.click(targetProjectItem);

    // Assert
    expect(mockSetSelectedProjectId).toHaveBeenCalledWith('p2');
    expect(dropdownBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('should open new project form and submit successfully with trimmed name and chosen color', async () => {
    // Arrange
    const user = userEvent.setup();
    const state = createMockState();
    renderComponent(state);

    const dropdownBtn = screen.getByTestId('medium-project-dropdown-btn');
    await user.click(dropdownBtn);

    const openAddBtn = screen.getByTestId('medium-open-add-project-btn');

    // Act: Open add project form
    await user.click(openAddBtn);

    const input = screen.getByTestId('medium-new-project-input');
    const colorBtn = screen.getByTitle('emerald');

    await user.click(colorBtn);
    await user.type(input, '  Gamma Project  ');

    const submitBtn = screen.getByTestId('medium-save-new-project-btn');
    await user.click(submitBtn);

    // Assert
    expect(mockOnAddProject).toHaveBeenCalledWith('Gamma Project', 'emerald', null, null, null);
    expect(dropdownBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('should open add project form directly when header action button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const state = createMockState();
    renderComponent(state);

    const headerAddBtn = screen.getByTestId('medium-new-project-btn');

    // Act
    await user.click(headerAddBtn);

    // Assert
    expect(screen.getByTestId('medium-new-project-input')).not.toBeNull();
    expect(screen.getByTestId('medium-save-new-project-btn')).not.toBeNull();
  });

  it('should close add project form when cancel button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const state = createMockState();
    renderComponent(state);

    const headerAddBtn = screen.getByTestId('medium-new-project-btn');
    await user.click(headerAddBtn);
    expect(screen.getByTestId('medium-new-project-input')).not.toBeNull();

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });

    // Act
    await user.click(cancelBtn);

    // Assert
    expect(screen.queryByTestId('medium-new-project-input')).toBeNull();
  });

  it('should call onToggleDock when dock toggle button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const state = createMockState();
    renderComponent(state, 'right');

    const dockBtn = screen.getByTestId('toggle-dock-btn');

    // Act
    await user.click(dockBtn);

    // Assert
    expect(mockOnToggleDock).toHaveBeenCalledTimes(1);
  });

  it('should close dropdown when header close button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const state = createMockState();
    renderComponent(state);

    const dropdownBtn = screen.getByTestId('medium-project-dropdown-btn');
    await user.click(dropdownBtn);
    expect(dropdownBtn.getAttribute('aria-expanded')).toBe('true');

    const closeBtn = screen.getByRole('button', { name: /close/i });

    // Act
    await user.click(closeBtn);

    // Assert
    expect(dropdownBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('should resolve selected project from projects list when selectedProject prop is missing', () => {
    // Arrange
    const state = createMockState({
      selectedProject: undefined,
      selectedProjectId: 'p2',
    });

    // Act
    renderComponent(state);

    // Assert
    expect(screen.getByText('Beta Project')).not.toBeNull();
  });

  it('should render fallback when no projects exist', () => {
    // Arrange
    const emptyState = createMockState({
      projects: [],
      tasks: [],
      selectedProject: undefined,
      selectedProjectId: null,
      metrics: {
        projects: {},
        tasks: {},
        snapshotNowIso: '2026-01-01T00:00:00Z',
      } as unknown as EngineComputedMetrics,
    });

    // Act
    renderComponent(emptyState);

    // Assert
    const dropdownBtn = screen.getByTestId('medium-project-dropdown-btn');
    expect(dropdownBtn).not.toBeNull();
    expect(screen.queryByText('Alpha Project')).toBeNull();
  });
});
