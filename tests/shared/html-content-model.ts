import { expect } from 'vitest';

/**
 * Common block/flow elements that should not be nested inside phrasing-only contexts
 * (such as headings, labels, buttons).
 */
export const FLOW_CONTENT_SELECTOR = [
  'div',
  'p',
  'ul',
  'ol',
  'li',
  'table',
  'section',
  'article',
  'header',
  'footer',
  'nav',
  'main',
].join(', ');

/**
 * Asserts that the provided DOM element contains no flow-content elements,
 * ensuring strict adherence to the HTML5 phrasing-content model.
 */
export function expectNoFlowContent(container: Element): void {
  const invalidElements = Array.from(container.querySelectorAll(FLOW_CONTENT_SELECTOR))
    .map((element) => element.tagName.toLowerCase());

  expect(invalidElements).toEqual([]);
}
