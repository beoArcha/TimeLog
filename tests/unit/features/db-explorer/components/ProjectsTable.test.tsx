// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProjectsTable from '@features/db-explorer/components/ProjectsTable';
import { OxyContext, OxyFlowState } from '@common/hooks/OxyContext';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: ProjectsTable', () => {
  const setProjectsMock = vi.fn();
  const mockState: OxyFlowState = {
    ...getMockOxyFlowState(),
    projects: [
      { id: 'p1', name: 'Original Name', color: 'indigo', createdAt: '2026-06-15T00:00:00Z', archived: false, description: null, icon: null, tags: null }
    ],
    locale: 'en',
    customTranslations: {},
    setProjects: setProjectsMock
  };

  it('should render projects list', () => {
    render(
      <OxyContext.Provider value={mockState}>
        <ProjectsTable />
      </OxyContext.Provider>
    );

    expect(screen.getByText(/Original Name/i)).not.toBeNull();
  });

  it('should open edit form and handle save', () => {
    const { container } = render(
      <OxyContext.Provider value={mockState}>
        <ProjectsTable />
      </OxyContext.Provider>
    );

    const editBtn = container.querySelector('.lucide-pen-line')?.closest('button');
    expect(editBtn).not.toBeNull();
    fireEvent.click(editBtn!);

    // Edit form input is open. Let's change name.
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    fireEvent.change(input, { target: { value: 'Updated Name' } });

    // Submit save (which is the check icon button)
    const saveBtn = container.querySelector('.lucide-check')?.closest('button');
    expect(saveBtn).not.toBeNull();
    fireEvent.click(saveBtn!);

    expect(setProjectsMock).toHaveBeenCalled();
  });
});
