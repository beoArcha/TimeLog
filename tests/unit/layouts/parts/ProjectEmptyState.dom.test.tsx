// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ProjectEmptyState } from '@/src/layouts/parts/ProjectEmptyState';
import { STARTER_TEMPLATES } from '@common/templates/starterTemplates';

describe('ProjectEmptyState DOM content model', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('asserts template buttons do not contain any <div> or <p> block elements', () => {
    const onApplyTemplate = vi.fn();
    render(<ProjectEmptyState onApplyTemplate={onApplyTemplate} locale="en" />);

    for (const template of STARTER_TEMPLATES) {
      const button = screen.getByTestId(`starter-template-${template.id}`);
      const blockElements = button.querySelectorAll('div, p');
      expect(blockElements.length).toBe(0);
    }
  });
});
