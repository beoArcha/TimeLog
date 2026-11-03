import ts from 'typescript';
import {
  COMPONENT_REGISTRY,
  ContentCategory,
  ElementConstraints,
  getContextRestrictedParents,
  getEffectiveContentCategory,
  getHtmlElementConstraints,
  getNativeHtmlElementCategory,
} from '../registry/component-registry';

/**
 * Classification of JSX element types to distinguish HTML primitives,
 * registered Design System components, known external libraries, and unresolved components.
 */
export type ElementKind =
  | 'native-html'
  | 'registered-ds'
  | 'known-external'
  | 'unresolved-component';

/**
 * Known third-party / external components (e.g. Lucide icons, Recharts, Motion, etc.)
 * used across the application.
 */
export const KNOWN_EXTERNAL_COMPONENTS: ReadonlySet<string> = new Set([
  // Recharts
  'ResponsiveContainer',
  'BarChart',
  'Bar',
  'LineChart',
  'Line',
  'PieChart',
  'Pie',
  'AreaChart',
  'Area',
  'XAxis',
  'YAxis',
  'ZAxis',
  'Tooltip',
  'Legend',
  'CartesianGrid',
  'Cell',
  'Sector',
  'Curve',
  'Rectangle',
  // Lucide Icons
  'Smile',
  'Search',
  'X',
  'ChevronDown',
  'ChevronUp',
  'ChevronLeft',
  'ChevronRight',
  'AlertTriangle',
  'AlertCircle',
  'CheckCircle2',
  'HelpCircle',
  'Inbox',
  'RefreshCw',
  'CloudUpload',
  'TrendingUp',
  'TrendingDown',
  'Minus',
  'Send',
  'Terminal',
  'ShieldCheck',
  'Sparkles',
  'Database',
  'Eye',
  'Edit3',
  'Trash2',
  'Check',
  'History',
  'Plus',
  'LucideIcon',
  // Motion
  'motion',
  'AnimatePresence',
  // External UI / providers
  'Toaster',
  'ThemeProvider',
]);

/**
 * Contextual information extracted for a visited JSX element.
 */
export interface JsxElementContext {
  /** The raw tag identifier or expression (e.g. 'VStack', 'div', 'motion.div') */
  tag: string;
  /** Explicit polymorphic override passed via the `as` prop, if statically resolved or 'dynamic' */
  as?: string;
  /** True if the `as` prop was passed as a dynamic expression or identifier */
  isDynamicAs: boolean;
  /** Resolution state of the explicit polymorphic `as` prop. */
  asStatus: AsPropStatus;
  /** The effective tag, or an explicit sentinel when `as` cannot be safely resolved. */
  effectiveTag: string | 'dynamic' | 'invalid' | 'unsupported';
  /** True if this is a custom React component (capitalized or member access) */
  isComponent: boolean;
  /** Explicit classification of JSX element kind */
  elementKind: ElementKind;
  /** 1-indexed line number in source file */
  line: number;
  /** 1-indexed column number in source file */
  column: number;
}

export interface WalkJsxOptions {
  /** Additional known external component tags or identifiers */
  knownExternalTags?: Set<string> | string[];
}

export type AsPropResult =
  | { kind: 'none' }
  | { kind: 'static'; tag: string }
  | { kind: 'dynamic' }
  | { kind: 'invalid' };

export type AsPropStatus = 'none' | 'resolved' | 'dynamic' | 'invalid' | 'unsupported';

/**
 * Extracts string representation of tag name from JSX opening or self-closing element.
 */
function extractTagName(node: ts.JsxTagNameExpression, sourceFile: ts.SourceFile): string {
  if (ts.isIdentifier(node)) {
    return node.text;
  }
  if (ts.isPropertyAccessExpression(node)) {
    return `${extractTagName(node.expression, sourceFile)}.${node.name.text}`;
  }
  return node.getText(sourceFile);
}

/**
 * Extracts and classifies the `as` prop from JSX attributes.
 * Resolves concrete tag names ONLY for static string values (e.g. as="span", as={"span"}).
 * Returns 'dynamic' for dynamic expressions and identifiers (e.g. as={layoutTag}, as={cond ? 'a' : 'b'}).
 * Returns 'invalid' for non-string literals (e.g. as={123}, as={true}, as="").
 */
