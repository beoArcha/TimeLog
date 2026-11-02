// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ProjectEmptyState } from '@/src/layouts/parts/ProjectEmptyState';
import { STARTER_TEMPLATES } from '@common/templates/starterTemplates';

const FLOW_CONTENT_SELECTOR = [
  'address', 'article', 'aside', 'blockquote', 'details', 'dialog', 'div', 'dl',
  'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'hr', 'main', 'menu', 'nav', 'ol', 'p', 'pre', 'search',
  'section', 'table', 'ul',
].join(', ');

function expectNoFlowContent(container: Element) {
  const invalidElements = Array.from(container.querySelectorAll(FLOW_CONTENT_SELECTOR))
    .map((element) => element.tagName.toLowerCase());

  expect(invalidElements).toEqual([]);
}

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
