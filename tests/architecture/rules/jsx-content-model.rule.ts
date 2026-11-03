import fs from 'fs';
import ts from 'typescript';
import { ArchitectureRule, ModuleGraph, RuleViolation } from '../core/types';
import { validateJsxTree } from '../core/jsx-walker';

export interface JsxContentModelOptions {
  allowlist?: Set<string> | string[];
  maxViolations?: number;
}

/**
 * Migration allowlist of views scheduled for refactoring in upcoming phases:
 * - DataTableViewer.tsx (custom row and cell subcomponents inside TableBody and TableRow)
 * - ReportPeriodSelector.tsx, CreditsTab.tsx, TrayWidgetView.tsx (awaiting PR #5 Badge/InlineCluster span refactor)
 */
export const LEGACY_JSX_CONTENT_MODEL_ALLOWLIST = new Set<string>([
  'features/db-explorer/components/DataTableViewer.tsx',
  'features/reports/components/ReportPeriodSelector.tsx',
  'features/settings/CreditsTab.tsx',
  'features/tray/TrayWidgetView.tsx',
]);

/**
 * Architectural Rule: Enforces structural JSX constraints, content category compatibility, and polymorphic 'as' prop contracts.
 */
export class JsxContentModelRule implements ArchitectureRule<JsxContentModelOptions> {
  public readonly name = 'jsx-content-model';
  public readonly description =
    'Enforces structural JSX constraints, content category compatibility, and polymorphic as prop contracts for Design System primitives and key HTML elements.';

  public check(graph: ModuleGraph, options?: JsxContentModelOptions): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const effectiveAllowlist =
      options?.allowlist !== undefined
        ? options.allowlist
        : LEGACY_JSX_CONTENT_MODEL_ALLOWLIST;

    const allowlistSet = new Set(
      Array.isArray(effectiveAllowlist) ? effectiveAllowlist : Array.from(effectiveAllowlist)
    );

    for (const [nodeId, node] of graph.nodes) {
      const normalizedId = nodeId.replace(/\\/g, '/');

      // Exclude Design System primitives and test files
      if (
        normalizedId.startsWith('components/ui/') ||
        normalizedId.endsWith('.test.tsx') ||
        normalizedId.endsWith('.spec.tsx') ||
        !normalizedId.endsWith('.tsx')
      ) {
        continue;
      }

      if (allowlistSet.has(normalizedId)) {
        continue;
      }

      const fileContent = fs.readFileSync(node.absolutePath, 'utf-8');
      const fileViolations = this.scanAst(fileContent, normalizedId);
      violations.push(...fileViolations);
    }

    return violations;
  }

  /**
   * Scans a TSX source string for HTML5 content model violations using validateJsxTree.
   */
  public scanAst(sourceText: string, filePath: string): RuleViolation[] {
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    const errors = validateJsxTree(sourceFile);

    return errors.map(err => ({
      rule: this.name,
      file: filePath,
      line: err.line,
      message: `[${err.rule}] ${err.message}`,
      target: err.tag,
    }));
  }
}
