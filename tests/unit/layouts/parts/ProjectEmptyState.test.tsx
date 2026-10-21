// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ProjectEmptyState } from '@/src/layouts/parts/ProjectEmptyState';
import { STARTER_TEMPLATES } from '@common/templates/starterTemplates';

describe('ProjectEmptyState', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should render all 4 starter template buttons when mounted', () => {
    // Arrange
    const onApplyTemplate = vi.fn();

    // Act
    render(
      <ProjectEmptyState
        onApplyTemplate={onApplyTemplate}
        locale="en"
      />,
    );

    // Assert
    const container = screen.getByTestId('project-empty-state');
    expect(container).toBeDefined();

    for (const template of STARTER_TEMPLATES) {
      const button = screen.getByTestId(`starter-template-${template.id}`);
      expect(button).toBeDefined();
    }
  });

  it('should call onApplyTemplate with chosen template when clicked', () => {
    // Arrange
    const onApplyTemplate = vi.fn();
    render(
      <ProjectEmptyState
        onApplyTemplate={onApplyTemplate}
        locale="en"
      />,
    );

    // Act
    const softwareTemplateBtn = screen.getByTestId('starter-template-software-dev');
    fireEvent.click(softwareTemplateBtn);

    // Assert
    expect(onApplyTemplate).toHaveBeenCalledTimes(1);
    expect(onApplyTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'software-dev',
        color: 'violet',
        icon: '💻',
      }),
    );
  });

  it('should provide accessible names on every template button', () => {
    // Arrange
    const onApplyTemplate = vi.fn();

    // Act
    render(
      <ProjectEmptyState
        onApplyTemplate={onApplyTemplate}
        locale="en"
      />,
    );

    // Assert
    for (const template of STARTER_TEMPLATES) {
      const button = screen.getByTestId(`starter-template-${template.id}`);
      expect(button.getAttribute('aria-label')).toBeTruthy();
    }
  });

  it('should fall back to default English locale when locale prop is not specified', () => {
    // Arrange
    const onApplyTemplate = vi.fn();

    // Act
    render(
      <ProjectEmptyState
        onApplyTemplate={onApplyTemplate}
      />,
    );

    // Assert
    const consultingBtn = screen.getByTestId('starter-template-client-consulting');
    expect(consultingBtn.getAttribute('aria-label')).toContain('Client Consulting');
  });
});
