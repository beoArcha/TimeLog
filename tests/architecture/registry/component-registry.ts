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
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table'],
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
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table', 'p', 'Text'],
  },
  Text: {
    name: 'Text',
    category: 'typography',
    defaultTag: 'p',
    supportedAs: ['p', 'span', 'div', 'small', 'strong', 'label'],
    selfCategory: 'flow',
    allowedChildCategories: ['phrasing', 'transparent'],
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table', 'p'],
  },
  Caption: {
    name: 'Caption',
    category: 'typography',
    defaultTag: 'p',
    supportedAs: ['p', 'span'],
    selfCategory: 'flow',
    allowedChildCategories: ['phrasing', 'transparent'],
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table', 'p'],
  },
  Overline: {
    name: 'Overline',
    category: 'typography',
    defaultTag: 'span',
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  MonoText: {
    name: 'MonoText',
    category: 'typography',
    defaultTag: 'span',
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
  },
  MetricText: {
    name: 'MetricText',
    category: 'typography',
    defaultTag: 'span',
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
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
      'div',
      'VStack',
      'HStack',
      'Grid',
      'Area',
      'Table',
    ],
  },
  Label: {
    name: 'Label',
    category: 'form',
    defaultTag: 'label',
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table', 'p', 'Text'],
  },
  NativeSelect: {
    name: 'NativeSelect',
    category: 'form',
    defaultTag: 'select',
    selfCategory: 'interactive',
    allowedChildCategories: ['form-option', 'transparent'],
    allowedChildTags: ['option', 'optgroup', 'NativeOption', 'NativeOptGroup'],
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
    allowedChildTags: ['option', 'NativeOption'],
    forbiddenChildTags: [
      'div',
      'VStack',
      'HStack',
      'Grid',
      'Area',
      'Table',
      'p',
      'Text',
      'Heading',
      'Button',
      'NativeSelect',
      'NativeOptGroup',
      'optgroup',
      'select',
    ],
  },

  // Table
  Table: {
    name: 'Table',
    category: 'table',
    defaultTag: 'table',
    selfCategory: 'flow',
    allowedChildCategories: ['table-structure', 'transparent'],
    allowedChildTags: [
      'TableHeader',
      'TableBody',
      'TableFooter',
      'TableCaption',
      'thead',
      'tbody',
      'tfoot',
      'caption',
    ],
  },
  TableHeader: {
    name: 'TableHeader',
    category: 'table',
    defaultTag: 'thead',
    selfCategory: 'table-structure',
    allowedChildCategories: ['table-structure', 'transparent'],
    allowedChildTags: ['TableRow', 'tr'],
  },
  TableBody: {
    name: 'TableBody',
    category: 'table',
    defaultTag: 'tbody',
    selfCategory: 'table-structure',
    allowedChildCategories: ['table-structure', 'transparent'],
    allowedChildTags: ['TableRow', 'tr'],
  },
  TableFooter: {
    name: 'TableFooter',
    category: 'table',
    defaultTag: 'tfoot',
    selfCategory: 'table-structure',
    allowedChildCategories: ['table-structure', 'transparent'],
    allowedChildTags: ['TableRow', 'tr'],
  },
  TableRow: {
    name: 'TableRow',
    category: 'table',
    defaultTag: 'tr',
    selfCategory: 'table-structure',
    allowedChildCategories: ['table-structure', 'transparent'],
    allowedChildTags: ['TableCell', 'TableHead', 'td', 'th'],
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
 * Canonical mapping of standard native HTML elements to their HTML5 content categories.
 * Independent of the Design System component registry.
 */
export const HTML_ELEMENT_CATEGORY_MAP: Readonly<Record<string, ContentCategory>> = {
  // Flow containers / block elements
  div: 'flow',
  p: 'flow',
  ul: 'flow',
  ol: 'flow',
  li: 'flow',
  dl: 'flow',
  dt: 'flow',
  dd: 'flow',
  header: 'flow',
  footer: 'flow',
  main: 'flow',
  figure: 'flow',
  figcaption: 'flow',
  blockquote: 'flow',
  pre: 'flow',
  hr: 'flow',
  address: 'flow',
  form: 'flow',
  fieldset: 'flow',
  legend: 'flow',
  table: 'flow',

  // Phrasing content
  span: 'phrasing',
  strong: 'phrasing',
  em: 'phrasing',
  mark: 'phrasing',
  del: 'phrasing',
  ins: 'phrasing',
  abbr: 'phrasing',
  code: 'phrasing',
  kbd: 'phrasing',
  label: 'phrasing',
  b: 'phrasing',
  i: 'phrasing',
  u: 'phrasing',
  s: 'phrasing',
  small: 'phrasing',
  sub: 'phrasing',
  sup: 'phrasing',
  cite: 'phrasing',
  q: 'phrasing',
  time: 'phrasing',
  var: 'phrasing',
  samp: 'phrasing',
  bdo: 'phrasing',
  bdi: 'phrasing',
  wbr: 'phrasing',
  br: 'phrasing',

  // Heading content
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
  hgroup: 'heading',

  // Sectioning content
  article: 'sectioning',
  aside: 'sectioning',
  nav: 'sectioning',
  section: 'sectioning',

  // Interactive content
  a: 'interactive',
  button: 'interactive',
  input: 'interactive',
  select: 'interactive',
  textarea: 'interactive',
  details: 'interactive',
  summary: 'interactive',

  // Embedded content
  img: 'embedded',
  video: 'embedded',
  audio: 'embedded',
  canvas: 'embedded',
  svg: 'embedded',
  iframe: 'embedded',
  embed: 'embedded',
  object: 'embedded',
  picture: 'embedded',

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
  colgroup: 'table-structure',
  col: 'table-structure',
};

/**
 * Returns the content category of a native HTML element tag, or undefined if unknown.
 */
export function getNativeHtmlElementCategory(tag: string): ContentCategory | undefined {
  return HTML_ELEMENT_CATEGORY_MAP[tag.toLowerCase()];
}

/**
 * Computes the effective content category for a component, taking into account
 * polymorphic overrides (e.g. Text as="span" is phrasing, while default as="p" is flow).
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
  if (
    (metadata.name === 'Text' ||
      metadata.name === 'Caption' ||
      metadata.name === 'Badge' ||
      metadata.name === 'InlineCluster') &&
    asProp === 'span'
  ) {
    return 'phrasing';
  }
  return metadata.selfCategory;
}
