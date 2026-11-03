// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Checkbox } from '@components/ui/checkbox';
import { Label } from '@components/ui/label';
import { HStack, VStack } from '@components/ui/stack';
import { Caption, Heading, Text } from '@components/ui/typography';
import { expectNoFlowContent, FLOW_CONTENT_SELECTOR } from '@tests/shared/html-content-model';

describe('Design System phrasing-content compositions', () => {
  afterEach(() => cleanup());

  it('includes standard flow/block elements in FLOW_CONTENT_SELECTOR', () => {
    const requiredTags = ['div', 'p', 'ul', 'ol', 'li', 'section', 'article', 'table'];
    for (const tag of requiredTags) {
      expect(FLOW_CONTENT_SELECTOR).toContain(tag);
    }
  });

  it('keeps Heading children within the heading phrasing-content model', () => {
    render(
      <Heading level={2} data-testid="semantic-heading">
        <HStack as="span" gap="sm">
          <span aria-hidden="true">★</span>
          <span>Settings</span>
        </HStack>
      </Heading>
    );

    expectNoFlowContent(screen.getByTestId('semantic-heading'));
  });

  it('keeps Label children within the label phrasing-content model and binds accessible name/description via aria attributes', () => {
    render(
      <Label htmlFor="reset-scope" data-testid="semantic-label">
        <Checkbox
          id="reset-scope"
          aria-labelledby="reset-scope-title"
          aria-describedby="reset-scope-desc"
        />
        <VStack as="span" gap="none" className="flex flex-col">
          <Text id="reset-scope-title" as="span">Reset all data</Text>
          <Caption id="reset-scope-desc" as="span">This action cannot be undone.</Caption>
        </VStack>
      </Label>
    );

    expectNoFlowContent(screen.getByTestId('semantic-label'));

    // Accessible name is strictly the title, not concatenated with description
    const checkbox = screen.getByRole('checkbox', { name: 'Reset all data' }) as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    expect(checkbox.getAttribute('aria-labelledby')).toBe('reset-scope-title');
    expect(checkbox.getAttribute('aria-describedby')).toBe('reset-scope-desc');

    const titleEl = screen.getByText('Reset all data');
    const descEl = screen.getByText('This action cannot be undone.');
    expect(titleEl.id).toBe('reset-scope-title');
    expect(descEl.id).toBe('reset-scope-desc');
  });
});