function extractAsProp(attributes: ts.JsxAttributes, sourceFile: ts.SourceFile): AsPropResult {
  for (const prop of attributes.properties) {
    if (ts.isJsxAttribute(prop)) {
      const propName = ts.isIdentifier(prop.name) ? prop.name.text : prop.name.getText(sourceFile);
      if (propName === 'as') {
        if (!prop.initializer) {
          // Boolean attribute with no value: <Component as />
          return { kind: 'invalid' };
        }

        // Static string literal: as="span"
        if (ts.isStringLiteral(prop.initializer)) {
          const val = prop.initializer.text.trim();
          return val.length > 0 && /^[a-zA-Z][a-zA-Z0-9-.]*$/.test(val)
            ? { kind: 'static', tag: val }
            : { kind: 'invalid' };
        }

        if (ts.isJsxExpression(prop.initializer)) {
          const expr = prop.initializer.expression;
          if (!expr) {
            // Empty JSX expression: as={}
            return { kind: 'invalid' };
          }

          // Static string literal inside JSX expression: as={"span"} or as={`span`}
          if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
            const val = expr.text.trim();
            return val.length > 0 && /^[a-zA-Z][a-zA-Z0-9-.]*$/.test(val)
              ? { kind: 'static', tag: val }
              : { kind: 'invalid' };
          }

          // Static non-string literals: e.g. as={123}, as={true}, as={false}, as={null}
          if (
            ts.isNumericLiteral(expr) ||
            expr.kind === ts.SyntaxKind.TrueKeyword ||
            expr.kind === ts.SyntaxKind.FalseKeyword ||
            expr.kind === ts.SyntaxKind.NullKeyword ||
            (ts.isPrefixUnaryExpression(expr) && ts.isNumericLiteral(expr.operand))
          ) {
            return { kind: 'invalid' };
          }

          // Dynamic expressions (identifiers, conditionals, property access, function calls, etc.)
          return { kind: 'dynamic' };
        }

        return { kind: 'invalid' };
      }
    }
  }
  return { kind: 'none' };
}

/**
 * Classifies an element tag into one of four explicit categories:
 * - 'registered-ds': Present in COMPONENT_REGISTRY
 * - 'native-html': Lowercase tag without member access (e.g. 'div', 'span', 'h2')
 * - 'known-external': Third-party library component (e.g. Lucide icons, Recharts, Motion)
 * - 'unresolved-component': Any other uppercase or custom React component (not guessed as HTML)
 */
export function classifyElement(tag: string, externalIdentifiers?: Set<string>): ElementKind {
  if (tag in COMPONENT_REGISTRY) {
    return 'registered-ds';
  }

  if (/^[a-z][a-z0-9-]*$/.test(tag)) {
    return 'native-html';
  }

  if (tag === 'motion' || tag.startsWith('motion.')) {
    return 'known-external';
  }

  const rootTag = tag.split('.')[0];
  if (
    KNOWN_EXTERNAL_COMPONENTS.has(tag) ||
    KNOWN_EXTERNAL_COMPONENTS.has(rootTag) ||
    externalIdentifiers?.has(tag) ||
    externalIdentifiers?.has(rootTag)
  ) {
    return 'known-external';
  }

  return 'unresolved-component';
}

/**
 * Computes effective tag based on explicit `as` prop, COMPONENT_REGISTRY lookup,
 * or raw tag name fallback.
 */
