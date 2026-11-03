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
  | 'text'
  | 'metadata';

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
    allowedChildTags: ['li', 'ListItem'],
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
  table: 'flow',
  menu: 'flow',
  dialog: 'flow',
  search: 'flow',
  details: 'flow', // Flow content / sectioning root (not phrasing)

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
  data: 'phrasing',
  dfn: 'phrasing',
  output: 'phrasing',
  progress: 'phrasing',
  meter: 'phrasing',
  ruby: 'phrasing',
  rt: 'phrasing',
  rp: 'phrasing',
  datalist: 'phrasing',
  legend: 'phrasing', // Phrasing content (context-restricted to fieldset)
  summary: 'phrasing', // Phrasing content (context-restricted to details)
  map: 'phrasing',
  area: 'phrasing',

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
  source: 'embedded',
  track: 'embedded',
  math: 'embedded',

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

  // Transparent / Supporting
  template: 'transparent',
  slot: 'transparent',
  script: 'phrasing',
  noscript: 'phrasing',

  // Document & Metadata
  html: 'flow',
  body: 'flow',
  head: 'metadata',
  title: 'metadata',
  base: 'metadata',
  meta: 'metadata',
  link: 'metadata',
  style: 'metadata',
};

/**
 * Detailed HTML5 element specification distinguishing primary category,
 * multiple content categories, interactive behavior, embedded content,
 * metadata status, and context restrictions.
 */
export interface HtmlElementDefinition {
  tag: string;
  category: ContentCategory;
  categories: readonly ContentCategory[];
  isInteractive?: boolean;
  isEmbedded?: boolean;
  isMetadata?: boolean;
  allowedParents?: readonly string[];
}

/**
 * Registry of HTML5 element definitions capturing multi-category membership,
 * interactive traits, embedded content, and parent context restrictions.
 */
