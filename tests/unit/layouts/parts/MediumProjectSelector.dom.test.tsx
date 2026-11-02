// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import MediumProjectSelector from '@layouts/parts/MediumProjectSelector';
import type { GuiState } from '@layouts/hooks/useGuiLogic';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';
import { MockProviders } from '@tests/shared/mocks/MockProviders';

const FLOW_CONTENT_SELECTOR = [
  'address', 'article', 'aside', 'blockquote', 'details', 'dialog', 'div', 'dl',
  'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'hr', 'main', 'menu', 'nav', 'ol', 'p', 'pre', 'search',
  'section', 'table', 'ul',
].join(', ');

function expectNoFlowContent(container: Element) {
  const invalidElements = Array.from(container.querySelectorAll(FLOW_CONTENT_SELECTOR))
    .map((element) => element.tagName.toLowerCase());

  expect(invalidElements).toEqual([]);
}

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

  it('renders phrasing-only content inside the dropdown button when a project is selected', () => {
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

    expectNoFlowContent(screen.getByTestId('medium-project-dropdown-btn'));
  });

  it('renders phrasing-only content inside the dropdown button without a selected project', () => {
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

    expectNoFlowContent(screen.getByTestId('medium-project-dropdown-btn'));
  });
});