export function computeEffectiveTag(
  tag: string,
  asResult: AsPropResult
): {
  effectiveTag: string | 'dynamic' | 'invalid' | 'unsupported';
  as?: string;
  isDynamicAs: boolean;
  asStatus: AsPropStatus;
} {
  if (asResult.kind === 'static') {
    const registryEntry = COMPONENT_REGISTRY[tag];
    if (registryEntry) {
      if (!registryEntry.supportedAs || !registryEntry.supportedAs.includes(asResult.tag)) {
        return { effectiveTag: 'unsupported', as: asResult.tag, isDynamicAs: false, asStatus: 'unsupported' };
      }
      return { effectiveTag: asResult.tag, as: asResult.tag, isDynamicAs: false, asStatus: 'resolved' };
    }

    return { effectiveTag: asResult.tag, as: asResult.tag, isDynamicAs: false, asStatus: 'resolved' };
  }

  if (asResult.kind === 'dynamic') {
    return { effectiveTag: 'dynamic', as: 'dynamic', isDynamicAs: true, asStatus: 'dynamic' };
  }

  if (asResult.kind === 'invalid') {
    return { effectiveTag: 'invalid', as: undefined, isDynamicAs: false, asStatus: 'invalid' };
  }

  const registryEntry = COMPONENT_REGISTRY[tag];
  const fallbackTag = registryEntry?.defaultTag ?? tag;
  return { effectiveTag: fallbackTag, as: undefined, isDynamicAs: false, asStatus: 'none' };
}

/**
 * Checks whether an element tag represents a transparent React Fragment.
 */
function isTransparentFragmentTag(tag: string): boolean {
  return tag === 'React.Fragment' || tag === 'Fragment';
}

/**
 * Finds all return statement expressions in a function body, avoiding nested functions.
 */
function findReturnExpressions(node: ts.Node): ts.Expression[] {
  const returns: ts.Expression[] = [];
  function visit(child: ts.Node) {
    if (
      ts.isFunctionDeclaration(child) ||
      ts.isFunctionExpression(child) ||
      ts.isArrowFunction(child)
    ) {
      return;
    }
    if (ts.isReturnStatement(child) && child.expression) {
      returns.push(child.expression);
    }
    ts.forEachChild(child, visit);
  }
  ts.forEachChild(node, visit);
  return returns;
}

/**
 * Checks if a call expression represents an array `.map()` call.
 */
function isMapCall(expr: ts.CallExpression): boolean {
  if (ts.isPropertyAccessExpression(expr.expression)) {
    return expr.expression.name.text === 'map';
  }
  return false;
}

/**
 * Collects external import identifiers from the source file.
 */
function collectExternalImports(sourceFile: ts.SourceFile): Set<string> {
  const externalIdentifiers = new Set<string>();

  for (const stmt of sourceFile.statements) {
    if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
      const specifier = stmt.moduleSpecifier.text;
      const isInternal =
        specifier.startsWith('.') ||
        specifier.startsWith('/') ||
        specifier.startsWith('@components/') ||
        specifier.startsWith('@features/') ||
        specifier.startsWith('@lib/') ||
        specifier.startsWith('@assets/') ||
        specifier.startsWith('@/');

      if (!isInternal && stmt.importClause) {
        if (stmt.importClause.name) {
          externalIdentifiers.add(stmt.importClause.name.text);
        }
        if (stmt.importClause.namedBindings) {
          if (ts.isNamespaceImport(stmt.importClause.namedBindings)) {
            externalIdentifiers.add(stmt.importClause.namedBindings.name.text);
          } else if (ts.isNamedImports(stmt.importClause.namedBindings)) {
            for (const elem of stmt.importClause.namedBindings.elements) {
              externalIdentifiers.add(elem.name.text);
            }
          }
        }
      }
    }
  }

  return externalIdentifiers;
}

/**
 * Traverses a TypeScript AST source file and emits (parent, child) pairs for all JSX elements.
 * Unwraps transparent elements (<React.Fragment>, <>...</>, conditionals, array mappings)
 * so that children reflect their effective enclosing JSX container and effective HTML tag.
 */
