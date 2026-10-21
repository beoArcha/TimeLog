import fs from 'fs';
import ts from 'typescript';
import { ArchitectureRule, ModuleGraph, RuleViolation } from '../core/types';

export interface MaxNestedIfsOptions {
  maxDepth?: number;
  allowlist?: Set<string> | string[];
}

export const MAX_ALLOWED_IF_DEPTH = 2;

export const NESTED_IFS_MIGRATION_ALLOWLIST = new Set<string>();

/**
 * Architectural Rule: Rule of 3 Nested Ifs.
 * Forbids nesting if statements 3 or more levels deep to prevent arrow anti-patterns
 * and enforce cyclomatic clarity across TypeScript components and utilities.
 */
export class MaxNestedIfsRule implements ArchitectureRule<MaxNestedIfsOptions> {
  public readonly name = 'max-nested-ifs';
  public readonly description =
    'Forbids nesting if statements 3 or more levels deep (Rule of 3 Ifs: depth >= 3 triggers failure).';

  public check(graph: ModuleGraph, options?: MaxNestedIfsOptions): RuleViolation[] {
    const maxDepth = options?.maxDepth ?? MAX_ALLOWED_IF_DEPTH;
    const allowlistSet = options?.allowlist
      ? new Set(Array.isArray(options.allowlist) ? options.allowlist : Array.from(options.allowlist))
      : NESTED_IFS_MIGRATION_ALLOWLIST;

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
      violations.push(...this.scanAst(fileContent, normalizedId, maxDepth));
    }

    return violations;
  }

  public scanAst(
    sourceText: string,
    filePath: string,
    maxDepth: number = MAX_ALLOWED_IF_DEPTH
  ): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const walk = (node: ts.Node, ifDepth: number) => {
      let currentDepth = ifDepth;
      if (ts.isIfStatement(node)) {
        currentDepth = ifDepth + 1;
        if (currentDepth > maxDepth) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          violations.push({
            rule: this.name,
            file: filePath,
            line: line + 1,
            message: `Architectural Violation: Nested if statement on line ${line + 1} reaches depth ${currentDepth}, exceeding maximum permitted depth of ${maxDepth}. Refactor using guard clauses or extract helper functions.`,
          });
        }
      }

      ts.forEachChild(node, (child) => {
        // Flatten 'else if' statements so they stay at the same depth as the parent branch
        if (ts.isIfStatement(node) && node.elseStatement === child && ts.isIfStatement(child)) {
          walk(child, ifDepth);
        } else {
          walk(child, currentDepth);
        }
      });
    };

    walk(sourceFile, 0);
    return violations;
  }
}