export const HTML_ELEMENT_DEFINITIONS: Readonly<Record<string, HtmlElementDefinition>> = {
  // Document Structure
  html: { tag: 'html', category: 'flow', categories: [], allowedParents: [] },
  head: { tag: 'head', category: 'metadata', categories: ['metadata'], isMetadata: true, allowedParents: ['html'] },
  body: { tag: 'body', category: 'flow', categories: ['flow'], allowedParents: ['html'] },

  // Metadata elements
  title: { tag: 'title', category: 'metadata', categories: ['metadata'], isMetadata: true, allowedParents: ['head'] },
  base: { tag: 'base', category: 'metadata', categories: ['metadata'], isMetadata: true, allowedParents: ['head'] },
  meta: { tag: 'meta', category: 'metadata', categories: ['metadata'], isMetadata: true, allowedParents: ['head'] },
  link: { tag: 'link', category: 'metadata', categories: ['metadata'], isMetadata: true, allowedParents: ['head'] },
  style: { tag: 'style', category: 'metadata', categories: ['metadata'], isMetadata: true, allowedParents: ['head'] },
  script: { tag: 'script', category: 'phrasing', categories: ['metadata', 'flow', 'phrasing'] },
  noscript: { tag: 'noscript', category: 'phrasing', categories: ['metadata', 'flow', 'phrasing'] },

  // Flow Containers
  div: { tag: 'div', category: 'flow', categories: ['flow'] },
  p: { tag: 'p', category: 'flow', categories: ['flow'] },
  ul: { tag: 'ul', category: 'flow', categories: ['flow'] },
  ol: { tag: 'ol', category: 'flow', categories: ['flow'] },
  li: { tag: 'li', category: 'flow', categories: ['flow'], allowedParents: ['ul', 'ol', 'menu', 'List'] },
  dl: { tag: 'dl', category: 'flow', categories: ['flow'] },
  dt: { tag: 'dt', category: 'flow', categories: ['flow'], allowedParents: ['dl'] },
  dd: { tag: 'dd', category: 'flow', categories: ['flow'], allowedParents: ['dl'] },
  header: { tag: 'header', category: 'flow', categories: ['flow'] },
  footer: { tag: 'footer', category: 'flow', categories: ['flow'] },
  main: { tag: 'main', category: 'flow', categories: ['flow'] },
  figure: { tag: 'figure', category: 'flow', categories: ['flow'] },
  figcaption: { tag: 'figcaption', category: 'flow', categories: ['flow'], allowedParents: ['figure'] },
  blockquote: { tag: 'blockquote', category: 'flow', categories: ['flow'] },
  pre: { tag: 'pre', category: 'flow', categories: ['flow'] },
  hr: { tag: 'hr', category: 'flow', categories: ['flow'] },
  address: { tag: 'address', category: 'flow', categories: ['flow'] },
  form: { tag: 'form', category: 'flow', categories: ['flow'] },
  fieldset: { tag: 'fieldset', category: 'flow', categories: ['flow'] },
  menu: { tag: 'menu', category: 'flow', categories: ['flow'] },
  dialog: { tag: 'dialog', category: 'flow', categories: ['flow'] },
  search: { tag: 'search', category: 'flow', categories: ['flow'] },
  table: { tag: 'table', category: 'flow', categories: ['flow'] },
  details: { tag: 'details', category: 'flow', categories: ['flow', 'interactive'], isInteractive: true },

  // Sectioning
  article: { tag: 'article', category: 'sectioning', categories: ['sectioning', 'flow'] },
  aside: { tag: 'aside', category: 'sectioning', categories: ['sectioning', 'flow'] },
  nav: { tag: 'nav', category: 'sectioning', categories: ['sectioning', 'flow'] },
  section: { tag: 'section', category: 'sectioning', categories: ['sectioning', 'flow'] },

  // Heading
  h1: { tag: 'h1', category: 'heading', categories: ['heading', 'flow'] },
  h2: { tag: 'h2', category: 'heading', categories: ['heading', 'flow'] },
  h3: { tag: 'h3', category: 'heading', categories: ['heading', 'flow'] },
  h4: { tag: 'h4', category: 'heading', categories: ['heading', 'flow'] },
  h5: { tag: 'h5', category: 'heading', categories: ['heading', 'flow'] },
  h6: { tag: 'h6', category: 'heading', categories: ['heading', 'flow'] },
  hgroup: { tag: 'hgroup', category: 'heading', categories: ['heading', 'flow'] },

  // Phrasing
  span: { tag: 'span', category: 'phrasing', categories: ['phrasing', 'flow'] },
  strong: { tag: 'strong', category: 'phrasing', categories: ['phrasing', 'flow'] },
  em: { tag: 'em', category: 'phrasing', categories: ['phrasing', 'flow'] },
  mark: { tag: 'mark', category: 'phrasing', categories: ['phrasing', 'flow'] },
  del: { tag: 'del', category: 'phrasing', categories: ['phrasing', 'flow'] },
  ins: { tag: 'ins', category: 'phrasing', categories: ['phrasing', 'flow'] },
  abbr: { tag: 'abbr', category: 'phrasing', categories: ['phrasing', 'flow'] },
  code: { tag: 'code', category: 'phrasing', categories: ['phrasing', 'flow'] },
  kbd: { tag: 'kbd', category: 'phrasing', categories: ['phrasing', 'flow'] },
  b: { tag: 'b', category: 'phrasing', categories: ['phrasing', 'flow'] },
  i: { tag: 'i', category: 'phrasing', categories: ['phrasing', 'flow'] },
  u: { tag: 'u', category: 'phrasing', categories: ['phrasing', 'flow'] },
  s: { tag: 's', category: 'phrasing', categories: ['phrasing', 'flow'] },
  small: { tag: 'small', category: 'phrasing', categories: ['phrasing', 'flow'] },
  sub: { tag: 'sub', category: 'phrasing', categories: ['phrasing', 'flow'] },
  sup: { tag: 'sup', category: 'phrasing', categories: ['phrasing', 'flow'] },
  cite: { tag: 'cite', category: 'phrasing', categories: ['phrasing', 'flow'] },
  q: { tag: 'q', category: 'phrasing', categories: ['phrasing', 'flow'] },
  time: { tag: 'time', category: 'phrasing', categories: ['phrasing', 'flow'] },
  var: { tag: 'var', category: 'phrasing', categories: ['phrasing', 'flow'] },
  samp: { tag: 'samp', category: 'phrasing', categories: ['phrasing', 'flow'] },
  bdo: { tag: 'bdo', category: 'phrasing', categories: ['phrasing', 'flow'] },
  bdi: { tag: 'bdi', category: 'phrasing', categories: ['phrasing', 'flow'] },
  wbr: { tag: 'wbr', category: 'phrasing', categories: ['phrasing', 'flow'] },
  br: { tag: 'br', category: 'phrasing', categories: ['phrasing', 'flow'] },
  data: { tag: 'data', category: 'phrasing', categories: ['phrasing', 'flow'] },
  dfn: { tag: 'dfn', category: 'phrasing', categories: ['phrasing', 'flow'] },
  output: { tag: 'output', category: 'phrasing', categories: ['phrasing', 'flow'] },
  progress: { tag: 'progress', category: 'phrasing', categories: ['phrasing', 'flow'] },
  meter: { tag: 'meter', category: 'phrasing', categories: ['phrasing', 'flow'] },
  ruby: { tag: 'ruby', category: 'phrasing', categories: ['phrasing', 'flow'] },
  rt: { tag: 'rt', category: 'phrasing', categories: ['phrasing'], allowedParents: ['ruby'] },
  rp: { tag: 'rp', category: 'phrasing', categories: ['phrasing'], allowedParents: ['ruby'] },
  datalist: { tag: 'datalist', category: 'phrasing', categories: ['phrasing', 'flow'] },
  map: { tag: 'map', category: 'phrasing', categories: ['phrasing', 'flow'] },
  area: { tag: 'area', category: 'phrasing', categories: ['phrasing'], allowedParents: ['map'] },
  legend: { tag: 'legend', category: 'phrasing', categories: ['phrasing'], allowedParents: ['fieldset'] },
  summary: { tag: 'summary', category: 'phrasing', categories: ['phrasing'], allowedParents: ['details'] },

  // Interactive content (also phrasing and flow)
  a: { tag: 'a', category: 'interactive', categories: ['interactive', 'phrasing', 'flow'], isInteractive: true },
  button: { tag: 'button', category: 'interactive', categories: ['interactive', 'phrasing', 'flow'], isInteractive: true },
  input: { tag: 'input', category: 'interactive', categories: ['interactive', 'phrasing', 'flow'], isInteractive: true },
  select: { tag: 'select', category: 'interactive', categories: ['interactive', 'phrasing', 'flow'], isInteractive: true },
  textarea: { tag: 'textarea', category: 'interactive', categories: ['interactive', 'phrasing', 'flow'], isInteractive: true },
  label: { tag: 'label', category: 'phrasing', categories: ['interactive', 'phrasing', 'flow'], isInteractive: true },

  // Embedded content (also phrasing and flow)
  img: { tag: 'img', category: 'embedded', categories: ['embedded', 'phrasing', 'flow'], isEmbedded: true },
  video: { tag: 'video', category: 'embedded', categories: ['embedded', 'phrasing', 'flow'], isEmbedded: true },
  audio: { tag: 'audio', category: 'embedded', categories: ['embedded', 'phrasing', 'flow'], isEmbedded: true },
  canvas: { tag: 'canvas', category: 'embedded', categories: ['embedded', 'phrasing', 'flow'], isEmbedded: true },
  svg: { tag: 'svg', category: 'embedded', categories: ['embedded', 'phrasing', 'flow'], isEmbedded: true },
  iframe: { tag: 'iframe', category: 'embedded', categories: ['embedded', 'phrasing', 'flow'], isEmbedded: true },
  embed: { tag: 'embed', category: 'embedded', categories: ['embedded', 'phrasing', 'flow'], isEmbedded: true },
  object: { tag: 'object', category: 'embedded', categories: ['embedded', 'phrasing', 'flow'], isEmbedded: true },
  picture: { tag: 'picture', category: 'embedded', categories: ['embedded', 'phrasing', 'flow'], isEmbedded: true },
  math: { tag: 'math', category: 'embedded', categories: ['embedded', 'phrasing', 'flow'], isEmbedded: true },
  source: { tag: 'source', category: 'embedded', categories: ['embedded'], isEmbedded: true, allowedParents: ['picture', 'audio', 'video'] },
  track: { tag: 'track', category: 'embedded', categories: ['embedded'], isEmbedded: true, allowedParents: ['audio', 'video'] },

  // Form options
  option: {
    tag: 'option',
    category: 'form-option',
    categories: ['form-option'],
    allowedParents: ['select', 'NativeSelect', 'optgroup', 'NativeOptGroup', 'datalist'],
  },
  optgroup: {
    tag: 'optgroup',
    category: 'form-option',
    categories: ['form-option'],
    allowedParents: ['select', 'NativeSelect'],
  },

  // Table structure
  caption: { tag: 'caption', category: 'table-structure', categories: ['table-structure'], allowedParents: ['table', 'Table'] },
  colgroup: { tag: 'colgroup', category: 'table-structure', categories: ['table-structure'], allowedParents: ['table', 'Table'] },
  col: { tag: 'col', category: 'table-structure', categories: ['table-structure'], allowedParents: ['colgroup', 'table', 'Table'] },
  thead: { tag: 'thead', category: 'table-structure', categories: ['table-structure'], allowedParents: ['table', 'Table'] },
  tbody: { tag: 'tbody', category: 'table-structure', categories: ['table-structure'], allowedParents: ['table', 'Table'] },
  tfoot: { tag: 'tfoot', category: 'table-structure', categories: ['table-structure'], allowedParents: ['table', 'Table'] },
  tr: {
    tag: 'tr',
    category: 'table-structure',
    categories: ['table-structure'],
    allowedParents: ['table', 'thead', 'tbody', 'tfoot', 'Table', 'TableHeader', 'TableBody', 'TableFooter'],
  },
  th: { tag: 'th', category: 'table-structure', categories: ['table-structure'], allowedParents: ['tr', 'TableRow'] },
  td: { tag: 'td', category: 'table-structure', categories: ['table-structure'], allowedParents: ['tr', 'TableRow'] },

  // Transparent / Supporting
  template: { tag: 'template', category: 'transparent', categories: ['transparent', 'metadata', 'flow', 'phrasing'] },
  slot: { tag: 'slot', category: 'transparent', categories: ['transparent', 'flow', 'phrasing'] },
};