export function walkJsxTree(
  sourceFile: ts.SourceFile,
  callback: (parent: JsxElementContext | null, child: JsxElementContext) => void,
  options?: WalkJsxOptions
): void {
  const parentStack: JsxElementContext[] = [];
  const externalIdentifiers = collectExternalImports(sourceFile);

  if (options?.knownExternalTags) {
    for (const tag of options.knownExternalTags) {
      externalIdentifiers.add(tag);
    }
  }

  const getCurrentParent = (): JsxElementContext | null => {
    return parentStack.length > 0 ? parentStack[parentStack.length - 1] : null;
  };

  /**
   * Processes a JSX element or fragment node.
   */
  function processJsxNode(node: ts.Node): void {
    if (ts.isJsxFragment(node)) {
      // <>...</> is transparent: traverse children without pushing to parentStack
      processJsxChildren(node.children);
      return;
    }

    if (ts.isJsxElement(node)) {
      const tag = extractTagName(node.openingElement.tagName, sourceFile);

      if (isTransparentFragmentTag(tag)) {
        // <React.Fragment> or <Fragment> is transparent: traverse children without pushing
        processJsxChildren(node.children);
        return;
      }

      const asResult = extractAsProp(node.openingElement.attributes, sourceFile);
      const { effectiveTag, as: asProp, isDynamicAs, asStatus } = computeEffectiveTag(tag, asResult);
      const elementKind = classifyElement(tag, externalIdentifiers);
      const isComponent = elementKind !== 'native-html';
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(
        node.openingElement.getStart(sourceFile)
      );

      const elementContext: JsxElementContext = {
        tag,
        as: asProp,
        isDynamicAs,
        asStatus,
        effectiveTag,
        isComponent,
        elementKind,
        line: line + 1,
        column: character + 1,
      };

      const currentParent = getCurrentParent();
      callback(currentParent, elementContext);

      // Inspect any JSX expressions inside attributes (passed as props)
      processAttributes(node.openingElement.attributes);

      // Push current element as active parent for its children
      parentStack.push(elementContext);
      processJsxChildren(node.children);
      parentStack.pop();
      return;
    }

    if (ts.isJsxSelfClosingElement(node)) {
      const tag = extractTagName(node.tagName, sourceFile);

      if (isTransparentFragmentTag(tag)) {
        // Self-closing fragment has no children
        return;
      }

      const asResult = extractAsProp(node.attributes, sourceFile);
      const { effectiveTag, as: asProp, isDynamicAs, asStatus } = computeEffectiveTag(tag, asResult);
      const elementKind = classifyElement(tag, externalIdentifiers);
      const isComponent = elementKind !== 'native-html';
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart(sourceFile)
      );

      const elementContext: JsxElementContext = {
        tag,
        as: asProp,
        isDynamicAs,
        asStatus,
        effectiveTag,
        isComponent,
        elementKind,
        line: line + 1,
        column: character + 1,
      };

      const currentParent = getCurrentParent();
      callback(currentParent, elementContext);

      // Inspect any JSX expressions inside attributes
      processAttributes(node.attributes);
      return;
    }
  }

  /**
   * Checks JSX attributes for embedded JSX nodes (e.g. icon={<Icon />}, trigger={<Button />})
   * and walks them as independent subtrees with no parent enclosing them.
   * Ignores event handlers (e.g. onClick={() => ...}) and 'as' props.
   */
  function processAttributes(attributes: ts.JsxAttributes): void {
    for (const prop of attributes.properties) {
      if (ts.isJsxAttribute(prop) && prop.initializer) {
        const propName = ts.isIdentifier(prop.name) ? prop.name.text : prop.name.getText(sourceFile);
        if (propName === 'as' || /^on[A-Z]/.test(propName)) {
          continue;
        }
        if (ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
          processExpression(prop.initializer.expression, true);
        }
      }
    }
  }

  /**
   * Processes an array of JSX children.
   */
  function processJsxChildren(children: ts.NodeArray<ts.JsxChild>): void {
    for (const child of children) {
      if (ts.isJsxText(child)) {
        continue;
      }
      if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child) || ts.isJsxFragment(child)) {
        processJsxNode(child);
      } else if (ts.isJsxExpression(child) && child.expression) {
        processExpression(child.expression, false);
      }
    }
  }

  /**
   * Unwraps expressions (conditionals, logical expressions, array mappings)
   * maintaining the active parent on the stack.
   * Restricts callback analysis strictly to constructs representing rendered children (specifically `.map()` callbacks).
   * Arbitrary callbacks (e.g. useEffect, onClick, custom callbacks) are not traversed.
   */
  function processExpression(expr: ts.Expression, asIndependentTree: boolean): void {
    // Arbitrary function expressions (callbacks) are not rendered children
    if (ts.isArrowFunction(expr) || ts.isFunctionExpression(expr)) {
      return;
    }

    const savedStack = asIndependentTree ? [...parentStack] : null;
    if (asIndependentTree) {
      parentStack.length = 0;
    }

    try {
      if (ts.isParenthesizedExpression(expr)) {
        processExpression(expr.expression, false);
        return;
      }

      if (ts.isJsxElement(expr) || ts.isJsxSelfClosingElement(expr) || ts.isJsxFragment(expr)) {
        processJsxNode(expr);
        return;
      }

      // Conditional expression: cond ? <A/> : <B/>
      if (ts.isConditionalExpression(expr)) {
        processExpression(expr.whenTrue, false);
        processExpression(expr.whenFalse, false);
        return;
      }

      // Logical binary expression: cond && <A/>, a || <B/>, a ?? <C/>
      if (ts.isBinaryExpression(expr)) {
        if (
          expr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
          expr.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
          expr.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
        ) {
          processExpression(expr.left, false);
          processExpression(expr.right, false);
          return;
        }
      }

      // Rendered array mapping: items.map(item => <Row key={...} />)
      if (ts.isCallExpression(expr)) {
        if (isMapCall(expr)) {
          const callbackArg = expr.arguments[0];
          if (callbackArg) {
            if (ts.isArrowFunction(callbackArg)) {
              if (ts.isBlock(callbackArg.body)) {
                const returns = findReturnExpressions(callbackArg.body);
                for (const ret of returns) {
                  processExpression(ret, false);
                }
              } else {
                processExpression(callbackArg.body, false);
              }
            } else if (ts.isFunctionExpression(callbackArg)) {
              const returns = findReturnExpressions(callbackArg.body);
              for (const ret of returns) {
                processExpression(ret, false);
              }
            }
          }
        }
        // Do NOT traverse non-render call expressions (e.g. useEffect, onClick, custom callbacks)
        return;
      }

      // Array literal: [ <A key="1" />, <B key="2" /> ]
      if (ts.isArrayLiteralExpression(expr)) {
        for (const elem of expr.elements) {
          processExpression(elem, false);
        }
        return;
      }
    } finally {
      if (asIndependentTree && savedStack) {
        parentStack.length = 0;
        parentStack.push(...savedStack);
      }
    }
  }

  /**
   * Root AST visitor to discover all top-level JSX expressions or trees in the source file.
   */
  function visitRoot(node: ts.Node): void {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
      processJsxNode(node);
      return;
    }
    ts.forEachChild(node, visitRoot);
  }

  visitRoot(sourceFile);
}

