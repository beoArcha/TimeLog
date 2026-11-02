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
  | 'transparent';

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
    selfCategory: 'phrasing',
    allowedChildCategories: ['phrasing', 'transparent'],
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table'],
  },
  Grid: {
    name: 'Grid',
    category: 'layout',
    defaultTag: 'div',
    supportedAs: ['div', 'section', 'article', 'ul', 'ol'],
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
    selfCategory: 'phrasing',
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
 * Computes the effective content category for a component, taking into account
 * polymorphic overrides (e.g. Text as="span" is phrasing, while default as="p" is flow).
 */
export function getEffectiveContentCategory(
  metadata: ComponentMetadata,
  asProp?: string
): ContentCategory {
  if ((metadata.name === 'Text' || metadata.name === 'Caption') && asProp === 'span') {
    return 'phrasing';
  }
  return metadata.selfCategory;
}