/**
 * Context-restricted elements that can only be placed as direct children of specific parents.
 * Covers both native HTML tags and their corresponding Design System component names.
 */
export const CONTEXT_RESTRICTED_ELEMENTS: Readonly<Record<string, readonly string[]>> = {
  // Summary & Legend
  summary: ['details'],
  legend: ['fieldset'],

  // Area
  area: ['map'],

  // Lists
  li: ['ul', 'ol', 'menu', 'List'],
  ListItem: ['ul', 'ol', 'menu', 'List'],

  // Definition lists
  dt: ['dl'],
  dd: ['dl'],

  // Tables
  caption: ['table', 'Table'],
  TableCaption: ['table', 'Table'],
  colgroup: ['table', 'Table'],
  col: ['colgroup', 'table', 'Table'],
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
  option: ['select', 'NativeSelect', 'optgroup', 'NativeOptGroup', 'datalist'],
  NativeOption: ['select', 'NativeSelect', 'optgroup', 'NativeOptGroup'],

  // Media
  source: ['picture', 'audio', 'video'],
  track: ['audio', 'video'],

  // Ruby
  rt: ['ruby'],
  rp: ['ruby'],

  // Figures
  figcaption: ['figure'],

  // Document structure
  html: [], // root only (no parent)
  head: ['html'],
  body: ['html'],

  // Metadata only
  title: ['head'],
  base: ['head'],
  meta: ['head'],
  link: ['head'],
  style: ['head'],
};