export interface JsxValidationError {
  line: number;
  column: number;
  tag: string;
  parentTag: string | null;
  rule: 'unsupported-as' | 'invalid-as' | 'invalid-nesting' | 'forbidden-child';
  message: string;
}

/**
 * Resolves the effective content category of a JSX element, covering both
 * registered Design System components and standard native HTML elements.
 * Returns undefined when category is unknown or polymorphic `as` is dynamic.
 */
export function getElementContentCategory(
  element: JsxElementContext
): ContentCategory | undefined {
  if (element.asStatus === 'dynamic') {
    return undefined;
  }

  const meta = COMPONENT_REGISTRY[element.tag];
  if (meta) {
    return getEffectiveContentCategory(meta, element.as);
  }

  if (element.elementKind === 'native-html') {
    return getNativeHtmlElementCategory(element.effectiveTag);
  }

  return undefined;
}

/**
 * Checks whether a child's content category is compatible with the parent's allowed categories.
 * Flow content encompasses heading, sectioning, phrasing, interactive, embedded, and text content.
 */
export function isCategoryAllowed(
  allowedCategories: ContentCategory[],
  childCategory: ContentCategory
): boolean {
  if (allowedCategories.includes(childCategory)) {
    return true;
  }

  if (allowedCategories.includes('flow')) {
    return (
      childCategory === 'flow' ||
      childCategory === 'phrasing' ||
      childCategory === 'heading' ||
      childCategory === 'sectioning' ||
      childCategory === 'interactive' ||
      childCategory === 'embedded' ||
      childCategory === 'text'
    );
  }

  if (allowedCategories.includes('phrasing')) {
    return (
      childCategory === 'phrasing' ||
      childCategory === 'interactive' ||
      childCategory === 'embedded' ||
      childCategory === 'text'
    );
  }

  return false;
}

