// @vitest-environment jsdom
import React from 'react';
import { render, cleanup, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SidebarProjectItem } from '@layouts/parts/sidebar/SidebarProjectItem';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { Project } from '@bindings/Project';

describe('SidebarProjectItem', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const createBaseProject = (overrides?: Partial<Project>): Project => ({
    id: 'p-1',
    name: 'Test Project',
    color: 'teal',
    description: 'Description',
    icon: undefined,
    tags: [],
    archived: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  const defaultProps = {
    isSelected: false,
    locale: 'en' as const,
    isFirst: false,
    isLast: false,
    isEditingInline: false,
    inlineEditName: '',
    onSelect: vi.fn(),
    onEditDialog: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    onInlineNameChange: vi.fn(),
    onCommitInlineRename: vi.fn(),
    onCancelInlineRename: vi.fn(),
  };

  it('should render color dot with Tailwind bg class for palette color', () => {
    // Arrange
    const project = createBaseProject({ color: 'teal', icon: null });

    // Act
    render(
      <MockProviders>
        <SidebarProjectItem {...defaultProps} project={project} />
      </MockProviders>
    );

    // Assert
    const dot = screen.getByTestId('project-color-dot-p-1');
    expect(dot.className).toContain('bg-teal-500');
    expect(dot.style.backgroundColor).toBe('');
  });

  it('should render color dot with inline style for arbitrary 6-character HEX color', () => {
    // Arrange
    const project = createBaseProject({ color: '#3b82f6', icon: null });

    // Act
    render(
      <MockProviders>
        <SidebarProjectItem {...defaultProps} project={project} />
      </MockProviders>
    );

    // Assert
    const dot = screen.getByTestId('project-color-dot-p-1');
    expect(dot.className).not.toContain('bg-rose-500');
    // jsdom normalizes hex colors in style to rgb
    expect(dot.style.backgroundColor).toBe('rgb(59, 130, 246)');
  });

  it('should render color dot with inline style for arbitrary 3-character HEX color', () => {
    // Arrange
    const project = createBaseProject({ color: '#f40', icon: null });

    // Act
    render(
      <MockProviders>
        <SidebarProjectItem {...defaultProps} project={project} />
      </MockProviders>
    );

    // Assert
    const dot = screen.getByTestId('project-color-dot-p-1');
    expect(dot.className).not.toContain('bg-rose-500');
    expect(dot.style.backgroundColor).toBe('rgb(255, 68, 0)');
  });

  it('should fallback to rose-500 class when project color is invalid', () => {
    // Arrange
    const project = createBaseProject({ color: 'invalid-nonexistent-color', icon: null });

    // Act
    render(
      <MockProviders>
        <SidebarProjectItem {...defaultProps} project={project} />
      </MockProviders>
    );

    // Assert
    const dot = screen.getByTestId('project-color-dot-p-1');
    expect(dot.className).toContain('bg-rose-500');
  });

  it('should render emoji icon instead of color dot when icon is present', () => {
    // Arrange
    const project = createBaseProject({ color: '#3b82f6', icon: '🚀' });

    // Act
    render(
      <MockProviders>
        <SidebarProjectItem {...defaultProps} project={project} />
      </MockProviders>
    );

    // Assert
    expect(screen.queryByTestId('project-color-dot-p-1')).toBeNull();
    expect(screen.getByText('🚀')).not.toBeNull();
  });
});
