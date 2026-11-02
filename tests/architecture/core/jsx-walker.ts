import ts from 'typescript';
import { COMPONENT_REGISTRY } from '../registry/component-registry';

/**
 * Contextual information extracted for a visited JSX element.
 */
export interface JsxElementContext {
  /** The raw tag identifier or expression (e.g. 'VStack', 'div', 'motion.div') */
  tag: string;
  /** Explicit polymorphic override passed via the `as` prop, if present */
  as?: string;
  /** The effective HTML/DOM or component tag after resolving `as` and defaultTag */
  effectiveTag: string;
  /** True if this is a custom React component (capitalized or member access) */
  isComponent: boolean;
  /** 1-indexed line number in source file */
  line: number;
  /** 1-indexed column number in source file */
  column: number;
}

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
 * Extracts the value of the `as` prop from JSX attributes if present.
 * Supports string literals ('span', "span"), template literals, identifiers, and member expressions.
 */
function extractAsProp(attributes: ts.JsxAttributes, sourceFile: ts.SourceFile): string | undefined {
  for (const prop of attributes.properties) {
    if (ts.isJsxAttribute(prop)) {
      const propName = ts.isIdentifier(prop.name) ? prop.name.text : prop.name.getText(sourceFile);
      if (propName === 'as') {
        if (!prop.initializer) {
          return undefined;
        }
        if (ts.isStringLiteral(prop.initializer)) {
          return prop.initializer.text;
        }
        if (ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
          const expr = prop.initializer.expression;
          if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
            return expr.text;
          }
          if (ts.isIdentifier(expr)) {
            return expr.text;
          }
          if (ts.isPropertyAccessExpression(expr)) {
            return expr.getText(sourceFile);
          }
          const text = expr.getText(sourceFile);
          return text.replace(/^['"`]|['"`]$/g, '');
        }
      }
    }
  }
  return undefined;
}

/**
 * Determines whether a tag represents a React component (custom/design system)
 * versus a raw HTML primitive.
 */
function isComponentTag(tag: string): boolean {
  return /^[A-Z]/.test(tag) || tag.includes('.');
}

/**
 * Computes effective tag based on explicit `as` prop, COMPONENT_REGISTRY lookup,
 * or raw tag name fallback.
 */
function computeEffectiveTag(tag: string, asProp?: string): string {
  if (asProp) {
    return asProp;
  }
  const registryEntry = COMPONENT_REGISTRY[tag];
  if (registryEntry?.defaultTag) {
    return registryEntry.defaultTag;
  }
  return tag;
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
 * Traverses a TypeScript AST source file and emits (parent, child) pairs for all JSX elements.
 * Unwraps transparent elements (<React.Fragment>, <>...</>, conditionals, array mappings)
 * so that children reflect their effective enclosing JSX container and effective HTML tag.
 */
export function walkJsxTree(
  sourceFile: ts.SourceFile,
  callback: (parent: JsxElementContext | null, child: JsxElementContext) => void
): void {
  const parentStack: JsxElementContext[] = [];

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

      const asProp = extractAsProp(node.openingElement.attributes, sourceFile);
      const effectiveTag = computeEffectiveTag(tag, asProp);
      const isComponent = isComponentTag(tag);
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(
        node.openingElement.getStart(sourceFile)
      );

      const elementContext: JsxElementContext = {
        tag,
        as: asProp,
        effectiveTag,
        isComponent,
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

      const asProp = extractAsProp(node.attributes, sourceFile);
      const effectiveTag = computeEffectiveTag(tag, asProp);
      const isComponent = isComponentTag(tag);
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart(sourceFile)
      );

      const elementContext: JsxElementContext = {
        tag,
        as: asProp,
        effectiveTag,
        isComponent,
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
   */
  function processAttributes(attributes: ts.JsxAttributes): void {
    for (const prop of attributes.properties) {
      if (ts.isJsxAttribute(prop) && prop.initializer) {
        const propName = ts.isIdentifier(prop.name) ? prop.name.text : prop.name.getText(sourceFile);
        if (propName !== 'as') {
          if (ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
            processExpression(prop.initializer.expression, true);
          }
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
   * Unwraps expressions (conditionals, logical expressions, mappings, function calls)
   * maintaining the active parent on the stack.
   */
  function processExpression(expr: ts.Expression, asIndependentTree: boolean): void {
    // If this expression is inside an attribute prop, it should not inherit the current parent
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

      // Array mapping or call expression: items.map(item => <Row key={...} />)
      if (ts.isCallExpression(expr)) {
        for (const arg of expr.arguments) {
          if (ts.isArrowFunction(arg)) {
            if (ts.isBlock(arg.body)) {
              const returns = findReturnExpressions(arg.body);
              for (const ret of returns) {
                processExpression(ret, false);
              }
            } else {
              processExpression(arg.body, false);
            }
          } else if (ts.isFunctionExpression(arg)) {
            const returns = findReturnExpressions(arg.body);
            for (const ret of returns) {
              processExpression(ret, false);
            }
          } else {
            processExpression(arg, false);
          }
        }

        // Also check if expression being called is an IIFE: (() => <Child />)()
        if (ts.isParenthesizedExpression(expr.expression)) {
          const inner = expr.expression.expression;
          if (ts.isArrowFunction(inner)) {
            if (ts.isBlock(inner.body)) {
              const returns = findReturnExpressions(inner.body);
              for (const ret of returns) {
                processExpression(ret, false);
              }
            } else {
              processExpression(inner.body, false);
            }
          } else if (ts.isFunctionExpression(inner)) {
            const returns = findReturnExpressions(inner.body);
            for (const ret of returns) {
              processExpression(ret, false);
            }
          }
        }
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
      // processJsxNode already traverses all nested children and JSX expressions
      return;
    }
    ts.forEachChild(node, visitRoot);
  }

  visitRoot(sourceFile);
}
