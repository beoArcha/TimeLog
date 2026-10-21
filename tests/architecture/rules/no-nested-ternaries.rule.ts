import fs from 'fs';
import ts from 'typescript';
import { ArchitectureRule, ModuleGraph, RuleViolation } from '../core/types';

export interface NoNestedTernariesOptions {
  allowlist?: Set<string> | string[];
}

export const NO_NESTED_TERNARIES_ALLOWLIST = new Set<string>();

function unwrapParens(node: ts.Node): ts.Node {
  let current = node;
  while (ts.isParenthesizedExpression(current)) {
    current = current.expression;
  }
  return current;
}

/**
 * Architectural Rule: No Nested Ternaries.
 * Forbids nesting ternary conditional expressions (`? :`) inside other ternary expressions,
 * and forbids excessive chaining or mixing of nullish coalescing (`??`) without proper decomposition.
 */
export class NoNestedTernariesRule implements ArchitectureRule<NoNestedTernariesOptions> {
  public readonly name = 'no-nested-ternaries';
  public readonly description =
    'Forbids nested ternary expressions (? :) and deep nullish coalescing (??) chains to guarantee cyclomatic clarity.';

  public check(graph: ModuleGraph, options?: NoNestedTernariesOptions): RuleViolation[] {
    const allowlistSet = options?.allowlist
      ? new Set(Array.isArray(options.allowlist) ? options.allowlist : Array.from(options.allowlist))
      : NO_NESTED_TERNARIES_ALLOWLIST;

    const violations: RuleViolation[] = [];

    for (const [nodeId, node] of graph.nodes) {
      const normalizedId = nodeId.replace(/\\/g, '/');
      if (
        normalizedId.includes('.test.') ||
        normalizedId.includes('.spec.') ||
        normalizedId.includes('bindings/') ||
        allowlistSet.has(normalizedId)
      ) {
        continue;
      }

      const fileContent = fs.readFileSync(node.absolutePath, 'utf-8');
      violations.push(...this.scanAst(fileContent, normalizedId));
    }

    return violations;
  }

  public scanAst(sourceText: string, filePath: string): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const checkConditionalBranches = (node: ts.ConditionalExpression) => {
      const cond = unwrapParens(node.condition);
      const trueBranch = unwrapParens(node.whenTrue);
      const falseBranch = unwrapParens(node.whenFalse);

      if (ts.isConditionalExpression(cond)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(cond.getStart());
        violations.push({
          rule: this.name,
          file: filePath,
          line: line + 1,
          message: `Architectural Violation: Nested ternary expression in condition branch on line ${line + 1}. Decompose into early return or intermediate boolean variable.`,
        });
      }

      if (ts.isConditionalExpression(trueBranch)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(trueBranch.getStart());
        violations.push({
          rule: this.name,
          file: filePath,
          line: line + 1,
          message: `Architectural Violation: Nested ternary expression in true branch on line ${line + 1}. Refactor using if/else statements or separate helper functions.`,
        });
      }

      if (ts.isConditionalExpression(falseBranch)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(falseBranch.getStart());
        violations.push({
          rule: this.name,
          file: filePath,
          line: line + 1,
          message: `Architectural Violation: Nested/chained ternary expression in false branch on line ${line + 1}. Refactor into map lookup, switch, or if/else blocks.`,
        });
      }
    };

    const checkNullishDepth = (node: ts.BinaryExpression) => {
      let depth = 1;
      let left = unwrapParens(node.left);
      while (ts.isBinaryExpression(left) && left.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
        depth++;
        left = unwrapParens(left.left);
      }
      if (depth > 2) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        violations.push({
          rule: this.name,
          file: filePath,
          line: line + 1,
          message: `Architectural Violation: Nullish coalescing operator (??) nested ${depth} levels deep on line ${line + 1}. Extract fallback resolution into a helper.`,
        });
      }
    };

    const walk = (node: ts.Node) => {
      if (ts.isConditionalExpression(node)) {
        checkConditionalBranches(node);
      }
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
        checkNullishDepth(node);
      }

      ts.forEachChild(node, walk);
    };

    walk(sourceFile);
    return violations;
  }
}