/**
 * Resolves the effective structural and content constraints for a parent JSX element.
 * Constraints are derived from the actual rendered HTML element (taking polymorphic `as` into account)
 * as well as Design System component metadata.
 * Returns undefined when `as` is dynamic or invalid, preventing inaccurate assumptions.
 */
export function getEffectiveParentConstraints(
  parent: JsxElementContext
): ElementConstraints | undefined {
  if (
    parent.asStatus === 'dynamic' ||
    parent.asStatus === 'invalid' ||
    parent.asStatus === 'unsupported'
  ) {
    return undefined;
  }

  // If the parent is an unresolved or external component without an explicit static `as` override,
  // do not introduce assumptions about its internal rendered HTML structure.
  if (
    (parent.elementKind === 'unresolved-component' || parent.elementKind === 'known-external') &&
    parent.asStatus === 'none'
  ) {
    return undefined;
  }

  const effectiveTag = parent.effectiveTag;
  if (
    !effectiveTag ||
    effectiveTag === 'dynamic' ||
    effectiveTag === 'invalid' ||
    effectiveTag === 'unsupported'
  ) {
    return undefined;
  }

  const componentMeta = COMPONENT_REGISTRY[parent.tag];
  const htmlConstraints = getHtmlElementConstraints(effectiveTag);

  if (!componentMeta && !htmlConstraints) {
    return undefined;
  }

  // 1. Allowed child tags:
  // Derived from the effective rendered HTML tag first (e.g. ul/ol/menu enforce li/ListItem structure),
  // falling back to component metadata (e.g. Table, NativeSelect).
  const allowedChildTags: string[] | undefined =
    htmlConstraints?.allowedChildTags ?? componentMeta?.allowedChildTags;

  // 2. Allowed child categories:
  // If the effective HTML tag specifies allowed child categories (e.g. span, p, button, label -> phrasing; option -> text),
  // that takes precedence over any general component category (e.g. VStack as="span" takes span's phrasing constraint).
  // Otherwise fall back to componentMeta.allowedChildCategories.
  const allowedChildCategories: ContentCategory[] | undefined =
    htmlConstraints?.allowedChildCategories ?? componentMeta?.allowedChildCategories;

  // 3. Forbidden child tags:
  // Combine forbidden tags from both the effective HTML element and the component metadata.
  const forbiddenSet = new Set<string>();
  if (htmlConstraints?.forbiddenChildTags) {
    for (const tag of htmlConstraints.forbiddenChildTags) {
      forbiddenSet.add(tag);
    }
  }
  if (componentMeta?.forbiddenChildTags) {
    for (const tag of componentMeta.forbiddenChildTags) {
      forbiddenSet.add(tag);
    }
  }
  const forbiddenChildTags = forbiddenSet.size > 0 ? Array.from(forbiddenSet) : undefined;

  return {
    allowedChildTags,
    allowedChildCategories,
    forbiddenChildTags,
  };
}

/**
 * Validates a JSX AST tree against Design System component metadata and HTML content models.
 */
