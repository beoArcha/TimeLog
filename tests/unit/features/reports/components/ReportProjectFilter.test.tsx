// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ReportProjectFilter } from '@features/reports/components/ReportProjectFilter';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject } from '@tests/shared/builders/entity-builders';

describe('Unit Tests: ReportProjectFilter', () => {
  afterEach(() => {
    cleanup();
  });

  const projectA = aProject({ id: 'p1', name: 'Alpha Corp', color: 'rose' });
  const projectB = aProject({ id: 'p2', name: 'Beta Dynamics', color: 'indigo' });

  it('Given empty projects list When rendering Then it returns null', () => {
    const onSelectProject = vi.fn();
    const { container } = render(
      <MockProviders>
        <ReportProjectFilter
          projects={[]}
          selectedProjectId={null}
          onSelectProject={onSelectProject}
        />
      </MockProviders>
    );

    expect(container.firstChild).toBeNull();
  });

  it('Given projects and no selected project When rendered Then All button is pressed', () => {
    const onSelectProject = vi.fn();
    render(
      <MockProviders>
        <ReportProjectFilter
          projects={[projectA, projectB]}
          selectedProjectId={null}
          onSelectProject={onSelectProject}
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
    const onSelectProject = vi.fn();
    render(
      <MockProviders>
        <ReportProjectFilter
          projects={[projectA, projectB]}
          selectedProjectId="p1"
          onSelectProject={onSelectProject}
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

  it('Given project filter list When clicking a project button Then it triggers onSelectProject with project id', () => {
    const onSelectProject = vi.fn();
    render(
      <MockProviders>
        <ReportProjectFilter
          projects={[projectA, projectB]}
          selectedProjectId={null}
          onSelectProject={onSelectProject}
        />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('project-filter-p1'));
    expect(onSelectProject).toHaveBeenCalledWith('p1');
  });

  it('Given an already selected project When clicking it again Then it toggles off by calling onSelectProject with null', () => {
    const onSelectProject = vi.fn();
    render(
      <MockProviders>
        <ReportProjectFilter
          projects={[projectA, projectB]}
          selectedProjectId="p1"
          onSelectProject={onSelectProject}
        />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('project-filter-p1'));
    expect(onSelectProject).toHaveBeenCalledWith(null);
  });

  it('Given selected project When clicking All button Then it calls onSelectProject with null', () => {
    const onSelectProject = vi.fn();
    render(
      <MockProviders>
        <ReportProjectFilter
          projects={[projectA, projectB]}
          selectedProjectId="p2"
          onSelectProject={onSelectProject}
        />
      </MockProviders>
    );

    fireEvent.click(screen.getByTestId('project-filter-all'));
    expect(onSelectProject).toHaveBeenCalledWith(null);
  });
});
