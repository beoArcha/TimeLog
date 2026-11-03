// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, vi, afterEach } from 'vitest';
import { TaskVisibilityToggle } from '@layouts/compact/TaskVisibilityToggle';
import { expectNoFlowContent } from '@tests/shared/html-content-model';

describe('TaskVisibilityToggle DOM content model', () => {
  afterEach(() => {
    cleanup();
  });

  it('ensures compact toggle button contains only phrasing content when collapsed', () => {
    render(
      <TaskVisibilityToggle
        isExpanded={false}
        locale="en"
        onToggle={vi.fn()}
      />
    );

    const toggleBtn = screen.getByTestId('compact-toggle-tasks-btn');
    expectNoFlowContent(toggleBtn);
  });

  it('ensures compact toggle button contains only phrasing content when expanded', () => {
    render(
      <TaskVisibilityToggle
        isExpanded={true}
        locale="en"
        onToggle={vi.fn()}
      />
    );

    const toggleBtn = screen.getByTestId('compact-toggle-tasks-btn');
    expectNoFlowContent(toggleBtn);
  });
});