export function validateJsxTree(
  sourceFile: ts.SourceFile,
  options?: WalkJsxOptions
): JsxValidationError[] {
  const violations: JsxValidationError[] = [];

  walkJsxTree(
    sourceFile,
    (parent, child) => {
      // 1. Validate polymorphic 'as' prop
      if (child.asStatus === 'unsupported') {
        violations.push({
          line: child.line,
          column: child.column,
          tag: child.tag,
          parentTag: parent ? parent.tag : null,
          rule: 'unsupported-as',
          message: `Component <${child.tag}> does not declare or support polymorphic as="${child.as}".`,
        });
      } else if (child.asStatus === 'invalid') {
        violations.push({
          line: child.line,
          column: child.column,
          tag: child.tag,
          parentTag: parent ? parent.tag : null,
          rule: 'invalid-as',
          message: `Invalid polymorphic 'as' prop passed to <${child.tag}>.`,
        });
      }

      // 2. Validate hierarchy / nesting constraints
      const childMeta = COMPONENT_REGISTRY[child.tag];
      const childCategory = getElementContentCategory(child);

      // Context-restricted elements validation (e.g. li, tables, select options, definition lists)
      const allowedParents =
        getContextRestrictedParents(child.tag) ??
        (child.effectiveTag ? getContextRestrictedParents(child.effectiveTag) : undefined);

      if (allowedParents !== undefined) {
        if (!parent) {
          const isSelectOption =
            childMeta?.selfCategory === 'form-option' ||
            childCategory === 'form-option' ||
            child.tag === 'NativeOption' ||
            child.tag === 'NativeOptGroup' ||
            child.tag === 'option' ||
            child.tag === 'optgroup';

          if (isSelectOption) {
            violations.push({
              line: child.line,
              column: child.column,
              tag: child.tag,
              parentTag: null,
              rule: 'invalid-nesting',
              message: `<${child.tag}> cannot be used at root level; it must be nested inside <NativeSelect>.`,
            });
          }
        } else if (parent.asStatus !== 'dynamic') {
          const isParentValid =
            allowedParents.includes(parent.tag) ||
            allowedParents.includes(parent.effectiveTag);

          if (!isParentValid) {
            violations.push({
              line: child.line,
              column: child.column,
              tag: child.tag,
              parentTag: parent.tag,
              rule: 'invalid-nesting',
              message: `<${child.tag}> cannot be placed inside <${parent.tag}>; it must be inside <${allowedParents.join(', ')}>.`,
            });
          }
        }
      }

      if (parent) {
        const constraints = getEffectiveParentConstraints(parent);

        if (constraints) {
          const isExplicitPhrasingOverride =
            child.effectiveTag === 'span' && childCategory === 'phrasing';

          // Check forbidden child tags
          const isChildTagForbidden =
            !isExplicitPhrasingOverride &&
            !child.isDynamicAs &&
            constraints.forbiddenChildTags?.includes(child.tag);

          const isEffectiveTagForbidden =
            !child.isDynamicAs &&
            constraints.forbiddenChildTags?.includes(child.effectiveTag);

          if (isChildTagForbidden || isEffectiveTagForbidden) {
            violations.push({
              line: child.line,
              column: child.column,
              tag: child.tag,
              parentTag: parent.tag,
              rule: 'forbidden-child',
              message: `<${child.tag}> is forbidden inside <${parent.tag}>.`,
            });
          }

          // Check allowed child tags
          if (constraints.allowedChildTags && constraints.allowedChildTags.length > 0) {
            const isTagAllowed =
              child.asStatus === 'dynamic' ||
              constraints.allowedChildTags.includes(child.tag) ||
              constraints.allowedChildTags.includes(child.effectiveTag);
            if (!isTagAllowed) {
              violations.push({
                line: child.line,
                column: child.column,
                tag: child.tag,
                parentTag: parent.tag,
                rule: 'invalid-nesting',
                message: `<${child.tag}> is not allowed inside <${parent.tag}>. Allowed tags: ${constraints.allowedChildTags.join(', ')}.`,
              });
            }
          }

          // Check allowed child categories
          if (constraints.allowedChildCategories) {
            // Text-only content model (e.g. NativeOption)
            if (
              constraints.allowedChildCategories.length === 1 &&
              constraints.allowedChildCategories[0] === 'text'
            ) {
              violations.push({
                line: child.line,
                column: child.column,
                tag: child.tag,
                parentTag: parent.tag,
                rule: 'invalid-nesting',
                message: `<${parent.tag}> accepts text content only; element <${child.tag}> is not allowed.`,
              });
            } else {
              if (
                childCategory &&
                childCategory !== 'transparent' &&
                !isCategoryAllowed(constraints.allowedChildCategories, childCategory)
              ) {
                violations.push({
                  line: child.line,
                  column: child.column,
                  tag: child.tag,
                  parentTag: parent.tag,
                  rule: 'invalid-nesting',
                  message: `<${child.tag}> (${childCategory}) is not allowed inside <${parent.tag}> (allowed categories: ${constraints.allowedChildCategories.join(', ')}).`,
                });
              }
            }
          }
        }
      }
    },
    options
  );

  return violations;
}