/**
 * Returns parent tags that are permitted for a context-restricted element, or undefined if unrestricted.
 */
export function getContextRestrictedParents(tag: string): readonly string[] | undefined {
  return CONTEXT_RESTRICTED_ELEMENTS[tag];
}

/**
 * Returns the HTML5 element definition for a native tag, or undefined if unknown.
 */
export function getHtmlElementDefinition(tag: string): HtmlElementDefinition | undefined {
  return HTML_ELEMENT_DEFINITIONS[tag.toLowerCase()];
}

/**
 * Returns all HTML5 content categories for a native HTML element.
 */
export function getNativeHtmlElementCategories(tag: string): readonly ContentCategory[] {
  return HTML_ELEMENT_DEFINITIONS[tag.toLowerCase()]?.categories ?? [];
}

/**
 * Returns true if the native HTML element is an interactive element.
 */
export function isNativeInteractiveElement(tag: string): boolean {
  return HTML_ELEMENT_DEFINITIONS[tag.toLowerCase()]?.isInteractive === true;
}

/**
 * Returns true if the native HTML element is an embedded element.
 */
export function isNativeEmbeddedElement(tag: string): boolean {
  return HTML_ELEMENT_DEFINITIONS[tag.toLowerCase()]?.isEmbedded === true;
}

/**
 * Returns true if the native HTML element is a metadata-only element.
 */
export function isNativeMetadataElement(tag: string): boolean {
  return HTML_ELEMENT_DEFINITIONS[tag.toLowerCase()]?.isMetadata === true;
}

/**
 * Structural and content category constraints derived directly from native HTML5 elements.
 */
