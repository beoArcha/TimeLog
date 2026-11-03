// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, vi, afterEach } from 'vitest';
import { ProjectEmptyState } from '@/src/layouts/parts/ProjectEmptyState';
import { STARTER_TEMPLATES } from '@common/templates/starterTemplates';
import { expectNoFlowContent } from '@tests/shared/html-content-model';

describe('ProjectEmptyState DOM content model', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders phrasing-only content inside every starter template button', () => {
    const onApplyTemplate = vi.fn();
    render(<ProjectEmptyState onApplyTemplate={onApplyTemplate} locale="en" />);

    for (const template of STARTER_TEMPLATES) {
      expectNoFlowContent(screen.getByTestId(`starter-template-${template.id}`));
    }
  });
});
