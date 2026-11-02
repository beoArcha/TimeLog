// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import MediumProjectSelector from '@layouts/parts/MediumProjectSelector';
import type { GuiState } from '@layouts/hooks/useGuiLogic';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';
import { MockProviders } from '@tests/shared/mocks/MockProviders';

describe('MediumProjectSelector DOM content model', () => {
  const project1 = aProject({ id: 'p1', name: 'Alpha Project', color: 'orange' });
  const project2 = aProject({ id: 'p2', name: 'Beta Project', color: 'teal' });
  const task1 = aTask({ id: 't1', projectId: 'p1', name: 'Task Alpha 1' });

  let mockSetSelectedProjectId: Mock<(id: string) => void>;
  let mockOnAddProject: Mock<(name: string, color: string, description: string | null, icon: string | null, tags: string[] | null) => void>;
  let mockOnToggleDock: Mock<() => void>;

  const createMockState = (overrides?: Partial<GuiState>): GuiState => ({
    projects: [project1, project2],
    tasks: [task1],
    selectedProjectId: 'p1',
    selectedProject: project1,
    setSelectedProjectId: mockSetSelectedProjectId,
    onAddProject: mockOnAddProject,
    locale: 'en',
    customTranslations: {},
    metrics: {
      projects: {
        p1: { totalElapsedSeconds: 3661 },
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

  it('ensures dropdown button contains no block-level elements (div, p) in its DOM tree', () => {
    const state = createMockState();
    render(
      <MockProviders state={state}>
        <MediumProjectSelector
          state={state}
          dockPosition="right"
          onToggleDock={mockOnToggleDock}
        />
      </MockProviders>
    );

    const dropdownBtn = screen.getByTestId('medium-project-dropdown-btn');
    const blockElements = dropdownBtn.querySelectorAll('div, p');
    expect(blockElements.length).toBe(0);
  });

  it('ensures dropdown button with no project selected also contains no block-level elements', () => {
    const state = createMockState({
      selectedProjectId: null,
      selectedProject: null,
    });
    render(
      <MockProviders state={state}>
        <MediumProjectSelector
          state={state}
          dockPosition="right"
          onToggleDock={mockOnToggleDock}
        />
      </MockProviders>
    );

    const dropdownBtn = screen.getByTestId('medium-project-dropdown-btn');
    const blockElements = dropdownBtn.querySelectorAll('div, p');
    expect(blockElements.length).toBe(0);
  });
});
