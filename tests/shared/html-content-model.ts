import { expect } from 'vitest';

/**
 * HTML5 Flow Content elements that are NOT phrasing content and therefore
 * forbidden inside phrasing-only contexts (such as <button>, <label>, headings, <p>).
 *
 * Expanded with flow-only block and structural elements such as hgroup, li, dt, dd, summary,
 * div, p, lists, tables, sections, forms, and dialogs.
 */
export const FLOW_CONTENT_SELECTOR = [
  'address',
  'article',
  'aside',
  'blockquote',
  'details',
  'dialog',
  'div',
  'dl',
  'dt',
  'dd',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'li',
  'main',
  'menu',
  'nav',
  'ol',
  'p',
  'pre',
  'search',
  'section',
  'summary',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'ul',
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
