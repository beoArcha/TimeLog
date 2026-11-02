// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Checkbox } from '@components/ui/checkbox';
import { Label } from '@components/ui/label';
import { HStack, VStack } from '@components/ui/stack';
import { Caption, Heading, Text } from '@components/ui/typography';

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

describe('Design System phrasing-content compositions', () => {
  afterEach(() => cleanup());

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

  it('keeps Label children within the label phrasing-content model', () => {
    render(
      <Label htmlFor="reset-scope" data-testid="semantic-label">
        <Checkbox id="reset-scope" />
        <VStack as="span" gap="none" className="flex flex-col">
          <Text as="span">Reset all data</Text>
          <Caption as="span">This action cannot be undone.</Caption>
        </VStack>
      </Label>
    );

    expectNoFlowContent(screen.getByTestId('semantic-label'));
    expect(screen.getByRole('checkbox', {
      name: /Reset all data This action cannot be undone/,
    })).toBeTruthy();
  });
});
