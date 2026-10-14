// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MediumHeaderActions } from '@layouts/parts/MediumHeaderActions';

describe('Unit Tests: MediumHeaderActions (i18n & a11y)', () => {
  it('Given English locale, Then it renders accessible attributes and translated English labels', () => {
    const onOpenCreateProject = vi.fn();
    const onToggleDock = vi.fn();

    render(
      <MediumHeaderActions
        theme="dark"
        dockPosition="right"
        onToggleDock={onToggleDock}
        onOpenCreateProject={onOpenCreateProject}
        locale="en"
      />
    );

    // a11y: toolbar role
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).not.toBeNull();
    expect(toolbar.getAttribute('aria-label')).toBe('Actions');

    // i18n + a11y: New Project button
    const newProjectBtn = screen.getByRole('button', { name: /new project/i });
    expect(newProjectBtn).not.toBeNull();
    expect(newProjectBtn.getAttribute('title')).toBe('New Project');

    // i18n + a11y: Dock Switch button for right dock
    const dockBtn = screen.getByRole('button', { name: /switch dock side/i });
    expect(dockBtn).not.toBeNull();
    expect(dockBtn.getAttribute('title')).toBe('Switch dock to the left side');
    expect(dockBtn.getAttribute('aria-pressed')).toBe('false');

    // Interactions
    fireEvent.click(newProjectBtn);
    expect(onOpenCreateProject).toHaveBeenCalledTimes(1);

    fireEvent.click(dockBtn);
    expect(onToggleDock).toHaveBeenCalledTimes(1);
  });

  it('Given Polish locale and dockPosition left, Then it renders Polish labels and aria-pressed true', () => {
    const onOpenCreateProject = vi.fn();
    const onToggleDock = vi.fn();

    render(
      <MediumHeaderActions
        theme="light"
        dockPosition="left"
        onToggleDock={onToggleDock}
        onOpenCreateProject={onOpenCreateProject}
        locale="pl"
      />
    );

    // i18n + a11y: Nowy Projekt button
    const newProjectBtn = screen.getByRole('button', { name: /nowy projekt/i });
    expect(newProjectBtn).not.toBeNull();
    expect(newProjectBtn.getAttribute('title')).toBe('Nowy Projekt');

    // i18n + a11y: Dock Switch button to switch to right side
    const dockBtn = screen.getByRole('button', { name: /przełącz stronę dokowania/i });
    expect(dockBtn).not.toBeNull();
    expect(dockBtn.getAttribute('title')).toBe('Przełącz pasek na prawą stronę');
    expect(dockBtn.getAttribute('aria-pressed')).toBe('true');
  });
});