export interface ElementConstraints {
  allowedChildCategories?: ContentCategory[];
  allowedChildTags?: string[];
  forbiddenChildTags?: string[];
}

export const HTML_ELEMENT_CONSTRAINTS: Readonly<Record<string, ElementConstraints>> = {
  // Lists - strict list-item structure
  ul: {
    allowedChildTags: ['li', 'ListItem'],
  },
  ol: {
    allowedChildTags: ['li', 'ListItem'],
  },
  menu: {
    allowedChildTags: ['li', 'ListItem'],
  },

  // Phrasing-only containers
  span: {
    allowedChildCategories: ['phrasing', 'transparent', 'text'],
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table', 'p', 'Text', 'details'],
  },
  p: {
    allowedChildCategories: ['phrasing', 'transparent', 'text'],
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table', 'p', 'details'],
  },
  h1: {
    allowedChildCategories: ['phrasing', 'transparent'],
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table', 'p', 'Text', 'Heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'details'],
  },
  h2: {
    allowedChildCategories: ['phrasing', 'transparent'],
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table', 'p', 'Text', 'Heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'details'],
  },
  h3: {
    allowedChildCategories: ['phrasing', 'transparent'],
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table', 'p', 'Text', 'Heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'details'],
  },
  h4: {
    allowedChildCategories: ['phrasing', 'transparent'],
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table', 'p', 'Text', 'Heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'details'],
  },
  h5: {
    allowedChildCategories: ['phrasing', 'transparent'],
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table', 'p', 'Text', 'Heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'details'],
  },
  h6: {
    allowedChildCategories: ['phrasing', 'transparent'],
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table', 'p', 'Text', 'Heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'details'],
  },
  button: {
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
      'Textarea',
      'a',
      'details',
      'div',
      'VStack',
      'HStack',
      'Grid',
      'Area',
      'Table',
    ],
  },
  label: {
    allowedChildCategories: ['phrasing', 'transparent'],
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table', 'p', 'Text', 'label', 'Label', 'details'],
  },

  // Legend & Summary - phrasing and heading only, no flow blocks
  legend: {
    allowedChildCategories: ['phrasing', 'heading', 'text', 'transparent'],
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table', 'p', 'Text', 'details'],
  },
  summary: {
    allowedChildCategories: ['phrasing', 'heading', 'text', 'transparent'],
    forbiddenChildTags: ['div', 'VStack', 'HStack', 'Grid', 'Area', 'Table', 'p', 'Text', 'details'],
  },

  // Details - allows summary and flow content
  details: {
    allowedChildCategories: ['flow', 'phrasing', 'transparent', 'text'],
  },

  // Fieldset - allows legend and flow content
  fieldset: {
    allowedChildCategories: ['flow', 'phrasing', 'transparent', 'text'],
  },

  // Metadata container
  head: {
    allowedChildCategories: ['metadata', 'transparent'],
    allowedChildTags: ['title', 'base', 'link', 'style', 'meta', 'script', 'noscript', 'template'],
  },

  // Definition lists
  dl: {
    allowedChildTags: ['dt', 'dd', 'div'],
  },

  // Tables
  table: {
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
  thead: {
    allowedChildCategories: ['table-structure', 'transparent'],
    allowedChildTags: ['TableRow', 'tr'],
  },
  tbody: {
    allowedChildCategories: ['table-structure', 'transparent'],
    allowedChildTags: ['TableRow', 'tr'],
  },
  tfoot: {
    allowedChildCategories: ['table-structure', 'transparent'],
    allowedChildTags: ['TableRow', 'tr'],
  },
  tr: {
    allowedChildCategories: ['table-structure', 'transparent'],
    allowedChildTags: ['TableCell', 'TableHead', 'td', 'th'],
  },

  // Select / Option
  select: {
    allowedChildCategories: ['form-option', 'transparent'],
    allowedChildTags: ['option', 'optgroup', 'NativeOption', 'NativeOptGroup'],
  },
  optgroup: {
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
      metadata.name === 'InlineCluster' ||
      metadata.name === 'HStack' ||
      metadata.name === 'VStack') &&
    asProp === 'span'
  ) {
    return 'phrasing';
  }
  if (
    asProp &&
    (metadata.name === 'Overline' ||
      metadata.name === 'MonoText' ||
      metadata.name === 'MetricText')
  ) {
    const nativeCat = getNativeHtmlElementCategory(asProp);
    if (nativeCat) {
      return nativeCat;
    }
  }
  return metadata.selfCategory;
}
