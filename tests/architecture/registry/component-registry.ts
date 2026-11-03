/**
 * Component Metadata Registry for Design System architectural validation.
 * Defines content categories, component specifications, default HTML tags,
 * supported polymorphic 'as' tags, and child category/tag constraints.
 */

export type ContentCategory =
  | 'flow'
  | 'phrasing'
  | 'heading'
  | 'sectioning'
  | 'interactive'
  | 'embedded'
  | 'table-structure'
  | 'form-option'
  | 'transparent'
  | 'text';

export type ComponentCategory =
  | 'layout'
  | 'typography'
  | 'inline'
  | 'form'
  | 'surface'
  | 'table'
  | 'feedback'
  | 'interactive';

export interface ComponentMetadata {
  name: string;
  category: ComponentCategory;
  defaultTag: string;
  supportedAs?: string[];
  selfCategory: ContentCategory;
  allowedChildCategories: ContentCategory[];
  allowedChildTags?: string[];
  forbiddenChildTags?: string[];
}

export const COMPONENT_REGISTRY: Record<string, ComponentMetadata> = {
  // Layout
  VStack: {
    name: 'VStack',
    category: 'layout',
    defaultTag: 'div',
    supportedAs: ['div', 'span', 'header', 'footer', 'section', 'nav', 'main', 'aside', 'ul', 'ol', 'li'],
    selfCategory: 'flow',
    allowedChildCategories: ['flow', 'phrasing', 'transparent'],
  },
  HStack: {
    name: 'HStack',
    category: 'layout',
    defaultTag: 'div',
    supportedAs: ['div', 'span', 'header', 'footer', 'section', 'nav', 'main', 'aside', 'ul', 'ol', 'li'],
    selfCategory: 'flow',
    allowedChildCategories: ['flow', 'phrasing', 'transparent'],
  },
  InlineCluster: {
    name: 'InlineCluster',
    category: 'layout',
    defaultTag: 'div',
    supportedAs: ['div', 'span'],
    selfCategory: 'flow',
    allowedChildCategories: ['phrasing', 'flow', 'transparent'],
  },
  Grid: {
    name: 'Grid',
    category: 'layout',
    defaultTag: 'div',
    supportedAs: ['div', 'section', 'article'],
    selfCategory: 'flow',
    allowedChildCategories: ['flow', 'phrasing', 'transparent'],
  },
  Area: {
    name: 'Area',
    category: 'layout',
    defaultTag: 'div',
    supportedAs: ['aside', 'section', 'article', 'nav', 'header', 'footer', 'main', 'div'],
    selfCategory: 'flow',
    allowedChildCategories: ['flow', 'phrasing', 'transparent'],
  },

  // Typography
  Heading: {
    name: 'Heading',
    category: 'typography',
    defaultTag: 'h2',
    supportedAs: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    selfCategory: 'heading',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  Text: {
    name: 'Text',
    category: 'typography',
    defaultTag: 'p',
    supportedAs: ['p', 'span', 'div', 'small', 'strong', 'label'],
    selfCategory: 'flow',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  Caption: {
    name: 'Caption',
    category: 'typography',
    defaultTag: 'p',
    supportedAs: ['p', 'span'],
    selfCategory: 'flow',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  Overline: {
    name: 'Overline',
    category: 'typography',
    defaultTag: 'span',
    supportedAs: ['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'small', 'strong', 'label'],
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  MonoText: {
    name: 'MonoText',
    category: 'typography',
    defaultTag: 'span',
    supportedAs: ['span', 'p', 'div', 'small', 'strong', 'label'],
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  MetricText: {
    name: 'MetricText',
    category: 'typography',
    defaultTag: 'span',
    supportedAs: ['span', 'p', 'div', 'small', 'strong', 'label'],
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  List: {
    name: 'List',
    category: 'typography',
    defaultTag: 'ul',
    supportedAs: ['ul', 'ol'],
    selfCategory: 'flow',
    allowedChildCategories: ['flow', 'phrasing', 'transparent'],
  },
  ListItem: {
    name: 'ListItem',
    category: 'typography',
    defaultTag: 'li',
    supportedAs: ['li'],
    selfCategory: 'flow',
    allowedChildCategories: ['flow', 'phrasing', 'transparent'],
  },

  // Inline
  Badge: {
    name: 'Badge',
    category: 'inline',
    defaultTag: 'div',
    supportedAs: ['div', 'span'],
    selfCategory: 'flow',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  StatusDot: {
    name: 'StatusDot',
    category: 'inline',
    defaultTag: 'span',
    selfCategory: 'phrasing',
    allowedChildCategories: [],
  },
  Strong: {
    name: 'Strong',
    category: 'inline',
    defaultTag: 'strong',
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  Em: {
    name: 'Em',
    category: 'inline',
    defaultTag: 'em',
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  Mark: {
    name: 'Mark',
    category: 'inline',
    defaultTag: 'mark',
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  Del: {
    name: 'Del',
    category: 'inline',
    defaultTag: 'del',
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  Ins: {
    name: 'Ins',
    category: 'inline',
    defaultTag: 'ins',
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  Abbr: {
    name: 'Abbr',
    category: 'inline',
    defaultTag: 'abbr',
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  Code: {
    name: 'Code',
    category: 'inline',
    defaultTag: 'code',
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  Kbd: {
    name: 'Kbd',
    category: 'inline',
    defaultTag: 'kbd',
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
  },

  // Interactive / Form
  Button: {
    name: 'Button',
    category: 'interactive',
    defaultTag: 'button',
    selfCategory: 'interactive',
    allowedChildCategories: ['phrasing', 'transparent'],
    forbiddenChildTags: [
      'Button',
      'button',
      'Input',
      'input',
      'Select',
      'NativeSelect',
      'select',
      'textarea',
    ],
  },
  Label: {
    name: 'Label',
    category: 'form',
    defaultTag: 'label',
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  NativeSelect: {
    name: 'NativeSelect',
    category: 'form',
    defaultTag: 'select',
    selfCategory: 'interactive',
    allowedChildCategories: ['form-option', 'transparent'],
  },
  NativeOption: {
    name: 'NativeOption',
    category: 'form',
    defaultTag: 'option',
    selfCategory: 'form-option',
    allowedChildCategories: ['text'],
  },
  NativeOptGroup: {
    name: 'NativeOptGroup',
    category: 'form',
    defaultTag: 'optgroup',
    selfCategory: 'form-option',
    allowedChildCategories: ['form-option', 'transparent'],
  },

  // Table
  Table: {
    name: 'Table',
    category: 'table',
    defaultTag: 'table',
    selfCategory: 'flow',
    allowedChildCategories: ['table-structure', 'transparent'],
  },
  TableHeader: {
    name: 'TableHeader',
    category: 'table',
    defaultTag: 'thead',
    selfCategory: 'table-structure',
    allowedChildCategories: ['table-structure', 'transparent'],
  },
  TableBody: {
    name: 'TableBody',
    category: 'table',
    defaultTag: 'tbody',
    selfCategory: 'table-structure',
    allowedChildCategories: ['table-structure', 'transparent'],
  },
  TableFooter: {
    name: 'TableFooter',
    category: 'table',
    defaultTag: 'tfoot',
    selfCategory: 'table-structure',
    allowedChildCategories: ['table-structure', 'transparent'],
  },
  TableRow: {
    name: 'TableRow',
    category: 'table',
    defaultTag: 'tr',
    selfCategory: 'table-structure',
    allowedChildCategories: ['table-structure', 'transparent'],
  },
  TableHead: {
    name: 'TableHead',
    category: 'table',
    defaultTag: 'th',
    selfCategory: 'table-structure',
    allowedChildCategories: ['phrasing', 'flow', 'transparent'],
  },
  TableCell: {
    name: 'TableCell',
    category: 'table',
    defaultTag: 'td',
    selfCategory: 'table-structure',
    allowedChildCategories: ['phrasing', 'flow', 'transparent'],
  },
};

/**
 * Retrieves component metadata from the registry by component name.
 */
export function getComponentMetadata(tag: string): ComponentMetadata | undefined {
  return COMPONENT_REGISTRY[tag];
}

/**
 * Checks whether the given tag is a registered Design System component.
 */
export function isDesignSystemComponent(tag: string): boolean {
  return tag in COMPONENT_REGISTRY;
}

/**
 * Canonical mapping of standard native HTML elements to their HTML content categories.
 * Contains only elements relevant to application JSX validation.
 */
export const HTML_ELEMENT_CATEGORY_MAP: Readonly<Record<string, ContentCategory>> = {
  // Flow containers / block elements
  div: 'flow',
  p: 'flow',
  ul: 'flow',
  ol: 'flow',
  li: 'flow',
  header: 'flow',
  footer: 'flow',
  main: 'flow',
  form: 'flow',
  table: 'flow',
  pre: 'flow',
  blockquote: 'flow',
  details: 'flow',
  dialog: 'flow',
  search: 'flow',
  menu: 'flow',

  // Sectioning content
  article: 'sectioning',
  aside: 'sectioning',
  nav: 'sectioning',
  section: 'sectioning',

  // Phrasing content
  span: 'phrasing',
  strong: 'phrasing',
  em: 'phrasing',
  code: 'phrasing',
  kbd: 'phrasing',
  label: 'phrasing',
  b: 'phrasing',
  i: 'phrasing',
  small: 'phrasing',
  mark: 'phrasing',
  del: 'phrasing',
  ins: 'phrasing',
  abbr: 'phrasing',
  time: 'phrasing',
  summary: 'phrasing',
  br: 'phrasing',

  // Heading content
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',

  // Interactive content
  a: 'interactive',
  button: 'interactive',
  input: 'interactive',
  select: 'interactive',
  textarea: 'interactive',

  // Embedded content
  img: 'embedded',
  svg: 'embedded',
  canvas: 'embedded',
  video: 'embedded',
  audio: 'embedded',
  iframe: 'embedded',

  // Form options
  option: 'form-option',
  optgroup: 'form-option',

  // Table structure
  thead: 'table-structure',
  tbody: 'table-structure',
  tfoot: 'table-structure',
  tr: 'table-structure',
  th: 'table-structure',
  td: 'table-structure',
  caption: 'table-structure',
};

/**
 * Context-restricted elements that can only be placed as direct children of specific parents.
 * Covers essential structural relationships: lists, tables, and select structures.
 */
export const CONTEXT_RESTRICTED_ELEMENTS: Readonly<Record<string, readonly string[]>> = {
  // Lists
  li: ['ul', 'ol', 'menu', 'List'],
  ListItem: ['ul', 'ol', 'menu', 'List'],

  // Tables
  caption: ['table', 'Table'],
  TableCaption: ['table', 'Table'],
  thead: ['table', 'Table'],
  tbody: ['table', 'Table'],
  tfoot: ['table', 'Table'],
  tr: ['table', 'thead', 'tbody', 'tfoot', 'Table', 'TableHeader', 'TableBody', 'TableFooter'],
  TableRow: ['table', 'thead', 'tbody', 'tfoot', 'Table', 'TableHeader', 'TableBody', 'TableFooter'],
  th: ['tr', 'TableRow'],
  td: ['tr', 'TableRow'],
  TableCell: ['tr', 'TableRow'],
  TableHead: ['tr', 'TableRow'],

  // Select / Option
  optgroup: ['select', 'NativeSelect'],
  NativeOptGroup: ['select', 'NativeSelect'],
  option: ['select', 'NativeSelect', 'optgroup', 'NativeOptGroup'],
  NativeOption: ['select', 'NativeSelect', 'optgroup', 'NativeOptGroup'],
};

/**
 * Returns parent tags that are permitted for a context-restricted element, or undefined if unrestricted.
 */
export function getContextRestrictedParents(tag: string): readonly string[] | undefined {
  return CONTEXT_RESTRICTED_ELEMENTS[tag];
}

/**
 * Returns restricted children for a parent tag, derived from the canonical child-to-parent map.
 */
export function getContextRestrictedChildren(tag: string): string[] | undefined {
  const children = Object.entries(CONTEXT_RESTRICTED_ELEMENTS)
    .filter(([, allowedParents]) => allowedParents.includes(tag))
    .map(([child]) => child);

  return children.length > 0 ? children : undefined;
}

/**
 * Structural and content category constraints derived directly from native HTML elements.
 * Focused on essential architectural rules: list structures, phrasing-only containers, tables, and selects.
 */
export interface ElementConstraints {
  allowedChildCategories?: ContentCategory[];
  allowedChildTags?: string[];
  forbiddenChildTags?: string[];
}

export const HTML_ELEMENT_CONSTRAINTS: Readonly<Record<string, ElementConstraints>> = {
  // Phrasing-only containers (block elements forbidden by phrasing category)
  span: {
    allowedChildCategories: ['phrasing', 'transparent', 'text'],
  },

  // Restrict selected nested form controls; this is not a complete interactive-content validator.
  button: {
    allowedChildCategories: ['phrasing', 'transparent'],
    forbiddenChildTags: [
      'button',
      'Button',
      'input',
      'Input',
      'select',
      'NativeSelect',
      'textarea',
    ],
  },

  // Structural child tags are derived from CONTEXT_RESTRICTED_ELEMENTS.
  table: { allowedChildCategories: ['table-structure', 'transparent'] },
  thead: { allowedChildCategories: ['table-structure', 'transparent'] },
  tbody: { allowedChildCategories: ['table-structure', 'transparent'] },
  tfoot: { allowedChildCategories: ['table-structure', 'transparent'] },
  tr: { allowedChildCategories: ['table-structure', 'transparent'] },
  select: { allowedChildCategories: ['form-option', 'transparent'] },
  optgroup: { allowedChildCategories: ['form-option', 'transparent'] },
  option: {
    allowedChildCategories: ['text'],
  },
};

/**
 * Returns the structural/content constraints of a native HTML element tag, or undefined if unconstrained.
 */
export function getHtmlElementConstraints(tag: string): ElementConstraints | undefined {
  return HTML_ELEMENT_CONSTRAINTS[tag.toLowerCase()];
}

/**
 * Returns the content category of a native HTML element tag, or undefined if unknown.
 */
export function getNativeHtmlElementCategory(tag: string): ContentCategory | undefined {
  return HTML_ELEMENT_CATEGORY_MAP[tag.toLowerCase()];
}

/**
 * Computes the effective content category for a component, taking into account
 * polymorphic overrides (e.g. Text as=\"span\" is phrasing, while default as=\"p\" is flow).
 * When asProp is 'dynamic', the effective category cannot be determined statically
 * and remains undefined to avoid assuming default component tags.
 */
export function getEffectiveContentCategory(
  metadata: ComponentMetadata,
  asProp?: string
): ContentCategory | undefined {
  if (asProp === 'dynamic') {
    return undefined;
  }
  if (asProp) {
    return getNativeHtmlElementCategory(asProp) ?? metadata.selfCategory;
  }
  return metadata.selfCategory;
}
