// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MediumHeaderActions } from '@layouts/parts/MediumHeaderActions';

describe('MediumHeaderActions', () => {
  let onOpenCreateProject: ReturnType<typeof vi.fn>;
  let onToggleDock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onOpenCreateProject = vi.fn();
    onToggleDock = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render toolbar role and fire action callbacks on click', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <MediumHeaderActions
        dockPosition="right"
        onToggleDock={onToggleDock}
        onOpenCreateProject={onOpenCreateProject}
      />
    );

    // Assert initial layout
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).not.toBeNull();

    const newProjectBtn = screen.getByTestId('medium-new-project-btn');
    const dockBtn = screen.getByTestId('toggle-dock-btn');

    // Act
    await user.click(newProjectBtn);
    await user.click(dockBtn);

    // Assert
    expect(onOpenCreateProject).toHaveBeenCalledTimes(1);
    expect(onToggleDock).toHaveBeenCalledTimes(1);
  });

  it('should set aria-pressed to false when dockPosition is right', () => {
    // Arrange & Act
    render(
      <MediumHeaderActions
        dockPosition="right"
        onToggleDock={onToggleDock}
        onOpenCreateProject={onOpenCreateProject}
      />
    );

    // Assert
    const dockBtn = screen.getByTestId('toggle-dock-btn');
    expect(dockBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('should set aria-pressed to true when dockPosition is left', () => {
    // Arrange & Act
    render(
      <MediumHeaderActions
        dockPosition="left"
        onToggleDock={onToggleDock}
        onOpenCreateProject={onOpenCreateProject}
      />
    );

    // Assert
    const dockBtn = screen.getByTestId('toggle-dock-btn');
    expect(dockBtn.getAttribute('aria-pressed')).toBe('true');
  });
});
