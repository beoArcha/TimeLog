// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ReportProjectFilter } from '@features/reports/components/ReportProjectFilter';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject } from '@tests/shared/builders/entity-builders';

import { DEFAULT_PROJECT_COLOR_HEX } from '@common/constants/projectColors';

describe('Unit Tests: ReportProjectFilter', () => {
  afterEach(() => {
    cleanup();
  });

  const projectA = aProject({ id: 'p1', name: 'Alpha Corp', color: 'rose' });
  const projectB = aProject({ id: 'p2', name: 'Beta Dynamics', color: 'indigo' });

  it('Given empty projects list When rendering Then it returns null', () => {
    const handlers = { onToggleProject: vi.fn(), onClearProjects: vi.fn() };
    const { container } = render(
      <MockProviders>
        <ReportProjectFilter
          projects={[]}
          selectedProjectIds={[]}
          {...handlers}
        />
      </MockProviders>
    );

    expect(container.firstChild).toBeNull();
  });

  it('Given projects and no selected project When rendered Then All button is pressed', () => {
    const handlers = { onToggleProject: vi.fn(), onClearProjects: vi.fn() };
    render(
      <MockProviders>
        <ReportProjectFilter
          projects={[projectA, projectB]}
          selectedProjectIds={[]}
          {...handlers}
        />
      </MockProviders>
    );

    const allBtn = screen.getByTestId('project-filter-all');
    const p1Btn = screen.getByTestId('project-filter-p1');
    const p2Btn = screen.getByTestId('project-filter-p2');

    expect(allBtn.getAttribute('aria-pressed')).toBe('true');
    expect(p1Btn.getAttribute('aria-pressed')).toBe('false');
    expect(p2Btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('Given projects and selected project p1 When rendered Then p1 button is pressed and All is unpressed', () => {
    const handlers = { onToggleProject: vi.fn(), onClearProjects: vi.fn() };
    render(
      <MockProviders>
        <ReportProjectFilter
          projects={[projectA, projectB]}
          selectedProjectIds={["p1"]}
          {...handlers}
        />
      </MockProviders>
    );

    const allBtn = screen.getByTestId('project-filter-all');
    const p1Btn = screen.getByTestId('project-filter-p1');
    const p2Btn = screen.getByTestId('project-filter-p2');

    expect(allBtn.getAttribute('aria-pressed')).toBe('false');
    expect(p1Btn.getAttribute('aria-pressed')).toBe('true');
    expect(p2Btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('should toggle the clicked project when a project button is clicked', () => {
    // Arrange
    const handlers = { onToggleProject: vi.fn(), onClearProjects: vi.fn() };
    render(
      <MockProviders>
        <ReportProjectFilter projects={[projectA, projectB]} selectedProjectIds={['p1']} {...handlers} />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('project-filter-p2'));

    // Assert
    expect(handlers.onToggleProject).toHaveBeenCalledWith('p2');
    expect(handlers.onClearProjects).not.toHaveBeenCalled();
  });

  it('should mark every selected project as pressed and All as unpressed when several projects are selected', () => {
    // Arrange
    const handlers = { onToggleProject: vi.fn(), onClearProjects: vi.fn() };

    // Act
    render(
      <MockProviders>
        <ReportProjectFilter projects={[projectA, projectB]} selectedProjectIds={['p1', 'p2']} {...handlers} />
      </MockProviders>
    );

    // Assert
    expect(screen.getByTestId('project-filter-all').getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByTestId('project-filter-p1').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('project-filter-p2').getAttribute('aria-pressed')).toBe('true');
  });

  it('should clear the selection when All is clicked', () => {
    // Arrange
    const handlers = { onToggleProject: vi.fn(), onClearProjects: vi.fn() };
    render(
      <MockProviders>
        <ReportProjectFilter projects={[projectA, projectB]} selectedProjectIds={['p2']} {...handlers} />
      </MockProviders>
    );

    // Act
    fireEvent.click(screen.getByTestId('project-filter-all'));

    // Assert
    expect(handlers.onClearProjects).toHaveBeenCalledTimes(1);
    expect(handlers.onToggleProject).not.toHaveBeenCalled();
  });

  it('Given project with unknown color name When rendered Then color indicator falls back to DEFAULT_PROJECT_COLOR_HEX', () => {
    const projectUnknown = aProject({ id: 'p3', name: 'Gamma Corp', color: 'unmapped_color' });
    const handlers = { onToggleProject: vi.fn(), onClearProjects: vi.fn() };
    render(
      <MockProviders>
        <ReportProjectFilter
          projects={[projectUnknown]}
          selectedProjectIds={[]}
          {...handlers}
        />
      </MockProviders>
    );

    const btn = screen.getByTestId('project-filter-p3');
    const dot = btn.querySelector('span[aria-hidden="true"]');
    expect(dot).not.toBeNull();
    expect(DEFAULT_PROJECT_COLOR_HEX).toBe('#f43f5e');
    expect((dot as HTMLElement).style.backgroundColor).toMatch(/rgb\(244,\s*63,\s*94\)|#f43f5e/);
  });

  it('Given ReportProjectFilter When rendered Then project label uses Text typography component with muted variant and font-mono', () => {
    const handlers = { onToggleProject: vi.fn(), onClearProjects: vi.fn() };
    const { container } = render(
      <MockProviders>
        <ReportProjectFilter
          projects={[projectA]}
          selectedProjectIds={[]}
          {...handlers}
        />
      </MockProviders>
    );

    const label = container.querySelector('[data-slot="text"]');
    expect(label).not.toBeNull();
    expect(label?.tagName.toLowerCase()).toBe('span');
    expect(label?.className).toContain('font-mono');
  });

  it('should render and toggle the chip of an archived project when it is in the project list', () => {
    // Arrange
    const archived = aProject({ id: 'p9', name: 'Finished Work', archived: true });
    const onToggleProject = vi.fn();
    render(
      <MockProviders>
        <ReportProjectFilter
          projects={[projectA, archived]}
          selectedProjectIds={['p9']}
          onToggleProject={onToggleProject}
          onClearProjects={vi.fn()}
        />
      </MockProviders>
    );
    const archivedChip = screen.getByTestId('project-filter-p9');

    // Act
    fireEvent.click(archivedChip);

    // Assert
    expect(archivedChip.getAttribute('aria-pressed')).toBe('true');
    expect(onToggleProject).toHaveBeenCalledWith('p9');
  });
});
